const Joi = require('joi');
const { isDisposableEmail } = require('../utils/disposable-domains');

// Custom Joi extension: từ chối domain email tạm/rác
const emailValidator = Joi.string().email().required().max(255).custom((value, helpers) => {
  const { blocked, domain } = isDisposableEmail(value);
  if (blocked) {
    return helpers.error('email.disposable', { domain });
  }
  return value;
}).messages({
  'string.email': 'Email không hợp lệ',
  'any.required': 'Email là bắt buộc',
  'email.disposable': '"{{#domain}}" là email tạm, vui lòng dùng email thật',
});

const registerSchema = Joi.object({
  email: emailValidator,
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu là bắt buộc',
    }),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Username phải có ít nhất 3 ký tự',
      'string.max': 'Username không được vượt quá 30 ký tự',
      'string.pattern.base': 'Username chỉ được chứa chữ cái, số và dấu gạch dưới',
      'any.required': 'Username là bắt buộc',
    }),
  display_name: Joi.string().min(1).max(50).required()
    .messages({
      'any.required': 'Tên hiển thị là bắt buộc',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Mật khẩu là bắt buộc',
    }),
});

const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(1).max(50),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/),
  bio: Joi.string().max(160).allow('', null),
}).min(1).messages({
  'object.min': 'Cần ít nhất 1 field để cập nhật',
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
