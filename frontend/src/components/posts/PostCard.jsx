import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineChat, HiOutlineTrash, HiSwitchHorizontal, HiOutlineExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { likesAPI } from '../../api/likes';
import { postsAPI } from '../../api/posts';
import { formatDate } from '../../utils/formatDate';
import Avatar from '../ui/Avatar';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';
import PostContent from './PostContent';

/** Component bọc ảnh nhạy cảm với blur + overlay */
function SensitiveWrapper({ isSensitive, children }) {
  const [revealed, setRevealed] = useState(false);
  if (!isSensitive) return children;
  return (
    <div className="relative" onClick={() => setRevealed(!revealed)}>
      <div className={revealed ? '' : 'blur-xl select-none pointer-events-none'}>{children}</div>
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl cursor-pointer">
          <HiOutlineExclamationCircle className="w-8 h-8 text-white mb-2" />
          <span className="text-white text-sm font-semibold">Nội dung nhạy cảm</span>
          <span className="text-white/70 text-xs mt-1">Nhấn để xem</span>
        </div>
      )}
    </div>
  );
}

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retweeting, setRetweeting] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      const res = await likesAPI.toggle(post.id);
      setIsLiked(res.data.liked);
      setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) { console.error('Like failed:', err); }
    finally { setLiking(false); }
  };

  const handleRetweet = async () => {
    if (!user || retweeting) return;
    setRetweeting(true);
    try {
      await postsAPI.retweet(post.id);
      showToast('success', 'Đã retweet!');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Retweet thất bại');
    }
    finally { setRetweeting(false); }
  };

  const handleQuoteRetweet = async () => {
    if (!user || !quoteContent.trim() || retweeting) return;
    setRetweeting(true);
    try {
      await postsAPI.quote(post.id, quoteContent.trim());
      setShowQuoteModal(false);
      setQuoteContent('');
      showToast('success', 'Đã quote tweet!');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Quote thất bại');
    }
    finally { setRetweeting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    setDeleting(true);
    try { await postsAPI.delete(post.id); onDelete?.(post.id); }
    catch (err) { console.error('Delete failed:', err); }
    finally { setDeleting(false); }
  };

  const handleCommentAdded = () => setCommentsCount(prev => prev + 1);
  const handleCommentDeleted = () => setCommentsCount(prev => prev - 1);
  const isOwner = user?.id === post.user?.id;

  // Check if this is a retweet
  const isRetweet = post.retweet_type === 'retweet';
  const isQuote = post.retweet_type === 'quote';

  return (
    <div className="card hover:shadow-md relative">
      {/* Toast notification */}
      {toast && (
        <div className={`absolute top-3 right-3 z-10 px-4 py-2 rounded-xl text-sm font-medium shadow-lg animate-pulse ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Retweet indicator */}
      {isRetweet && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-3">
          <HiSwitchHorizontal className="w-4 h-4 text-green-500" />
          <span>{post.user?.display_name} đã retweet</span>
        </div>
      )}

      {isQuote && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-3">
          <HiSwitchHorizontal className="w-4 h-4 text-indigo-500" />
          <span>{post.user?.display_name} đã quote</span>
        </div>
      )}

      {/* Main post content */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.user?.username}`}>
          <Avatar src={post.user?.avatar_url} alt={post.user?.display_name} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${post.user?.username}`}
              className="font-semibold text-sm text-neutral-900 hover:underline truncate">
              {post.user?.display_name}
            </Link>
            <span className="text-neutral-500 text-sm font-normal">@{post.user?.username}</span>
            <span className="text-neutral-300 text-sm">·</span>
            <span className="text-neutral-400 text-xs">{formatDate(post.created_at)}</span>
          </div>

          {/* Content (for quote: show caption + embedded original) */}
          {post.content && <PostContent content={post.content} />}

          {/* Images (multi-image grid) */}
          {(post.images?.length > 0 || post.image_url) && (
            <SensitiveWrapper isSensitive={post.is_sensitive}>
              <div className={`grid gap-1.5 mt-3 ${
                (post.images?.length || 1) === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {(post.images?.length > 0 ? post.images : [post.image_url]).map((url, i) => (
                  <img key={i} src={url} alt=""
                    className={`rounded-xl w-full object-cover border border-neutral-100 ${
                      (post.images?.length || 1) === 1 ? 'max-h-96' : 'max-h-64'
                    }`} loading="lazy" />
                ))}
              </div>
            </SensitiveWrapper>
          )}

          {/* Embedded original post (for retweet/quote) */}
          {(isRetweet || isQuote) && (
            <div className="mt-3 border border-neutral-200 rounded-xl p-3 bg-neutral-50/50">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar src={post.retweet?.original_post?.user?.avatar_url} size="sm" />
                <Link to={`/profile/${post.retweet?.original_post?.user?.username}`}
                  className="font-semibold text-sm text-neutral-900 hover:underline">
                  {post.retweet?.original_post?.user?.display_name}
                </Link>
                <span className="text-neutral-500 text-xs">@{post.retweet?.original_post?.user?.username}</span>
                <span className="text-neutral-400 text-xs">{formatDate(post.retweet?.original_post?.created_at)}</span>
              </div>
              {post.retweet?.original_post?.content && (
                <PostContent content={post.retweet.original_post.content} />
              )}
              {post.retweet?.original_post?.image_url && (
                <img src={post.retweet.original_post.image_url} alt=""
                  className="mt-2 rounded-lg max-h-48 object-cover border border-neutral-100" loading="lazy" />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-neutral-100">
            <button onClick={handleLike} disabled={!user || liking}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-rose-500'
              } disabled:opacity-50`}>
              {isLiked ? <HiHeart className="w-[18px] h-[18px]" /> : <HiOutlineHeart className="w-[18px] h-[18px]" />}
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            <button onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                showComments ? 'text-indigo-600' : 'text-neutral-400 hover:text-indigo-600'
              }`}>
              <HiOutlineChat className="w-[18px] h-[18px]" />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </button>

            {/* Retweet button */}
            {user && !isOwner && (
              <div className="relative group">
                <button onClick={handleRetweet} disabled={retweeting}
                  className="flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-green-500 transition-colors disabled:opacity-50">
                  <HiSwitchHorizontal className="w-[18px] h-[18px]" />
                </button>
                {/* Dropdown for Quote Tweet */}
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block">
                  <button onClick={() => setShowQuoteModal(true)}
                    className="text-xs bg-white border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm hover:bg-neutral-50 whitespace-nowrap">
                    Quote Tweet
                  </button>
                </div>
              </div>
            )}

            {isOwner && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1 text-sm text-neutral-300 hover:text-rose-500 transition-colors ml-auto" title="Xóa">
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quote modal */}
          {showQuoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQuoteModal(false)}>
              <div className="bg-white rounded-2xl p-5 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-neutral-900 mb-3">Quote Tweet</h3>
                <textarea value={quoteContent} onChange={e => setQuoteContent(e.target.value)}
                  placeholder="Thêm bình luận của bạn..."
                  rows={3} maxLength={280}
                  className="w-full border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none" />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-neutral-400">{quoteContent.length}/280</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowQuoteModal(false)} className="btn-ghost text-xs">Hủy</button>
                    <button onClick={handleQuoteRetweet} disabled={!quoteContent.trim() || retweeting}
                      className="btn-primary text-xs !py-2">Đăng</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              {user && <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />}
              <CommentList postId={post.id} onCommentDeleted={handleCommentDeleted} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
