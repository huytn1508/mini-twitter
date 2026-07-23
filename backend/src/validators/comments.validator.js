const Joi = require('joi');

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(280).required()
    .messages({
      'string.min': 'Nội dung bình luận không được để trống',
      'string.max': 'Bình luận không được vượt quá 280 ký tự',
      'any.required': 'Nội dung bình luận là bắt buộc',
    }),
  parent_comment_id: Joi.number().integer().allow(null).optional(),
});

module.exports = { createCommentSchema };
