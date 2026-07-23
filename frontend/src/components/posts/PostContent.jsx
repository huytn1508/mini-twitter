import { Link } from 'react-router-dom';

/**
 * Parse nội dung post: biến #hashtag và @username thành link clickable.
 * Tách text thành mảng các segment (text | hashtag | mention).
 */
export default function PostContent({ content, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  // Regex khớp #hashtag hoặc @username
  const regex = /(#\w+|@\w+)/g;
  const parts = content.split(regex);

  return (
    <p className={className || 'mt-1.5 text-[15px] text-text-primary whitespace-pre-wrap break-words leading-relaxed'}>
      {parts.map((part, i) => {
        if (part.startsWith('#') && part.length > 1) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={i}
              to={`/hashtag/${tag}`}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline font-semibold"
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
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline font-semibold"
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
