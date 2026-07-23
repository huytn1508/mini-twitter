const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/posts/:postId/comments
 * Lấy danh sách comment của 1 bài viết.
 */
async function getByPost(req, res, next) {
  try {
    const { postId } = req.params;

    // Kiểm tra post tồn tại
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        id, content, created_at,
        user_id,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user: {
          id: c.user_id,
          username: c.profiles?.username,
          display_name: c.profiles?.display_name,
          avatar_url: c.profiles?.avatar_url,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/posts/:postId/comments
 * Thêm comment mới vào bài viết.
 */
async function create(req, res, next) {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    // Kiểm tra post tồn tại
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: req.user.id,
        post_id: parseInt(postId),
        content,
      })
      .select(`
        id, content, created_at,
        user_id,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Đã thêm bình luận',
      comment: {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          id: comment.user_id,
          username: comment.profiles?.username,
          display_name: comment.profiles?.display_name,
          avatar_url: comment.profiles?.avatar_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/posts/:postId/comments/:id
 * Chỉ chủ comment mới được xóa.
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const { data: existing, error: findError } = await supabaseAdmin
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
    }

    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Đã xóa bình luận' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getByPost, create, remove };
