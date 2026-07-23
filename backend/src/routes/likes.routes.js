const router = require('express').Router({ mergeParams: true });
const likesController = require('../controllers/likes.controller');
const { authenticate } = require('../middleware/auth');

// POST /api/posts/:postId/like — Toggle like/unlike
router.post('/:postId/like', authenticate, likesController.toggle);

module.exports = router;
