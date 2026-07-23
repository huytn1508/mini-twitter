import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://mini-twitter-api-c149.onrender.com/api' : '/api');

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token management ──────────────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// ── Request interceptor: Attach token ─────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: Auto-refresh on 401 ─────
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Chỉ refresh nếu là lỗi 401 và chưa retry lần nào
    if (err.response?.status === 401 && !originalRequest._retry) {
      // Không refresh cho chính request login/register/refresh
      if (originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(err);
      }

      originalRequest._retry = true;

      // Nếu đang refresh, queue request này lại
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
          return client(originalRequest);
        });
      }

      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // Không có refresh token → logout
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }

      try {
        // Gọi API refresh
        const res = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newToken = res.data.token;
        const newRefreshToken = res.data.refresh_token;

        localStorage.setItem('token', newToken);
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default client;
