import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi';
import client from '../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Supabase redirect mang session token trong URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
      setHasSession(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (password !== confirm) { setError('Mật khẩu không khớp'); return; }
    setLoading(true);
    try {
      await client.post('/auth/reset-password', {
        password,
        session_hash: window.location.hash, // Gửi session hash lên backend
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Đặt lại mật khẩu thất bại. Link có thể đã hết hạn, thử gửi lại.');
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-full max-w-sm text-center card">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <HiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Mật khẩu đã được đặt lại</h2>
          <p className="text-sm text-neutral-500 mb-6">Dùng mật khẩu mới để đăng nhập.</p>
          <Link to="/login" className="btn-primary text-sm">Đăng nhập</Link>
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
          <p className="text-neutral-500 text-sm mt-3">Đặt mật khẩu mới</p>
        </div>
        <div className="card">
          {!hasSession ? (
            <div className="text-center py-4">
              <p className="text-sm text-neutral-500 mb-4">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <Link to="/forgot-password" className="btn-primary text-sm">Gửi lại link mới</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mật khẩu mới</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Ít nhất 6 ký tự" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Xác nhận mật khẩu</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" placeholder="Nhập lại mật khẩu" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
