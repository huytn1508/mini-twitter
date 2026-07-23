const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const chat = require('../controllers/chat.controller');

// Danh sách conversations
router.get('/conversations', authenticate, chat.getConversations);

// Lịch sử tin nhắn
router.get('/conversations/:id/messages', authenticate, chat.getMessages);

// Gửi tin nhắn (text + optional 1 ảnh)
router.post('/conversations/:id/messages', authenticate, upload.single('image'), chat.sendMessage);

// Đánh dấu đã đọc
router.put('/conversations/:id/read', authenticate, chat.markAsRead);

// Tạo conversation mới
router.post('/start', authenticate, chat.startConversation);

// Tìm user để chat
router.get('/search-users', authenticate, chat.searchUsers);

// Unread count
router.get('/unread-count', authenticate, chat.getUnreadCount);

module.exports = router;
