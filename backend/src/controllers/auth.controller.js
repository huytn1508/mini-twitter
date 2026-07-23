const { supabaseAdmin, supabaseAnon } = require('../config/supabase');

/**
 * POST /api/auth/register
 * Dùng supabaseAnon.auth.signUp() — tương thích với key định dạng sb_publishable_
 */
async function register(req, res, next) {
  try {
    const { email, password, username, display_name } = req.body;

    // 1. Tạo user qua signUp (anon client)
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name },
      },
    });

    if (authError) {
      if (authError.message?.includes('already') || authError.code === 'user_already_exists') {
        return res.status(409).json({ error: 'Email này đã được đăng ký' });
      }
      throw authError;
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Đăng ký thất bại, thử lại sau' });
    }

    // 2. Cập nhật profile với username và display_name do user chọn
    // Dùng supabaseAdmin (service_role) để bypass RLS
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ username, display_name })
      .eq('id', authData.user.id);

    if (profileError) {
      // Nếu username bị trùng, xóa user auth và báo lỗi
      try { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); } catch (_) {}
      if (profileError.code === '23505') {
        return res.status(409).json({ error: 'Username này đã tồn tại' });
      }
      throw profileError;
    }

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Dùng supabaseAnon.auth.signInWithPassword()
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Lấy thêm profile info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Đăng nhập thành công',
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
        bio: profile?.bio,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Trả về thông tin user hiện tại
 */
async function getMe(req, res, next) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Không tìm thấy profile' });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        ...profile,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Gửi email reset password qua Supabase Auth
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://mini-twitter-tau-rosy.vercel.app/reset-password'
      : (process.env.FRONTEND_URL || 'http://localhost:5173') + '/reset-password';

    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    // Luôn trả về success để tránh lộ email có tồn tại hay không
    if (error) {
      console.error('Reset password error:', error.message);
    }
    res.json({ message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Cập nhật mật khẩu mới (sau khi user click link email)
 * Nhận session_hash từ URL để xác thực
 */
async function resetPassword(req, res, next) {
  try {
    const { password, session_hash } = req.body;

    // Parse access_token từ URL hash
    let accessToken = null;
    let refreshToken = null;
    if (session_hash) {
      const hashParams = new URLSearchParams(session_hash.replace('#', ''));
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Link không hợp lệ. Vui lòng thử lại.' });
    }

    // Set session từ access token rồi update password
    const { error: sessionError } = await supabaseAnon.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError) {
      return res.status(400).json({ error: 'Link đã hết hạn. Vui lòng gửi lại yêu cầu.' });
    }

    const { error } = await supabaseAnon.auth.updateUser({ password });

    if (error) {
      return res.status(400).json({ error: 'Đặt lại mật khẩu thất bại. Thử lại!' });
    }

    res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/check-email
 * Kiểm tra email đã đăng ký chưa (query bảng auth.users qua raw SQL)
 * Đồng thời từ chối email rác/domain tạm.
 */
async function checkEmail(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.json({ exists: false });

    // Từ chối domain email rác/tạm
    const { isDisposableEmail } = require('../utils/disposable-domains');
    const check = isDisposableEmail(email);
    if (check.blocked) {
      return res.json({ exists: true, disposable: true, message: `"${check.domain}" là email tạm, vui lòng dùng email thật` });
    }

    // Query auth.users qua schema auth
    const { data, error } = await supabaseAdmin.rpc('check_email_exists', { email_input: email.toLowerCase() });

    if (error) {
      // RPC không hoạt động — fallback: mặc định true để UX không bị chặn
      return res.json({ exists: true });
    }

    res.json({ exists: data === true });
  } catch (err) {
    // Fallback: nếu có lỗi vẫn cho phép gửi reset
    res.json({ exists: true });
  }
}

/**
 * POST /api/auth/refresh
 * Làm mới access token từ refresh token
 */
async function refreshToken(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Thiếu refresh token' });

    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
    }

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, forgotPassword, resetPassword, checkEmail, refreshToken };
