const router = require('express').Router();
const hashtagsController = require('../controllers/hashtags.controller');
const { optionalAuth } = require('../middleware/auth');

// GET /api/hashtags/:tag
router.get('/:tag', optionalAuth, hashtagsController.getPostsByTag);

module.exports = router;
