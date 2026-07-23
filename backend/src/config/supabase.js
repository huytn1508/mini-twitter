const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Admin client (service_role) — dùng cho các thao tác server-side
// KHÔNG BAO GIỜ expose key này ra frontend
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Anon client — dùng để verify JWT từ user gửi lên
const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

module.exports = { supabaseAdmin, supabaseAnon };
