const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/posts/:postId/like
 * Toggle like/unlike: nếu đã like thì unlike, chưa like thì like.
 */
async function toggle(req, res, next) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Kiểm tra post tồn tại
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra đã like chưa
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', parseInt(postId))
      .maybeSingle();

    if (existingLike) {
      // UNLIKE — đã like rồi thì unlike
      const { error } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;

      return res.json({ liked: false, message: 'Đã bỏ like' });
    } else {
      // LIKE — chưa like thì thêm
      const { error } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: userId,
          post_id: parseInt(postId),
        });

      if (error) throw error;

      return res.json({ liked: true, message: 'Đã like' });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { toggle };
