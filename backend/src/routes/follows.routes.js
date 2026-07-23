const router = require('express').Router();
const followsController = require('../controllers/follows.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

// POST /api/users/:userId/follow — Toggle follow/unfollow
router.post('/:userId/follow', authenticate, followsController.toggle);

// GET /api/users/:username/followers
router.get('/:username/followers', optionalAuth, followsController.getFollowers);

// GET /api/users/:username/following
router.get('/:username/following', optionalAuth, followsController.getFollowing);

module.exports = router;
