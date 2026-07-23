const { supabaseAdmin } = require('../config/supabase');

/**
 * Helper: Extract hashtags from text
 * Returns array of lowercase tag names (without #)
 */
function extractHashtags(text) {
  const matches = text.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))];
}

/**
 * Helper: Save hashtags + post_hashtags for a post
 */
async function syncPostHashtags(postId, content) {
  const tags = extractHashtags(content);
  if (tags.length === 0) return [];

  const results = [];
  for (const tag of tags) {
    // Insert hashtag (ignore if already exists)
    const { data: ht } = await supabaseAdmin
      .from('hashtags')
      .upsert({ name: tag }, { onConflict: 'name' })
      .select('id')
      .single();

    if (ht) {
      // Link post <-> hashtag
      await supabaseAdmin
        .from('post_hashtags')
        .upsert({ post_id: postId, hashtag_id: ht.id }, { onConflict: 'post_id,hashtag_id' });
      results.push(tag);
    }
  }
  return results;
}

/**
 * GET /api/hashtags/:tag
 * Lấy danh sách posts chứa hashtag
 */
async function getPostsByTag(req, res, next) {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const tagName = tag.toLowerCase();

    // Find hashtag
    const { data: hashtag } = await supabaseAdmin
      .from('hashtags')
      .select('id')
      .eq('name', tagName)
      .single();

    if (!hashtag) {
      return res.json({ tag: tagName, posts: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // Get post IDs that have this hashtag
    const { data: links, count } = await supabaseAdmin
      .from('post_hashtags')
      .select('post_id', { count: 'exact' })
      .eq('hashtag_id', hashtag.id)
      .order('post_id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!links || links.length === 0) {
      return res.json({ tag: tagName, posts: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const postIds = links.map(l => l.post_id);

    // Fetch full posts
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select(`*, profiles:user_id (username, display_name, avatar_url), likes (user_id), comments (id)`)
      .in('id', postIds)
      .order('created_at', { ascending: false });

    const formattedPosts = (posts || []).map(post => ({
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
      is_liked: req.user ? post.likes?.some(l => l.user_id === req.user.id) : false,
    }));

    res.json({
      tag: tagName,
      posts: formattedPosts,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPostsByTag, syncPostHashtags, extractHashtags };
