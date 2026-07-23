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
        className="flex-1 px-4 py-2 text-sm border border-border rounded-full
                   focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                   placeholder:text-text-placeholder bg-surface-50 dark:bg-surface-100
                   text-text-primary transition-all"
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="btn-primary !py-2 !px-5 !text-sm !rounded-full"
      >
        {submitting ? '...' : 'Gửi'}
      </button>
    </form>
  );
}
