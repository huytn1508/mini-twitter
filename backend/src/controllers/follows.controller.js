const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/users/:userId/follow
 * Toggle follow/unfollow user.
 */
async function toggle(req, res, next) {
  try {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;

    // Không thể tự follow chính mình
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Không thể follow chính mình' });
    }

    // Kiểm tra user tồn tại
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', followingId)
      .single();

    if (!targetUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra đã follow chưa
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existingFollow) {
      // UNFOLLOW
      const { error } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      if (error) throw error;

      return res.json({ following: false, message: 'Đã unfollow' });
    } else {
      // FOLLOW
      const { error } = await supabaseAdmin
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Bạn đã follow người này rồi' });
        }
        throw error;
      }

      return res.json({ following: true, message: 'Đã follow' });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:username/followers
 * Danh sách người follow user.
 */
async function getFollowers(req, res, next) {
  try {
    const { username } = req.params;

    // Tìm user_id từ username
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const { data: followers } = await supabaseAdmin
      .from('follows')
      .select(`
        follower:profiles!follows_follower_id_fkey (id, username, display_name, avatar_url)
      `)
      .eq('following_id', profile.id);

    res.json({
      followers: followers.map(f => f.follower),
      count: followers.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:username/following
 * Danh sách người user đang follow.
 */
async function getFollowing(req, res, next) {
  try {
    const { username } = req.params;

    // Tìm user_id từ username
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const { data: following } = await supabaseAdmin
      .from('follows')
      .select(`
        following:profiles!follows_following_id_fkey (id, username, display_name, avatar_url)
      `)
      .eq('follower_id', profile.id);

    res.json({
      following: following.map(f => f.following),
      count: following.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggle, getFollowers, getFollowing };
