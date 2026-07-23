import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineChat, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { likesAPI } from '../../api/likes';
import { postsAPI } from '../../api/posts';
import { formatDate } from '../../utils/formatDate';
import Avatar from '../ui/Avatar';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      const res = await likesAPI.toggle(post.id);
      setIsLiked(res.data.liked);
      setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    setDeleting(true);
    try {
      await postsAPI.delete(post.id);
      onDelete?.(post.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount(prev => prev + 1);
  };

  const handleCommentDeleted = () => {
    setCommentsCount(prev => prev - 1);
  };

  const isOwner = user?.id === post.user?.id;

  return (
    <div className="card hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.user?.username}`}>
          <Avatar src={post.user?.avatar_url} alt={post.user?.display_name} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${post.user?.username}`}
              className="font-semibold text-sm text-neutral-900 hover:underline truncate"
            >
              {post.user?.display_name}
            </Link>
            <span className="text-neutral-500 text-sm font-normal">@{post.user?.username}</span>
            <span className="text-neutral-300 text-sm">·</span>
            <span className="text-neutral-400 text-xs">{formatDate(post.created_at)}</span>
          </div>

          {/* Content */}
          <p className="mt-2 text-[15px] text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>

          {/* Image */}
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post image"
              className="mt-3 rounded-xl max-h-96 w-full object-cover border border-neutral-100"
              loading="lazy"
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-neutral-100">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={!user || liking}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isLiked
                  ? 'text-rose-500'
                  : 'text-neutral-400 hover:text-rose-500'
              } disabled:opacity-50`}
            >
              {isLiked ? <HiHeart className="w-[18px] h-[18px]" /> : <HiOutlineHeart className="w-[18px] h-[18px]" />}
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            {/* Comment toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                showComments
                  ? 'text-indigo-600'
                  : 'text-neutral-400 hover:text-indigo-600'
              }`}
            >
              <HiOutlineChat className="w-[18px] h-[18px]" />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </button>

            {/* Delete (owner only) */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-sm text-neutral-300 hover:text-rose-500 transition-colors ml-auto"
                title="Xóa bài viết"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              {user && <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />}
              <CommentList
                postId={post.id}
                onCommentDeleted={handleCommentDeleted}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
