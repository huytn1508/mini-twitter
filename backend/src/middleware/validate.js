/**
 * Middleware factory: validate request body bằng Joi schema.
 * Dùng: router.post('/', validate(createPostSchema), controller.create)
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true,  // Xóa field không có trong schema
    });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req[source] = value; // Gán lại giá trị đã validate
    next();
  };
}

module.exports = validate;
