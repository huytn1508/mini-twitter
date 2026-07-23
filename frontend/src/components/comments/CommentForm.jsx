import { useState } from 'react';
import { commentsAPI } from '../../api/comments';

export default function CommentForm({ postId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await commentsAPI.create(postId, content.trim());
      setContent('');
      onCommentAdded?.(res.data.comment);
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Viết bình luận..."
        maxLength={280}
        className="flex-1 px-4 py-2 text-sm border border-neutral-200 rounded-full
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                   placeholder:text-neutral-400 bg-neutral-50 transition-all"
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium
                   hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all active:scale-[0.98]"
      >
        {submitting ? '...' : 'Gửi'}
      </button>
    </form>
  );
}
