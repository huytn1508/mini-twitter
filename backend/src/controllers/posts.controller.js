const { supabaseAdmin } = require('../config/supabase');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload ảnh lên Supabase Storage.
 * Resize về max 1200px width, tối ưu cho web.
 * Trả về public URL.
 */
async function uploadImage(file) {
  if (!file) return null;

  // Resize & nén ảnh bằng sharp
  const optimized = await sharp(file.buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const filename = `posts/${uuidv4()}.jpg`;

  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(filename, optimized, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  // Lấy public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

/**
 * GET /api/posts
 * Newsfeed tất cả bài viết, sắp xếp mới nhất.
 * Hỗ trợ phân trang: ?page=1&limit=20
 * Nếu có user (optionalAuth) thì kiểm tra đã like chưa.
 */
async function getAll(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const { data: posts, error, count } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        likes (user_id),
        comments (id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format dữ liệu trả về
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
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

/**
 * GET /api/posts/following
 * Feed cá nhân hóa: chỉ hiển thị bài viết của người mình follow.
 */
async function getFollowing(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    // Lấy danh sách user_id mà current user đang follow
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', req.user.id);

    const followingIds = following?.map(f => f.following_id) || [];

    // Nếu chưa follow ai, trả về rỗng
    if (followingIds.length === 0) {
      return res.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Lấy bài viết từ những người đang follow
    const { data: posts, error, count } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        likes (user_id),
        comments (id)
      `, { count: 'exact' })
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      user: {
        id: post.user_id,
        username: post.profiles?.username,
        display_name: post.profiles?.display_name,
        avatar_url: post.profiles?.avatar_url,
      },
      likes_count: post.likes?.length || 0,
      comments_count: post.comments?.length || 0,
      is_liked: post.likes?.some(like => like.user_id === req.user.id),
    }));

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

/**
 * POST /api/posts
 * Tạo bài viết mới (có thể kèm ảnh).
 */
async function create(req, res, next) {
  try {
    let imageUrl = null;

    // Upload ảnh nếu có
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    const { content } = req.body;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: req.user.id,
        content,
        image_url: imageUrl,
      })
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Đăng bài thành công',
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        user: {
          id: post.user_id,
          username: post.profiles?.username,
          display_name: post.profiles?.display_name,
          avatar_url: post.profiles?.avatar_url,
        },
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/posts/:id
 * Chi tiết 1 bài viết + comments.
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url),
        likes (user_id),
        comments (
          id, content, created_at,
          user_id,
          profiles:user_id (username, display_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    res.json({
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
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
        // Sắp xếp comments cũ nhất trước
        comments: (post.comments || [])
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map(c => ({
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
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/posts/:id
 * Chỉ chủ bài viết mới được sửa.
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const { data: existing, error: findError } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bài viết này' });
    }

    const { content } = req.body;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.json({
      message: 'Cập nhật thành công',
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        user: {
          id: post.user_id,
          username: post.profiles?.username,
          display_name: post.profiles?.display_name,
          avatar_url: post.profiles?.avatar_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/posts/:id
 * Chỉ chủ bài viết mới được xóa.
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const { data: existing, error: findError } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này' });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Đã xóa bài viết' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getFollowing, create, getById, update, remove };
