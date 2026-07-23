/**
 * Validate form input phía client
 */

// Regex chặt hơn: TLD phải có ít nhất 2 chữ cái, phần domain ít nhất 2 phần
// (vd: "a@b.c" bị từ chối, "a@gmail.com" được chấp nhận)
const STRICT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Map các lỗi gõ phổ biến → domain đúng
const TYPO_DOMAINS = {
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.clm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmial.con': 'gmail.com',
  'gmaiil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmsil.com': 'gmail.com',
  'gmail.coom': 'gmail.com',
  'gmail.vn': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.com.vn': 'gmail.com',

  'hotmail.co': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  'hitmail.com': 'hotmail.com',

  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outllook.com': 'outlook.com',

  'yahoo.co': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yaho.com.vn': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahool.com': 'yahoo.com',

  'proton.co': 'proton.me',
  'protonmai.com': 'proton.me',
  'proton.com': 'proton.me',
  'protom.me': 'proton.me',

  'icloud.co': 'icloud.com',
  'icloud.cm': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icould.com': 'icloud.com',

  'yandex.co': 'yandex.com',
  'yandex.cm': 'yandex.com',
  'yandex.con': 'yandex.com',

  'live.co': 'live.com',
  'live.cm': 'live.com',
  'live.con': 'live.com',
};

/**
 * Phát hiện lỗi chính tả trong domain email và trả về gợi ý sửa.
 * @param {string} email
 * @returns {{ suggestion: string | null, originalDomain: string }}
 */
export function detectEmailTypo(email) {
  if (!email || !email.includes('@')) return { suggestion: null, originalDomain: '' };
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return { suggestion: null, originalDomain: '' };
  const domain = parts[1];
  if (TYPO_DOMAINS[domain]) {
    return { suggestion: parts[0] + '@' + TYPO_DOMAINS[domain], originalDomain: domain };
  }
  return { suggestion: null, originalDomain: domain };
}

export function validateEmail(email) {
  if (!email) return 'Email là bắt buộc';
  if (!STRICT_EMAIL_REGEX.test(email)) {
    // Kiểm tra xem có thiếu TLD không
    if (/^[^\s@]+@[^\s@]+$/.test(email) && !email.includes('.', email.indexOf('@'))) {
      return 'Email thiếu phần tên miền (vd: @gmail.com)';
    }
    return 'Email không hợp lệ';
  }
  // TLD quá ngắn
  const domain = email.split('@')[1];
  if (domain) {
    const tld = domain.split('.').pop();
    if (tld && tld.length < 2) {
      return 'Email không hợp lệ';
    }
  }
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
