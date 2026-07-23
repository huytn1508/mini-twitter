const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/auth.validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/users/:username — Xem profile user
router.get('/:username', optionalAuth, usersController.getProfile);

// PUT /api/users/me — Cập nhật profile
router.put(
  '/me',
  authenticate,
  upload.single('avatar'),
  validate(updateProfileSchema),
  usersController.updateProfile
);

// GET /api/users/:username/posts — Danh sách bài viết của user
router.get('/:username/posts', optionalAuth, usersController.getUserPosts);

module.exports = router;
