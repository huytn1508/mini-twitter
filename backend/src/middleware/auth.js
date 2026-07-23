const { supabaseAnon } = require('../config/supabase');

/**
 * Middleware xác thực người dùng qua Supabase JWT.
 * Lấy token từ header Authorization: Bearer <token>
 * Verify với Supabase, gắn user vào req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token với Supabase Auth
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // { id, email, ... }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware tùy chọn: không bắt buộc có token.
 * Nếu có token hợp lệ thì gắn req.user, nếu không thì vẫn cho qua.
 * Dùng cho các route public nhưng muốn biết user đã login chưa.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (!error && user) {
      req.user = user;
    }
  } catch (err) {
    // Không chặn request nếu verify lỗi
  }
  next();
}

module.exports = { authenticate, optionalAuth };
