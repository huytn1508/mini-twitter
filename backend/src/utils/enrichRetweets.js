const { supabaseAdmin } = require('../config/supabase');

/**
 * Nhúng dữ liệu post gốc vào các retweet/quote trong danh sách (batch 1 query)
 * Dùng chung cho posts, users, hashtags controllers.
 */
async function enrichRetweets(posts) {
  const retweetIds = [...new Set(
    (posts || []).filter(p => p.retweet_post_id).map(p => p.retweet_post_id)
  )];
  if (retweetIds.length === 0) return posts;

  const { data: originals } = await supabaseAdmin
    .from('posts')
    .select(`*, profiles:user_id (username, display_name, avatar_url)`)
    .in('id', retweetIds);

  const map = {};
  (originals || []).forEach(o => {
    map[o.id] = {
      id: o.id,
      content: o.content,
      image_url: o.image_url,
      images: o.images || [],
      gif_url: o.gif_url || null,
      created_at: o.created_at,
      user: {
        id: o.user_id,
        username: o.profiles?.username,
        display_name: o.profiles?.display_name,
        avatar_url: o.profiles?.avatar_url,
      },
    };
  });

  return posts.map(p => ({
    ...p,
    retweet: p.retweet_post_id ? { original_post: map[p.retweet_post_id] || null } : null,
  }));
}

module.exports = enrichRetweets;
