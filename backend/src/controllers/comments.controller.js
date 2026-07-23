const { supabaseAdmin } = require('../config/supabase');
const { createNotification } = require('./notifications.controller');

/**
 * Helper: extract @mentions from text, save to DB, create notifications
 */
async function processMentions(text, userId, postId, commentId) {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return;
  const usernames = [...new Set(matches.map(m => m.slice(1)))];

  for (const username of usernames) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('username', username).single();
    if (profile && profile.id !== userId) {
      await supabaseAdmin.from('mentions').insert({
        post_id: postId || null,
        comment_id: commentId || null,
        user_id: userId,
        mentioned_user_id: profile.id,
      });
      await createNotification({ userId: profile.id, actorId: userId, type: 'mention', referenceId: postId || commentId });
    }
  }
}

/**
 * GET /api/posts/:postId/comments — Lấy comments + replies lồng
 */
async function getByPost(req, res, next) {
  try {
    const { postId } = req.params;
    const { data: post } = await supabaseAdmin.from('posts').select('id').eq('id', postId).single();
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`id, content, created_at, parent_comment_id, user_id, profiles:user_id (username, display_name, avatar_url)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Xây dựng tree: comments cha trước, replies lồng vào
    const topLevel = (comments || []).filter(c => !c.parent_comment_id);
    const replies = (comments || []).filter(c => c.parent_comment_id);

    function formatComment(c) {
      const children = replies.filter(r => r.parent_comment_id === c.id).map(formatComment);
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        parent_comment_id: c.parent_comment_id,
        user: { id: c.user_id, username: c.profiles?.username, display_name: c.profiles?.display_name, avatar_url: c.profiles?.avatar_url },
        replies: children,
      };
    }

    res.json({ comments: topLevel.map(formatComment) });
  } catch (err) { next(err); }
}

/**
 * POST /api/posts/:postId/comments — Tạo comment (có thể reply)
 */
async function create(req, res, next) {
  try {
    const { postId } = req.params;
    const { content, parent_comment_id } = req.body;

    const { data: post } = await supabaseAdmin.from('posts').select('id, user_id').eq('id', postId).single();
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: req.user.id,
        post_id: parseInt(postId),
        content,
        parent_comment_id: parent_comment_id ? parseInt(parent_comment_id) : null,
      })
      .select(`id, content, created_at, parent_comment_id, user_id, profiles:user_id (username, display_name, avatar_url)`)
      .single();

    if (error) throw error;

    // Notify post owner
    if (post.user_id !== req.user.id && !parent_comment_id) {
      await createNotification({ userId: post.user_id, actorId: req.user.id, type: 'comment', referenceId: parseInt(postId) });
    }

    // Process @mentions
    await processMentions(content, req.user.id, parseInt(postId), comment.id);

    res.status(201).json({
      message: 'Đã thêm bình luận',
      comment: {
        id: comment.id, content: comment.content, created_at: comment.created_at,
        parent_comment_id: comment.parent_comment_id,
        user: { id: comment.user_id, username: comment.profiles?.username, display_name: comment.profiles?.display_name, avatar_url: comment.profiles?.avatar_url },
        replies: [],
      },
    });
  } catch (err) { next(err); }
}

/**
 * DELETE /api/posts/:postId/comments/:id
 */
async function remove(req, res, next) {
  try {
    const { id, postId } = req.params;
    const { data: existing } = await supabaseAdmin.from('comments').select('user_id,post_id').eq('id', id).single();
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    if (existing.post_id !== parseInt(postId)) return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
    await supabaseAdmin.from('comments').delete().eq('id', id);
    res.json({ message: 'Đã xóa bình luận' });
  } catch (err) { next(err); }
}

module.exports = { getByPost, create, remove };
