const router = require('express').Router({ mergeParams: true });
const commentsController = require('../controllers/comments.controller');
const validate = require('../middleware/validate');
const { createCommentSchema } = require('../validators/comments.validator');
const { authenticate } = require('../middleware/auth');

// GET /api/posts/:postId/comments
router.get('/:postId/comments', commentsController.getByPost);

// POST /api/posts/:postId/comments
router.post('/:postId/comments', authenticate, validate(createCommentSchema), commentsController.create);

// DELETE /api/comments/:id
router.delete('/:postId/comments/:id', authenticate, commentsController.remove);

module.exports = router;
