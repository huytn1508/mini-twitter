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
        className="input-field py-2 text-sm flex-1"
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="btn-primary text-xs px-3 py-2"
      >
        {submitting ? '...' : 'Gửi'}
      </button>
    </form>
  );
}
