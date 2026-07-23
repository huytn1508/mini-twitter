import { HiExclamationCircle } from 'react-icons/hi';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="card text-center py-10 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
        <HiExclamationCircle className="w-7 h-7 text-rose-500" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">Đã xảy ra lỗi</h3>
      <p className="text-sm text-neutral-500 mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Thử lại
        </button>
      )}
    </div>
  );
}
