const { supabaseAdmin } = require('../config/supabase');
const enrichRetweets = require('../utils/enrichRetweets');

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
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    let formattedPosts = (posts || []).map(post => ({
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
      is_liked: req.user ? post.likes?.some(l => l.user_id === req.user.id) : false,
    }));

    formattedPosts = await enrichRetweets(formattedPosts);

    res.json({
      tag: tagName,
      posts: formattedPosts,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trending?period=day|week
 * Top 10 hashtag trong 24h hoặc 7 ngày
 */
async function getTrending(req, res, next) {
  try {
    const period = req.query.period === 'week' ? '7 days' : '1 day';

    const { data, error } = await supabaseAdmin.rpc('get_trending', { period_interval: period });

    if (error) {
      // Fallback: đếm từ post_hashtags (không lọc theo thời gian vì bảng này không có created_at)
      const { data: fallback } = await supabaseAdmin
        .from('post_hashtags')
        .select(`hashtag_id, hashtags:hashtag_id (name)`)
        .limit(200);

      if (fallback) {
        const counts = {};
        fallback.forEach(p => {
          if (p.hashtags?.name) {
            counts[p.hashtags.name] = (counts[p.hashtags.name] || 0) + 1;
          }
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        return res.json({ trending: sorted.map(([name, count]) => ({ name, count })), period: req.query.period || 'day' });
      }
      return res.json({ trending: [], period: req.query.period || 'day' });
    }

    res.json({ trending: data || [], period: req.query.period || 'day' });
  } catch (err) { next(err); }
}

/**
 * GET /api/search?q=keyword
 */
async function searchPosts(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.json({ posts: [] });
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = (page - 1) * limit;

    const { data: posts, error, count } = await supabaseAdmin
      .from('posts')
      .select(`*, profiles:user_id (username, display_name, avatar_url), likes (user_id), comments (id)`, { count: 'exact' })
      .eq('is_published', true)
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

        let result = (posts || []).map(p => ({ id: p.id, content: p.content, image_url: p.image_url, images: p.images || [], is_sensitive: p.is_sensitive || false, retweet_type: p.retweet_type || null, retweet_post_id: p.retweet_post_id || null, created_at: p.created_at, user: { id: p.user_id, username: p.profiles?.username, display_name: p.profiles?.display_name, avatar_url: p.profiles?.avatar_url }, likes_count: p.likes?.length || 0, comments_count: p.comments?.length || 0 }));
    result = await enrichRetweets(result);
    res.json({ posts: result, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
}

module.exports = { getPostsByTag, syncPostHashtags, extractHashtags, getTrending, searchPosts };
