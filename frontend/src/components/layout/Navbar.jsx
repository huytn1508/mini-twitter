import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineHome, HiOutlineLogout, HiOutlineBell, HiOutlineSearch, HiOutlineMail } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import client from '../../api/client';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetch = () => {
      client.get('/notifications/unread-count').then(r => setUnreadCount(r.data.count)).catch(() => {});
      client.get('/chat/unread-count').then(r => setChatUnread(r.data.count)).catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-neutral-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-baseline gap-0.5 select-none">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">Mini</span>
          <span className="text-xl font-light text-neutral-400 tracking-tight">Twitter</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/" className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-50 rounded-full transition-all" title="Trang chủ">
                <HiOutlineHome className="w-5 h-5" />
              </Link>
              <Link to="/explore" className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-50 rounded-full transition-all" title="Khám phá">
                <HiOutlineSearch className="w-5 h-5" />
              </Link>
              <Link to="/messages" className="relative p-2 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-50 rounded-full transition-all" title="Tin nhắn">
                <HiOutlineMail className="w-5 h-5" />
                {chatUnread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{chatUnread > 9 ? '9+' : chatUnread}</span>}
              </Link>
              {/* Notification bell */}
              <Link to="/notifications" className="relative p-2 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-50 rounded-full transition-all" title="Thông báo">
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 rounded-full transition-all pr-3">
                <Avatar src={user.avatar_url} size="sm" />
                <span className="hidden sm:inline text-sm font-medium text-neutral-700">{user.display_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                title="Đăng xuất"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Đăng nhập</Link>
              <Link to="/register" className="btn-primary text-sm !py-2">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
