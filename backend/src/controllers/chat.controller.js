const { supabaseAdmin } = require('../config/supabase');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload ảnh trong chat lên Supabase Storage
 */
async function uploadChatImage(file) {
  if (!file) return null;
  const optimized = await sharp(file.buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  const filename = `chats/${uuidv4()}.jpg`;
  const { error } = await supabaseAdmin.storage
    .from('images')
    .upload(filename, optimized, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from('images').getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * GET /api/chat/conversations — Danh sách conversations + last message + unread
 */
async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: convs, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) throw error;

    const result = await Promise.all((convs || []).map(async (c) => {
      const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;

      const [{ data: profile }, { data: lastMsg }, { count }] = await Promise.all([
        supabaseAdmin.from('profiles').select('username,display_name,avatar_url').eq('id', otherId).single(),
        supabaseAdmin.from('messages')
          .select('content,image_url,created_at,sender_id,is_read')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabaseAdmin.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .eq('is_read', false)
          .neq('sender_id', userId),
      ]);

      return {
        id: c.id,
        other_user: profile || {},
        last_message: lastMsg ? {
          content: lastMsg.content,
          image_url: lastMsg.image_url,
          created_at: lastMsg.created_at,
          is_mine: lastMsg.sender_id === userId,
          is_read: lastMsg.is_read,
        } : null,
        unread_count: count || 0,
        updated_at: lastMsg?.created_at || c.created_at,
      };
    }));

    // Sắp xếp theo tin nhắn mới nhất
    result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({ conversations: result });
  } catch (err) { next(err); }
}

/**
 * GET /api/chat/conversations/:id/messages — Lịch sử tin nhắn (paginated)
 */
async function getMessages(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor-based pagination

    let query = supabaseAdmin
      .from('messages')
      .select(`*, sender:profiles(username, display_name, avatar_url)`)
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) throw error;

    // Đánh dấu đã đọc
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('is_read', false);

    const messages = (data || []).reverse().map(m => ({
      id: m.id,
      content: m.content,
      image_url: m.image_url || null,
      created_at: m.created_at,
      is_read: m.is_read,
      read_at: m.read_at || null,
      sender: m.sender ? {
        username: m.sender.username,
        display_name: m.sender.display_name,
        avatar_url: m.sender.avatar_url,
      } : null,
      is_mine: m.sender_id === userId,
    }));

    res.json({ messages });
  } catch (err) { next(err); }
}

/**
 * POST /api/chat/conversations/:id/messages — Gửi tin nhắn (text + optional image)
 */
async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Upload ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadChatImage(req.file);
    }

    if (!content?.trim() && !imageUrl) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung hoặc gửi ảnh' });
    }

    const insertData = {
      conversation_id: id,
      sender_id: userId,
      content: content?.trim() || '',
      image_url: imageUrl,
    };

    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert(insertData)
      .select(`*, sender:profiles(username, display_name, avatar_url)`)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: {
        id: msg.id,
        content: msg.content,
        image_url: msg.image_url || null,
        created_at: msg.created_at,
        is_read: false,
        sender: msg.sender ? {
          username: msg.sender.username,
          display_name: msg.sender.display_name,
          avatar_url: msg.sender.avatar_url,
        } : null,
        is_mine: true,
      },
    });
  } catch (err) { next(err); }
}

/**
 * PUT /api/chat/conversations/:id/read — Đánh dấu tất cả đã đọc
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await supabaseAdmin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .eq('is_read', false);

    res.json({ success: true });
  } catch (err) { next(err); }
}

/**
 * POST /api/chat/start — Tạo conversation mới (tìm hoặc tạo)
 */
async function startConversation(req, res, next) {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập username' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id,username,display_name,avatar_url')
      .eq('username', username.trim())
      .single();

    if (!profile) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    if (profile.id === userId) return res.status(400).json({ error: 'Không thể nhắn tin với chính mình' });

    // Đảm bảo user1 < user2
    const [u1, u2] = userId < profile.id ? [userId, profile.id] : [profile.id, userId];

    // Tìm hoặc tạo
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .maybeSingle();

    if (existing) {
      return res.json({
        conversation_id: existing.id,
        other_user: {
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
      });
    }

    const { data: created } = await supabaseAdmin
      .from('conversations')
      .insert({ user1_id: u1, user2_id: u2 })
      .select('id')
      .single();

    res.status(201).json({
      conversation_id: created.id,
      other_user: {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/chat/search-users?q=username — Tìm user để bắt đầu chat
 */
async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.json({ users: [] });

    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('username,display_name,avatar_url')
      .neq('id', userId)
      .ilike('username', `${q.trim()}%`)
      .limit(10);

    if (error) throw error;
    res.json({ users: data || [] });
  } catch (err) { next(err); }
}

/**
 * GET /api/chat/unread-count
 */
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const { data: convs } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!convs?.length) return res.json({ count: 0 });

    const ids = convs.map(c => c.id);
    const { count } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .eq('is_read', false)
      .neq('sender_id', userId);

    res.json({ count: count || 0 });
  } catch (err) { next(err); }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  startConversation,
  searchUsers,
  getUnreadCount,
};
