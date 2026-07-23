import { Link } from 'react-router-dom';

/**
 * Parse nội dung post: biến #hashtag và @username thành link clickable.
 * Tách text thành mảng các segment (text | hashtag | mention).
 */
export default function PostContent({ content, className = '' }) {
  if (!content) return null;

  // Regex khớp #hashtag hoặc @username
  const regex = /(#\w+|@\w+)/g;
  const parts = content.split(regex);

  return (
    <p className={className || 'mt-2 text-[15px] text-neutral-800 whitespace-pre-wrap break-words leading-relaxed'}>
      {parts.map((part, i) => {
        if (part.startsWith('#') && part.length > 1) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={i}
              to={`/hashtag/${tag}`}
              className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('@') && part.length > 1) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              to={`/profile/${username}`}
              className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
