const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const postsRoutes = require('./routes/posts.routes');
const commentsRoutes = require('./routes/comments.routes');
const likesRoutes = require('./routes/likes.routes');
const followsRoutes = require('./routes/follows.routes');
const usersRoutes = require('./routes/users.routes');
const hashtagsRoutes = require('./routes/hashtags.routes');

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Root — API info
app.get('/', (req, res) => {
  res.json({
    name: 'Mini Twitter API',
    version: '1.0.0',
    docs: '/api/health',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/posts',
      'GET  /api/posts/following',
      'POST /api/posts',
      'GET  /api/posts/:id',
      'PUT  /api/posts/:id',
      'DELETE /api/posts/:id',
      'POST /api/posts/:id/like',
      'GET  /api/posts/:id/comments',
      'POST /api/posts/:id/comments',
      'GET  /api/users/:username',
      'PUT  /api/users/me',
      'POST /api/users/:userId/follow',
    ],
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/posts', commentsRoutes);  // nested: /api/posts/:postId/comments
app.use('/api/posts', likesRoutes);     // nested: /api/posts/:postId/like
app.use('/api/users', followsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/hashtags', hashtagsRoutes);

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
