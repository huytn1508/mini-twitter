const { supabaseAdmin } = require('../config/supabase');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { syncPostHashtags } = require('./hashtags.controller');
const enrichRetweets = require('../utils/enrichRetweets');

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
 * Upload video lên Supabase Storage.
 * Không xử lý qua sharp (sharp không hỗ trợ video).
 * Trả về public URL.
 */
async function uploadVideo(file) {
  if (!file) return null;

  const ext = file.mimetype === 'video/quicktime' ? '.mov' :
              file.mimetype === 'video/webm' ? '.webm' : '.mp4';
  const filename = `videos/${uuidv4()}${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('images')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(filename);

  return data.publicUrl;
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
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format dữ liệu trả về
    let formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      images: post.images || [],
      gif_url: post.gif_url || null,
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
      is_liked: req.user ? post.likes?.some(like => like.user_id === req.user.id) : false,
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
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    let formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      images: post.images || [],
      gif_url: post.gif_url || null,
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
      is_liked: req.user ? post.likes?.some(like => like.user_id === req.user.id) : false,
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

/**
 * POST /api/posts
 * Tạo bài viết mới (có thể kèm ảnh).
 */
async function create(req, res, next) {
  try {
    const { content, is_sensitive, scheduled_at, gif_url } = req.body;

    // Upload ảnh + video từ req.files (fields: images[], video[0])
    let imageUrl = null;
    const images = [];
    let videoUrl = null;

    const imageFiles = req.files?.images || [];
    const videoFile = req.files?.video?.[0] || null;

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const url = await uploadImage(file);
        images.push(url);
      }
      imageUrl = images[0];
    }

    if (videoFile) {
      videoUrl = await uploadVideo(videoFile);
    }

    const isScheduled = scheduled_at && new Date(scheduled_at) > new Date();

    // Ràng buộc: video HOẶC ảnh HOẶC GIF (ưu tiên video > GIF > ảnh)
    const finalVideoUrl = videoUrl || null;
    const finalGifUrl = finalVideoUrl ? null : (gif_url?.trim() || null);
    const finalImages = (finalVideoUrl || finalGifUrl) ? null : (images.length > 0 ? images : null);
    const finalImageUrl = (finalVideoUrl || finalGifUrl) ? null : (imageUrl || null);

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: req.user.id,
        content: content?.trim() || '',
        image_url: finalImageUrl,
        images: finalImages,
        gif_url: finalGifUrl,
        video_url: finalVideoUrl,
        is_sensitive: is_sensitive === 'true' || is_sensitive === true,
        scheduled_at: scheduled_at || null,
        is_published: !isScheduled,
      })
      .select(`
        *,
        profiles:user_id (username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Extract & save hashtags
    const hashtags = await syncPostHashtags(post.id, content);

    res.status(201).json({
      message: 'Đăng bài thành công',
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        images: post.images || [],
        gif_url: post.gif_url || null,
        video_url: post.video_url || null,
        is_sensitive: post.is_sensitive || false,
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
        hashtags,
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

    // Chặn xem scheduled posts (trừ chủ bài)
    if (!post.is_published && (!req.user || req.user.id !== post.user_id)) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    res.json({
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        images: post.images || [],
        is_sensitive: post.is_sensitive || false,
        retweet_type: post.retweet_type || null,
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

    // Sync hashtags sau khi update content
    const hashtags = await syncPostHashtags(post.id, content);

    res.json({
      message: 'Cập nhật thành công',
      post: {
        id: post.id,
        content: post.content,
        image_url: post.image_url,
        images: post.images || [],
        gif_url: post.gif_url || null,
        video_url: post.video_url || null,
        is_sensitive: post.is_sensitive || false,
        created_at: post.created_at,
        user: {
          id: post.user_id,
          username: post.profiles?.username,
          display_name: post.profiles?.display_name,
          avatar_url: post.profiles?.avatar_url,
        },
        hashtags,
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

/**
 * POST /api/posts/:id/retweet
 * Retweet thuần (không caption)
 */
async function retweet(req, res, next) {
  try {
    const { id } = req.params;

    // Lấy post gốc (cần user_id để check self-retweet + tạo notification)
    const { data: original } = await supabaseAdmin
      .from('posts').select('id,user_id').eq('id', id).single();
    if (!original) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    if (original.user_id === req.user.id) return res.status(400).json({ error: 'Không thể retweet bài của chính mình' });

    // Check trùng lặp
    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('id').eq('user_id', req.user.id).eq('retweet_post_id', parseInt(id)).eq('retweet_type', 'retweet').maybeSingle();
    if (existing) return res.status(400).json({ error: 'Bạn đã retweet bài này rồi' });

    // Tạo post retweet (không content)
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: req.user.id,
        content: '',
        retweet_type: 'retweet',
        retweet_post_id: parseInt(id),
        retweet_user_id: req.user.id,
      })
      .select(`*, profiles:user_id (username, display_name, avatar_url)`)
      .single();

    if (error) throw error;

    // Tạo notification cho chủ post gốc
    const { createNotification } = require('./notifications.controller');
    await createNotification({ userId: original.user_id, actorId: req.user.id, type: 'retweet', referenceId: post.id });

    res.status(201).json({ message: 'Đã retweet', post: await formatPostWithRetweet(post, req.user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/posts/:id/quote
 * Quote tweet (có caption)
 */
async function quoteRetweet(req, res, next) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const { data: original } = await supabaseAdmin
      .from('posts').select('id,user_id').eq('id', id).single();
    if (!original) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: req.user.id,
        content,
        retweet_type: 'quote',
        retweet_post_id: parseInt(id),
        retweet_user_id: req.user.id,
      })
      .select(`*, profiles:user_id (username, display_name, avatar_url)`)
      .single();

    if (error) throw error;

    // Sync hashtags cho quote
    const hashtags = await syncPostHashtags(post.id, content);

    // Tạo notification nếu quote bài của người khác
    if (original.user_id !== req.user.id) {
      const { createNotification } = require('./notifications.controller');
      await createNotification({ userId: original.user_id, actorId: req.user.id, type: 'quote', referenceId: post.id });
    }

    const formatted = await formatPostWithRetweet(post, req.user);
    res.status(201).json({ message: 'Đã quote', post: { ...formatted, hashtags } });
  } catch (err) {
    next(err);
  }
}

/**
 * Format post có kèm retweet info (dùng cho response create retweet/quote)
 */
async function formatPostWithRetweet(post, authUser) {
  const formatted = {
    id: post.id,
    content: post.content,
    image_url: post.image_url,
    images: post.images || [],
    gif_url: post.gif_url || null,
    is_sensitive: post.is_sensitive || false,
    created_at: post.created_at,
    retweet_type: post.retweet_type || null,
    user: post.profiles ? {
      id: post.user_id,
      username: post.profiles.username,
      display_name: post.profiles.display_name,
      avatar_url: post.profiles.avatar_url,
    } : null,
    likes_count: 0,
    comments_count: 0,
    is_liked: false,
    retweet: null,
  };

  // Nếu là retweet, lấy thông tin post gốc
  if (post.retweet_post_id) {
    const { data: original } = await supabaseAdmin
      .from('posts')
      .select(`*, profiles:user_id (username, display_name, avatar_url), likes (user_id), comments (id)`)
      .eq('id', post.retweet_post_id)
      .single();

    if (original) {
      formatted.retweet = {
        original_post: {
          id: original.id,
          content: original.content,
          image_url: original.image_url,
          created_at: original.created_at,
          user: {
            id: original.user_id,
            username: original.profiles?.username,
            display_name: original.profiles?.display_name,
            avatar_url: original.profiles?.avatar_url,
          },
          likes_count: original.likes?.length || 0,
          comments_count: original.comments?.length || 0,
          is_liked: authUser ? original.likes?.some(l => l.user_id === authUser.id) : false,
        },
      };
    }
  }

  return formatted;
}

module.exports = { getAll, getFollowing, create, getById, update, remove, retweet, quoteRetweet };
