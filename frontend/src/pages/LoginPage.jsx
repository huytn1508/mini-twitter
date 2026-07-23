import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validators';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-baseline gap-0.5 select-none">
            <span className="text-2xl font-bold text-primary-600 tracking-tight">Mini</span>
            <span className="text-2xl font-light text-text-tertiary tracking-tight">Twitter</span>
          </Link>
          <p className="text-text-secondary text-sm mt-3">Đăng nhập để kết nối với mọi người</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm px-4 py-3 rounded-xl">
                {apiError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" autoFocus />
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••" />
              {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm mt-3">
            <Link to="/forgot-password" className="text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Quên mật khẩu?</Link>
          </p>
          <p className="text-center text-sm text-text-secondary mt-4">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
