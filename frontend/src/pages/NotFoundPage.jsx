import { Link } from 'react-router-dom';
import { HiOutlineEmojiSad } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <HiOutlineEmojiSad className="w-24 h-24 text-gray-300 mb-6" />
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-xl text-gray-500 mb-8">Trang không tồn tại</p>
      <Link to="/" className="btn-primary">Về trang chủ</Link>
    </div>
  );
}
