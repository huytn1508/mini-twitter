import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineTrash, HiReply } from 'react-icons/hi';
import { commentsAPI } from '../../api/comments';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';
import Avatar from '../ui/Avatar';
import PostContent from '../posts/PostContent';

function CommentItem({ comment, postId, onDeleted, depth = 0 }) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || replying) return;
    setReplying(true);
    try {
      await commentsAPI.create(postId, replyContent.trim(), comment.id);
      setReplyContent('');
      setShowReply(false);
      onDeleted();
    } catch (err) { console.error('Reply failed:', err); }
    finally { setReplying(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await commentsAPI.delete(postId, comment.id);
      onDeleted();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const visibleReplies = showAllReplies ? comment.replies : (comment.replies || []).slice(0, 2);
  const hiddenCount = (comment.replies || []).length - 2;

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-border' : ''}`}>
      <div className="flex gap-2">
        <Link to={`/profile/${comment.user?.username}`} className="flex-shrink-0">
          <Avatar src={comment.user?.avatar_url} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-surface-50 dark:bg-surface-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${comment.user?.username}`} className="text-sm font-semibold text-text-primary hover:underline">
                {comment.user?.display_name}
              </Link>
              <span className="text-xs text-text-tertiary">{formatDate(comment.created_at)}</span>
            </div>
            <PostContent content={comment.content} className="text-sm text-text-secondary mt-0.5 leading-relaxed whitespace-pre-wrap break-words" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-0.5 ml-1">
            {user && (
              <button onClick={() => setShowReply(!showReply)}
                className="text-xs text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1">
                <HiReply className="w-3 h-3" /> Trả lời
              </button>
            )}
            {user?.id === comment.user?.id && (
              <button onClick={handleDelete}
                className="text-xs text-text-tertiary hover:text-rose-500 transition-colors flex items-center gap-1">
                <HiOutlineTrash className="w-3 h-3" /> Xóa
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {showReply && (
            <form onSubmit={handleReply} className="flex gap-2 mt-2">
              <input type="text" value={replyContent} onChange={e => setReplyContent(e.target.value)}
                placeholder="Viết trả lời..." maxLength={280}
                className="flex-1 px-3 py-1.5 text-xs border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-surface-50 dark:bg-surface-100 text-text-primary placeholder:text-text-placeholder" />
              <button type="submit" disabled={!replyContent.trim() || replying}
                className="btn-primary text-xs !py-1.5 !px-3 !rounded-full">
                {replying ? '...' : 'Gửi'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {visibleReplies.length > 0 && (
        <div className="mt-2 space-y-2">
          {visibleReplies.map(r => <CommentItem key={r.id} comment={r} postId={postId} onDeleted={onDeleted} depth={depth + 1} />)}
          {hiddenCount > 0 && (
            <button onClick={() => setShowAllReplies(true)}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline ml-6 pl-4">
              Xem thêm {hiddenCount} trả lời
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentList({ postId, onCommentDeleted }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = () => {
    commentsAPI.getByPost(postId)
      .then(res => setComments(res.data.comments))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [postId]);

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-2">
            <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-4 w-32 skeleton" /><div className="h-3 w-full skeleton" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) return <p className="text-text-tertiary text-sm text-center py-4">Chưa có bình luận nào</p>;

  const handleChange = () => { fetchComments(); onCommentDeleted?.(); };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {comments.map(c => <CommentItem key={c.id} comment={c} postId={postId} onDeleted={handleChange} />)}
    </div>
  );
}
