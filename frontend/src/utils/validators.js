/**
 * Validate form input phía client
 */
export function validateEmail(email) {
  if (!email) return 'Email là bắt buộc';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Mật khẩu là bắt buộc';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return null;
}

export function validateUsername(username) {
  if (!username) return 'Username là bắt buộc';
  if (username.length < 3) return 'Username phải có ít nhất 3 ký tự';
  if (username.length > 30) return 'Username không được vượt quá 30 ký tự';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username chỉ được chứa chữ cái, số và dấu gạch dưới';
  return null;
}

export function validateDisplayName(name) {
  if (!name) return 'Tên hiển thị là bắt buộc';
  if (name.length > 50) return 'Tên hiển thị không được vượt quá 50 ký tự';
  return null;
}

export function validatePostContent(content) {
  if (!content || !content.trim()) return 'Nội dung không được để trống';
  if (content.length > 280) return `Còn ${content.length - 280} ký tự vượt quá giới hạn`;
  return null;
}
