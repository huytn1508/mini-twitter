const router = require('express').Router();
const postsController = require('../controllers/posts.controller');
const validate = require('../middleware/validate');
const { createPostSchema, updatePostSchema, quoteSchema } = require('../validators/posts.validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/posts — Newsfeed
router.get('/', optionalAuth, postsController.getAll);

// GET /api/posts/following
router.get('/following', authenticate, postsController.getFollowing);

// POST /api/posts — Tạo bài viết
router.post('/', authenticate, upload.array('images', 4), validate(createPostSchema, 'body'), postsController.create);

// POST /api/posts/:id/retweet
router.post('/:id/retweet', authenticate, postsController.retweet);

// POST /api/posts/:id/quote
router.post('/:id/quote', authenticate, validate(quoteSchema), postsController.quoteRetweet);

// GET /api/posts/:id
router.get('/:id', optionalAuth, postsController.getById);

// PUT /api/posts/:id
router.put('/:id', authenticate, validate(updatePostSchema), postsController.update);

// DELETE /api/posts/:id
router.delete('/:id', authenticate, postsController.remove);

module.exports = router;
