const router = require('express').Router();
const postsController = require('../controllers/posts.controller');
const validate = require('../middleware/validate');
const { createPostSchema, updatePostSchema } = require('../validators/posts.validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/posts — Newsfeed tất cả (public, optional auth để biết user đã like chưa)
router.get('/', optionalAuth, postsController.getAll);

// GET /api/posts/following — Feed người mình follow (cần auth)
router.get('/following', authenticate, postsController.getFollowing);

// POST /api/posts — Tạo bài viết mới
router.post(
  '/',
  authenticate,
  upload.single('image'),
  validate(createPostSchema, 'body'),
  postsController.create
);

// GET /api/posts/:id — Chi tiết bài viết
router.get('/:id', optionalAuth, postsController.getById);

// PUT /api/posts/:id — Sửa bài viết
router.put('/:id', authenticate, validate(updatePostSchema), postsController.update);

// DELETE /api/posts/:id — Xóa bài viết
router.delete('/:id', authenticate, postsController.remove);

module.exports = router;
