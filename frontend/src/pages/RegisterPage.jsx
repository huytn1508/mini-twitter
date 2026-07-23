import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { validatePassword, validateUsername, validateDisplayName, validateEmail, detectEmailTypo } from '../utils/validators';
import client from '../api/client';

// Regex chặt: TLD ít nhất 2 chữ cái, domain phải có dấu chấm
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export default function RegisterPage() {
  const { register, login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Email validation state
  const [emailFormatOk, setEmailFormatOk] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState(null);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const applySuggestion = () => {
    if (emailSuggestion) {
      setForm(prev => ({ ...prev, email: emailSuggestion }));
      setEmailSuggestion(null);
    }
  };

  // Validate email format real-time
  useEffect(() => {
    setEmailFormatOk(EMAIL_REGEX.test(form.email));
    setEmailExists(null);
    // Phát hiện lỗi chính tả domain
    const typo = detectEmailTypo(form.email);
    setEmailSuggestion(typo.suggestion);
  }, [form.email]);

  // Check email đã tồn tại sau 500ms ngừng gõ
  useEffect(() => {
    if (!emailFormatOk) { setEmailExists(null); return; }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await client.post('/auth/check-email', { email: form.email });
        // Nếu là email rác/tạm, coi như đã tồn tại để chặn
        if (res.data.disposable) {
          setEmailExists(true);
        } else {
          setEmailExists(res.data.exists);
        }
      } catch { setEmailExists(null); }
      finally { setCheckingEmail(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.email, emailFormatOk]);

  const validate = () => {
    const errs = {};
    if (!emailFormatOk) errs.email = 'Email không đúng định dạng';
    if (emailExists === true) errs.email = 'Email này đã được đăng ký';
    const passErr = validatePassword(form.password);
    if (passErr) errs.password = passErr;
    const userErr = validateUsername(form.username);
    if (userErr) errs.username = userErr;
    const nameErr = validateDisplayName(form.display_name);
    if (nameErr) errs.display_name = nameErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, username: form.username, display_name: form.display_name });
      await authLogin(form.email, form.password);
      navigate('/');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-baseline gap-0.5 select-none">
            <span className="text-2xl font-bold text-indigo-600 tracking-tight">Mini</span>
            <span className="text-2xl font-light text-neutral-400 tracking-tight">Twitter</span>
          </Link>
          <p className="text-neutral-500 text-sm mt-3">Tạo tài khoản mới</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <HiXCircle className="w-5 h-5 flex-shrink-0" /> {apiError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className={`input-field pr-10 ${
                    form.email && emailFormatOk && emailExists === false ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20' :
                    form.email && (!emailFormatOk || emailExists === true) ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''
                  }`}
                  placeholder="your@email.com"
                  autoFocus
                />
                {form.email && emailFormatOk && !checkingEmail && emailExists === false && (
                  <HiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
                {form.email && (!emailFormatOk || emailExists === true) && !checkingEmail && (
                  <HiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                )}
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-neutral-300 border-t-indigo-500 rounded-full animate-spin" />
                )}
              </div>
              {errors.email && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><HiXCircle className="w-3 h-3" /> {errors.email}</p>}
              {!errors.email && form.email && emailFormatOk && !checkingEmail && emailExists === false && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><HiCheckCircle className="w-3 h-3" /> Email hợp lệ</p>
              )}
              {/* Gợi ý sửa lỗi chính tả domain */}
              {emailSuggestion && emailFormatOk && (
                <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                  <span>Ý bạn là <button type="button" onClick={applySuggestion} className="font-bold underline hover:text-amber-700">{emailSuggestion}</button>?</span>
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tên hiển thị</label>
              <input type="text" value={form.display_name} onChange={handleChange('display_name')} className="input-field" placeholder="Nguyễn Văn A" maxLength={50} />
              {errors.display_name && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><HiXCircle className="w-3 h-3" /> {errors.display_name}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={handleChange('username')} className="input-field" placeholder="nguyenvana" maxLength={30} />
              {errors.username && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><HiXCircle className="w-3 h-3" /> {errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mật khẩu</label>
              <input type="password" value={form.password} onChange={handleChange('password')} className="input-field" placeholder="Ít nhất 6 ký tự" />
              {errors.password && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><HiXCircle className="w-3 h-3" /> {errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !emailFormatOk || emailExists === true || checkingEmail}
              className="btn-primary w-full !py-3"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-5">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
