import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineTrash } from 'react-icons/hi';
import { commentsAPI } from '../../api/comments';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';
import Avatar from '../ui/Avatar';
import { SkeletonPostList } from '../ui/SkeletonPost';

export default function CommentList({ postId, onCommentDeleted }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    commentsAPI.getByPost(postId)
      .then(res => setComments(res.data.comments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDelete = async (commentId) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await commentsAPI.delete(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentDeleted?.();
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-2">
            <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 skeleton" />
              <div className="h-3 w-full skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return <p className="text-neutral-400 text-sm text-center py-4">Chưa có bình luận nào</p>;
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {comments.map(comment => (
        <div key={comment.id} className="flex gap-2">
          <Link to={`/profile/${comment.user?.username}`} className="flex-shrink-0">
            <Avatar src={comment.user?.avatar_url} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="bg-neutral-50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/profile/${comment.user?.username}`}
                  className="text-sm font-semibold text-neutral-900 hover:underline"
                >
                  {comment.user?.display_name}
                </Link>
                <span className="text-xs text-neutral-400">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-neutral-700 mt-0.5 leading-relaxed">{comment.content}</p>
            </div>
            {user?.id === comment.user?.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-xs text-neutral-400 hover:text-rose-500 mt-1 ml-1 transition-colors"
              >
                <HiOutlineTrash className="w-3 h-3 inline" /> Xóa
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
