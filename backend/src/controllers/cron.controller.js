const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/cron/publish-scheduled
 * Được cron-job.org gọi mỗi phút
 * Tìm bài scheduled đến giờ → publish
 */
async function publishScheduled(req, res, next) {
  try {
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('is_published', false)
      .lte('scheduled_at', new Date().toISOString());

    if (posts?.length > 0) {
      const ids = posts.map(p => p.id);
      await supabaseAdmin.from('posts').update({ is_published: true }).in('id', ids);
      console.log(`Published ${ids.length} scheduled posts`);
    }

    res.json({ published: posts?.length || 0 });
  } catch (err) { next(err); }
}

module.exports = { publishScheduled };
