const multer = require('multer');

// Lưu file tạm trên memory trước khi upload lên Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image & video files are allowed (JPEG, PNG, WebP, GIF, MP4, WebM, MOV)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max cho video
  },
});

module.exports = upload;
