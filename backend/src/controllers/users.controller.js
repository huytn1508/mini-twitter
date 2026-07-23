const { supabaseAdmin } = require('../config/supabase');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const enrichRetweets = require('../utils/enrichRetweets');

/**
 * Upload avatar lên Supabase Storage.
 */
async function uploadAvatar(file) {
  if (!file) return null;

  const optimized = await sharp(file.buffer)
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  const filename = `avatars/${uuidv4()}.jpg`;

  const { error } = await supabaseAdmin.storage
    .from('images')
    .upload(filename, optimized, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(filename);

  return data.publicUrl;
}

/**
 * GET /api/users/:username
 * Xem profile của user khác (hoặc chính mình).
 */
async function getProfile(req, res, next) {
  try {
    const { username } = req.params;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Đếm số followers, following, posts
    const [
      { count: followersCount },
      { count: followingCount },
      { count: postsCount },
    ] = await Promise.all([
      supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_published', true),
    ]);

    // Nếu user đã login, kiểm tra có đang follow profile này không
    let isFollowing = false;
    if (req.user && req.user.id !== profile.id) {
      const { data: follow } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', req.user.id)
        .eq('following_id', profile.id)
        .maybeSingle();
      isFollowing = !!follow;
    }

    res.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount,
        is_following: isFollowing,
        is_own_profile: req.user ? req.user.id === profile.id : false,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/me
 * Cập nhật profile (display_name, username, bio, avatar).
 */
async function updateProfile(req, res, next) {
  try {
    const updates = {};

    if (req.body.display_name) updates.display_name = req.body.display_name;
    if (req.body.username) updates.username = req.body.username;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;

    // Upload avatar nếu có
    if (req.file) {
      updates.avatar_url = await uploadAvatar(req.file);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });
    }

    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Username này đã tồn tại' });
      }
      throw error;
    }

    res.json({
      message: 'Cập nhật profile thành công',
      profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:username/posts
 * Danh sách bài viết của 1 user.
 */
async function getUserPosts(req, res, next) {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    // Tìm user_id từ username
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const isOwnProfile = req.user && req.user.id === profile.id;
    let query = supabaseAdmin
      .from('posts')
      .select(`*, profiles:user_id (username, display_name, avatar_url), likes (user_id), comments (id)`, { count: 'exact' })
      .eq('user_id', profile.id);

    // Chỉ chủ profile mới xem được bài chưa publish
    if (!isOwnProfile) query = query.eq('is_published', true);

    const { data: posts, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    let formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      images: post.images || [],
      is_sensitive: post.is_sensitive || false,
      retweet_type: post.retweet_type || null,
      retweet_post_id: post.retweet_post_id || null,
      created_at: post.created_at,
      user: {
        id: post.user_id,
        username: post.profiles?.username,
        display_name: post.profiles?.display_name,
        avatar_url: post.profiles?.avatar_url,
      },
      likes_count: post.likes?.length || 0,
      comments_count: post.comments?.length || 0,
      is_liked: req.user
        ? post.likes?.some(like => like.user_id === req.user.id)
        : false,
    }));

    formattedPosts = await enrichRetweets(formattedPosts);

    res.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getUserPosts };
