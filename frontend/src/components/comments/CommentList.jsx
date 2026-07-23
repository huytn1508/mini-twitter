import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineTrash } from 'react-icons/hi';
import { commentsAPI } from '../../api/comments';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatDate';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

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

  if (loading) return <Spinner size="sm" className="py-4" />;

  if (comments.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">Chưa có bình luận</p>;
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {comments.map(comment => (
        <div key={comment.id} className="flex gap-2">
          <Link to={`/profile/${comment.user?.username}`}>
            <Avatar src={comment.user?.avatar_url} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${comment.user?.username}`} className="text-sm font-semibold hover:underline">
                  {comment.user?.display_name}
                </Link>
                <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
            </div>
            {/* Delete (owner only) */}
            {user?.id === comment.user?.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-xs text-gray-400 hover:text-red-500 mt-0.5 ml-1"
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
