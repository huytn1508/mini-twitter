const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
