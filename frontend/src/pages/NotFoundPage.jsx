import { Link } from 'react-router-dom';
import { HiOutlineEmojiSad } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
        <HiOutlineEmojiSad className="w-12 h-12 text-neutral-300" />
      </div>
      <h1 className="text-7xl font-bold text-neutral-200 mb-3">404</h1>
      <p className="text-lg text-neutral-500 mb-8">Trang không tồn tại</p>
      <Link to="/" className="btn-primary">Về trang chủ</Link>
    </div>
  );
}
