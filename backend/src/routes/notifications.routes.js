const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getNotifications, getUnreadCount, readAll } = require('../controllers/notifications.controller');

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/read-all', authenticate, readAll);

module.exports = router;
