const Joi = require('joi');

const createPostSchema = Joi.object({
  content: Joi.string().min(0).max(280).allow('').optional()
    .messages({
      'string.max': 'Nội dung không được vượt quá 280 ký tự',
    }),
});

const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(280).required()
    .messages({
      'string.min': 'Nội dung không được để trống',
      'string.max': 'Nội dung không được vượt quá 280 ký tự',
      'any.required': 'Nội dung bài viết là bắt buộc',
    }),
});

const quoteSchema = Joi.object({
  content: Joi.string().min(1).max(280).required()
    .messages({
      'string.min': 'Caption không được để trống',
      'string.max': 'Caption không được vượt quá 280 ký tự',
      'any.required': 'Caption là bắt buộc',
    }),
});

module.exports = { createPostSchema, updatePostSchema, quoteSchema };
