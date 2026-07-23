import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import client from '../api/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formatOk, setFormatOk] = useState(false);
  const [emailExists, setEmailExists] = useState(null); // null = chưa check, true/false
  const [checking, setChecking] = useState(false);

  // Validate định dạng real-time
  useEffect(() => {
    setFormatOk(EMAIL_REGEX.test(email));
    setEmailExists(null);
    setError('');
  }, [email]);

  // Kiểm tra email tồn tại sau khi user ngừng gõ 500ms
  useEffect(() => {
    if (!formatOk) { setEmailExists(null); return; }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await client.post('/auth/check-email', { email });
        setEmailExists(res.data.exists);
      } catch { setEmailExists(null); }
      finally { setChecking(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, formatOk]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formatOk) { setError('Email không đúng định dạng'); return; }
    if (emailExists === false) { setError('Email này chưa được đăng ký'); return; }
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Gửi email thất bại. Thử lại!');
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-full max-w-sm text-center card">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <HiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Đã gửi email</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Kiểm tra hộp thư <strong className="text-neutral-900">{email}</strong> để đặt lại mật khẩu.
          </p>
          <Link to="/login" className="btn-primary text-sm">Về đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-baseline gap-0.5 select-none">
            <span className="text-2xl font-bold text-indigo-600 tracking-tight">Mini</span>
            <span className="text-2xl font-light text-neutral-400 tracking-tight">Twitter</span>
          </Link>
          <p className="text-neutral-500 text-sm mt-3">Đặt lại mật khẩu</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <HiXCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email đã đăng ký</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`input-field pr-10 ${
                    email && formatOk && emailExists === true ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20' :
                    email && formatOk && emailExists === false ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' :
                    ''
                  }`}
                  placeholder="your@email.com"
                  autoFocus
                />
                {/* Status icon */}
                {email && formatOk && !checking && emailExists === true && (
                  <HiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
                {email && formatOk && !checking && emailExists === false && (
                  <HiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                )}
                {checking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-neutral-300 border-t-indigo-500 rounded-full animate-spin" />
                )}
              </div>
              {/* Feedback text */}
              {email && !formatOk && (
                <p className="text-rose-500 text-xs mt-1 flex items-center gap-1">
                  <HiXCircle className="w-3 h-3" /> Email không đúng định dạng
                </p>
              )}
              {email && formatOk && !checking && emailExists === true && (
                <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <HiCheckCircle className="w-3 h-3" /> Email đã đăng ký — có thể đặt lại mật khẩu
                </p>
              )}
              {email && formatOk && !checking && emailExists === false && (
                <p className="text-rose-500 text-xs mt-1 flex items-center gap-1">
                  <HiXCircle className="w-3 h-3" /> Email này chưa được đăng ký
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !formatOk || emailExists === false || checking}
              className="btn-primary w-full !py-3"
            >
              {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </button>
          </form>
          <p className="text-center text-sm text-neutral-500 mt-5">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">← Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
