import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineHome, HiOutlineUser, HiOutlineLogout, HiLogin } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-blue-500 hover:text-blue-600 transition-colors">
          🐦 Mini Twitter
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/" className="text-gray-600 hover:text-blue-500 transition-colors" title="Trang chủ">
                <HiOutlineHome className="w-6 h-6" />
              </Link>
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar src={user.avatar_url} size="sm" />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.display_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline text-sm flex items-center gap-1">
                <HiLogin className="w-4 h-4" /> Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary text-sm">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
