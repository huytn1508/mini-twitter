import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/validators';
import client from '../api/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (password !== confirm) { setError('Mật khẩu không khớp'); return; }
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-full max-w-sm text-center card">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">✅</div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Mật khẩu đã được đặt lại</h2>
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
        </div>
      </div>
    </div>
  );
}
