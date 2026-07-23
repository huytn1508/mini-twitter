import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateUsername, validateDisplayName } from '../utils/validators';

export default function RegisterPage() {
  const { register, login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '', display_name: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-baseline gap-0.5 select-none">
            <span className="text-2xl font-bold text-indigo-600 tracking-tight">Mini</span>
            <span className="text-2xl font-light text-neutral-400 tracking-tight">Twitter</span>
          </Link>
          <p className="text-neutral-500 text-sm mt-3">Tạo tài khoản mới</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl">
                {apiError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={handleChange('email')} className="input-field" placeholder="your@email.com" autoFocus />
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tên hiển thị</label>
              <input type="text" value={form.display_name} onChange={handleChange('display_name')} className="input-field" placeholder="Nguyễn Văn A" maxLength={50} />
              {errors.display_name && <p className="text-rose-500 text-xs mt-1">{errors.display_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={handleChange('username')} className="input-field" placeholder="nguyenvana" maxLength={30} />
              {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mật khẩu</label>
              <input type="password" value={form.password} onChange={handleChange('password')} className="input-field" placeholder="Ít nhất 6 ký tự" />
              {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
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
