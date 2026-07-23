const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const chat = require('../controllers/chat.controller');

router.get('/conversations', authenticate, chat.getConversations);
router.get('/conversations/:id/messages', authenticate, chat.getMessages);
router.post('/conversations/:id/messages', authenticate, chat.sendMessage);
router.post('/start', authenticate, chat.startConversation);
router.get('/unread-count', authenticate, chat.getUnreadCount);

module.exports = router;
