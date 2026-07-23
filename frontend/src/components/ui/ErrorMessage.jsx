export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-red-600 underline text-sm mt-1 hover:text-red-800">
          Thử lại
        </button>
      )}
    </div>
  );
}
