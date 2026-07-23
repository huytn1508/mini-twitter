const { supabaseAdmin } = require('../config/supabase');

/**
 * Tạo notification (dùng chung cho mọi controller)
 */
async function createNotification({ userId, actorId, type, referenceId }) {
  if (userId === actorId) return; // Không tự notify chính mình
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      type,
      reference_id: referenceId || null,
    });
  } catch (err) { console.error('Notification error:', err.message); }
}

/**
 * GET /api/notifications — Lấy notifications của user
 */
async function getNotifications(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .select(`*, actor:profiles!notifications_actor_id_fkey (username, display_name, avatar_url)`, { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formatted = (data || []).map(n => ({
      id: n.id,
      type: n.type,
      reference_id: n.reference_id,
      is_read: n.is_read,
      created_at: n.created_at,
      actor: n.actor ? {
        username: n.actor.username,
        display_name: n.actor.display_name,
        avatar_url: n.actor.avatar_url,
      } : null,
    }));

    res.json({ notifications: formatted, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
}

/**
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res, next) {
  try {
    const { count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id).eq('is_read', false);
    res.json({ count: count || 0 });
  } catch (err) { next(err); }
}

/**
 * POST /api/notifications/read-all
 */
async function readAll(req, res, next) {
  try {
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
    res.json({ message: 'Đã đọc tất cả' });
  } catch (err) { next(err); }
}

module.exports = { createNotification, getNotifications, getUnreadCount, readAll };
