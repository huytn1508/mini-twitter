import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineHome, HiHome,
  HiOutlineLogout, HiOutlineBell, HiOutlineSearch, HiOutlineMail,
  HiSun, HiMoon, HiOutlineUser, HiOutlineCog, HiOutlineDotsHorizontal
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
import client from '../../api/client';

/** Check if current path matches — dùng cho active indicator */
function isActive(path, current) {
  if (path === '/') return current === '/';
  return current.startsWith(path);
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Track scroll để thêm shadow + backdrop-blur
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu khi click ra ngoài
  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Poll unread counts
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
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/80 dark:bg-surface-0/80 backdrop-blur-md shadow-sm border-b border-border-light'
        : 'bg-white dark:bg-surface-0 border-b border-transparent'
    }`}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-baseline gap-0.5 select-none flex-shrink-0">
          <span className="text-xl font-bold text-primary-600 tracking-tight">Mini</span>
          <span className="text-xl font-light text-text-tertiary tracking-tight">Twitter</span>
        </Link>

        {/* Navigation icons — center */}
        <div className="flex items-center gap-0.5">
          {isAuthenticated ? (
            <>
              {/* Home */}
              <NavIcon to="/" current={currentPath} icon={HiOutlineHome} activeIcon={HiHome} label="Trang chủ" />
              {/* Explore */}
              <NavIcon to="/explore" current={currentPath} icon={HiOutlineSearch} label="Khám phá" />
              {/* Messages */}
              <Link to="/messages"
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  isActive('/messages', currentPath)
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'text-text-tertiary hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-100'
                }`} title="Tin nhắn">
                <HiOutlineMail className="w-5 h-5" />
                {chatUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </Link>
              {/* Notifications */}
              <Link to="/notifications"
                className={`relative p-2 rounded-full transition-all duration-200 ${
                  isActive('/notifications', currentPath)
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'text-text-tertiary hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-100'
                }`} title="Thông báo">
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </>
          ) : null}

          {/* Dark mode toggle — always visible */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-text-tertiary hover:text-amber-500 hover:bg-surface-100 dark:hover:bg-surface-100 transition-all duration-200"
            title={dark ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
          >
            {dark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-surface-100 dark:hover:bg-surface-100 transition-all duration-200"
              >
                <Avatar src={user.avatar_url} size="sm" />
                <span className="hidden sm:inline text-sm font-semibold text-text-primary">{user.display_name}</span>
                <HiOutlineDotsHorizontal className="hidden sm:block w-4 h-4 text-text-tertiary" />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-surface-0 rounded-xl shadow-dropdown border border-border py-1.5 animate-toast-in z-50">
                  {/* User info header */}
                  <div className="px-4 py-2.5 border-b border-border-light">
                    <p className="font-semibold text-sm text-text-primary">{user.display_name}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">@{user.username}</p>
                  </div>

                  <Link to={`/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors">
                    <HiOutlineUser className="w-4 h-4" /> Trang cá nhân
                  </Link>

                  <Link to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors">
                    <HiOutlineCog className="w-4 h-4" /> Cài đặt
                  </Link>

                  <div className="border-t border-border-light mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <HiOutlineLogout className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm !py-2">Đăng nhập</Link>
              <Link to="/register" className="btn-primary text-sm !py-2">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/** Single nav icon with active state */
function NavIcon({ to, current, icon: Icon, activeIcon: ActiveIcon, label }) {
  const active = isActive(to, current);
  const IconComponent = active && ActiveIcon ? ActiveIcon : Icon;
  return (
    <Link
      to={to}
      className={`relative p-2 rounded-full transition-all duration-200 ${
        active
          ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
          : 'text-text-tertiary hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-100'
      }`}
      title={label}
    >
      <IconComponent className="w-5 h-5" />
    </Link>
  );
}
