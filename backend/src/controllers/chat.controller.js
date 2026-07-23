const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/chat/conversations — Danh sách conversations và last message
 */
async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;

    // Lấy conversations của user
    const { data: convs, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Lấy info của người kia + last message + unread count
    const result = await Promise.all((convs || []).map(async (c) => {
      const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const { data: profile } = await supabaseAdmin.from('profiles').select('username,display_name,avatar_url').eq('id', otherId).single();

      const { data: lastMsg } = await supabaseAdmin.from('messages').select('content,created_at,sender_id').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).single();

      const { count } = await supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', c.id).eq('is_read', false).neq('sender_id', userId);

      return {
        id: c.id,
        other_user: profile || {},
        last_message: lastMsg ? { content: lastMsg.content, created_at: lastMsg.created_at, is_mine: lastMsg.sender_id === userId } : null,
        unread_count: count || 0,
      };
    }));

    res.json({ conversations: result });
  } catch (err) { next(err); }
}

/**
 * GET /api/chat/conversations/:id/messages
 */
async function getMessages(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select(`*, sender:profiles!messages_sender_id_fkey (username, display_name, avatar_url)`)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    // Mark as read
    await supabaseAdmin.from('messages').update({ is_read: true }).eq('conversation_id', id).neq('sender_id', userId);

    res.json({ messages: (data || []).map(m => ({ id: m.id, content: m.content, created_at: m.created_at, is_read: m.is_read, sender: m.sender ? { username: m.sender.username, display_name: m.sender.display_name, avatar_url: m.sender.avatar_url } : null, is_mine: m.sender_id === userId })) });
  } catch (err) { next(err); }
}

/**
 * POST /api/chat/conversations/:id/messages
 */
async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin.from('messages').insert({ conversation_id: id, sender_id: userId, content }).select().single();
    if (error) throw error;

    res.status(201).json({ message: { id: data.id, content: data.content, created_at: data.created_at, is_mine: true } });
  } catch (err) { next(err); }
}

/**
 * POST /api/chat/start — Tạo hoặc lấy conversation với user khác
 */
async function startConversation(req, res, next) {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('username', username).single();
    if (!profile) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    if (profile.id === userId) return res.status(400).json({ error: 'Không thể nhắn tin với chính mình' });

    // Đảm bảo user1 < user2
    const [u1, u2] = userId < profile.id ? [userId, profile.id] : [profile.id, userId];

    // Tìm hoặc tạo
    const { data: existing } = await supabaseAdmin.from('conversations').select('id').eq('user1_id', u1).eq('user2_id', u2).single();
    if (existing) return res.json({ conversation_id: existing.id });

    const { data: created } = await supabaseAdmin.from('conversations').insert({ user1_id: u1, user2_id: u2 }).select('id').single();
    res.status(201).json({ conversation_id: created.id });
  } catch (err) { next(err); }
}

/**
 * GET /api/chat/unread-count
 */
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const { data: convs } = await supabaseAdmin.from('conversations').select('id').or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (!convs?.length) return res.json({ count: 0 });

    const ids = convs.map(c => c.id);
    const { count } = await supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', ids).eq('is_read', false).neq('sender_id', userId);
    res.json({ count: count || 0 });
  } catch (err) { next(err); }
}

module.exports = { getConversations, getMessages, sendMessage, startConversation, getUnreadCount };
