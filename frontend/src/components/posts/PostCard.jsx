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
    <div className="relative mt-3" onClick={() => setRevealed(!revealed)}>
      <div className={revealed ? '' : 'blur-xl select-none pointer-events-none'}>{children}</div>
      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl cursor-pointer backdrop-blur-sm">
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
  const [heartBurst, setHeartBurst] = useState(false);
  const [toast, setToast] = useState(null);
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
      if (res.data.liked) {
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 350);
      }
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
  const isRetweet = post.retweet_type === 'retweet';
  const isQuote = post.retweet_type === 'quote';

  return (
    <div className="card card-hover animate-fade-in-up relative">
      {/* Toast notification */}
      {toast && (
        <div className={`absolute top-3 right-3 z-10 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg animate-toast-in ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Retweet indicator */}
      {isRetweet && (
        <div className="flex items-center gap-2 text-xs font-medium mb-3 text-retweet">
          <HiSwitchHorizontal className="w-4 h-4" />
          <span>{post.user?.display_name} đã retweet</span>
        </div>
      )}

      {isQuote && (
        <div className="flex items-center gap-2 text-xs font-medium mb-3 text-comment">
          <HiSwitchHorizontal className="w-4 h-4" />
          <span>{post.user?.display_name} đã quote</span>
        </div>
      )}

      {/* Main post content */}
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.user?.username}`} className="flex-shrink-0">
          <Avatar src={post.user?.avatar_url} alt={post.user?.display_name} />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header: name + username + time */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/profile/${post.user?.username}`}
              className="font-semibold text-[15px] text-text-primary hover:underline truncate max-w-[160px]">
              {post.user?.display_name}
            </Link>
            <span className="text-text-tertiary text-sm font-normal truncate max-w-[120px]">@{post.user?.username}</span>
            <span className="text-text-tertiary text-sm">·</span>
            <Link to={`/post/${post.id}`} className="text-text-tertiary text-xs hover:underline whitespace-nowrap">
              {formatDate(post.created_at)}
            </Link>
          </div>

          {/* Post body */}
          {post.content && <PostContent content={post.content} />}

          {/* Images (multi-image grid) */}
          {(post.images?.length > 0 || post.image_url) && (
            <SensitiveWrapper isSensitive={post.is_sensitive}>
              <div className={`grid gap-1 mt-3 ${
                (post.images?.length || 1) === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {(post.images?.length > 0 ? post.images : [post.image_url]).map((url, i) => (
                  <img key={i} src={url} alt=""
                    className={`rounded-xl w-full object-cover border border-border-light ${
                      (post.images?.length || 1) === 1 ? 'max-h-96' : 'max-h-64'
                    }`} loading="lazy" />
                ))}
              </div>
            </SensitiveWrapper>
          )}

          {/* Video */}
          {post.video_url && !post.images?.length && !post.image_url && (
            <SensitiveWrapper isSensitive={post.is_sensitive}>
              <div className="relative max-w-md">
                <video src={post.video_url} controls muted autoPlay loop playsInline
                  className="rounded-xl w-full max-h-96 object-contain bg-black border border-border" />
                <span className="badge-media">VIDEO</span>
              </div>
            </SensitiveWrapper>
          )}

          {/* GIF */}
          {post.gif_url && !post.images?.length && !post.image_url && (
            <SensitiveWrapper isSensitive={post.is_sensitive}>
              <div className="relative inline-block">
                <img src={post.gif_url} alt="GIF"
                  className="rounded-xl w-full max-h-80 object-contain border border-border-light bg-surface-100"
                  loading="lazy" />
                <span className="badge-media">GIF</span>
              </div>
            </SensitiveWrapper>
          )}

          {/* Embedded original post (for retweet/quote) */}
          {(isRetweet || isQuote) && post.retweet?.original_post && (
            <div className="mt-3 border border-border rounded-xl p-3 bg-surface-50">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar src={post.retweet.original_post.user?.avatar_url} size="sm" />
                <Link to={`/profile/${post.retweet.original_post.user?.username}`}
                  className="font-semibold text-sm text-text-primary hover:underline">
                  {post.retweet.original_post.user?.display_name}
                </Link>
                <span className="text-text-tertiary text-xs">@{post.retweet.original_post.user?.username}</span>
                <span className="text-text-tertiary text-xs">{formatDate(post.retweet.original_post.created_at)}</span>
              </div>
              {post.retweet.original_post.content && (
                <PostContent content={post.retweet.original_post.content} />
              )}
              {post.retweet.original_post.image_url && (
                <img src={post.retweet.original_post.image_url} alt=""
                  className="mt-2 rounded-lg max-h-48 object-cover border border-border-light" loading="lazy" />
              )}
              {post.retweet.original_post.video_url && (
                <div className="relative mt-2 max-w-sm">
                  <video src={post.retweet.original_post.video_url} controls muted autoPlay loop playsInline
                    className="rounded-lg max-h-60 w-full object-contain bg-black border border-border" />
                  <span className="badge-media">VIDEO</span>
                </div>
              )}
              {post.retweet.original_post.gif_url && (
                <div className="relative mt-2 inline-block">
                  <img src={post.retweet.original_post.gif_url} alt="GIF"
                    className="rounded-lg max-h-60 w-full object-contain border border-border-light bg-surface-100" loading="lazy" />
                  <span className="badge-media">GIF</span>
                </div>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between max-w-md mt-3 pt-2.5 border-t border-border-light">
            {/* Comment button */}
            <ActionBtn
              onClick={() => setShowComments(!showComments)}
              active={showComments}
              activeColor="text-comment"
              hoverColor="hover:text-comment"
              hoverBg="hover:bg-comment-bg"
              icon={HiOutlineChat}
              count={commentsCount}
              label="Bình luận"
            />

            {/* Retweet button */}
            {user && !isOwner && (
              <div className="relative group">
                <ActionBtn
                  onClick={handleRetweet}
                  disabled={retweeting}
                  activeColor="text-retweet"
                  hoverColor="hover:text-retweet"
                  hoverBg="hover:bg-retweet-bg"
                  icon={HiSwitchHorizontal}
                  label="Retweet"
                />
                {/* Quote dropdown */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <button onClick={() => setShowQuoteModal(true)}
                    className="text-xs bg-surface-0 border border-border rounded-lg px-3 py-1.5 shadow-dropdown hover:bg-surface-50 whitespace-nowrap text-text-primary font-medium transition-colors">
                    Quote Tweet
                  </button>
                </div>
              </div>
            )}

            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={!user || liking}
              className={`group flex items-center gap-1.5 text-sm font-medium transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isLiked ? 'text-like' : 'text-text-tertiary hover:text-like'}`}
              title="Thích"
            >
              <span className={`p-1.5 rounded-full transition-all duration-200 group-hover:bg-like-bg ${isLiked ? 'bg-like-bg' : ''}`}>
                <HiHeart className={`w-[18px] h-[18px] transition-all duration-200 ${heartBurst ? 'animate-heart-burst' : ''} ${isLiked ? 'fill-current' : ''}`} />
              </span>
              {likesCount > 0 && <span className={isLiked ? 'text-like' : ''}>{likesCount}</span>}
            </button>

            {/* Delete button (owner only) */}
            {isOwner && (
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1 text-sm text-text-tertiary hover:text-rose-500 transition-colors ml-auto group"
                title="Xóa">
                <span className="p-1.5 rounded-full transition-all duration-200 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10">
                  <HiOutlineTrash className="w-[18px] h-[18px]" />
                </span>
              </button>
            )}
          </div>

          {/* Quote modal */}
          {showQuoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQuoteModal(false)}>
              <div className="bg-surface-0 rounded-2xl p-6 w-full max-w-md mx-4 shadow-dropdown animate-toast-in" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-text-primary mb-3">Quote Tweet</h3>
                <textarea value={quoteContent} onChange={e => setQuoteContent(e.target.value)}
                  placeholder="Thêm bình luận của bạn..."
                  rows={3} maxLength={280}
                  className="w-full border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none bg-surface-0 text-text-primary placeholder:text-text-placeholder" />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-text-tertiary">{quoteContent.length}/280</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowQuoteModal(false)} className="btn-ghost text-xs">Hủy</button>
                    <button onClick={handleQuoteRetweet} disabled={!quoteContent.trim() || retweeting}
                      className="btn-primary text-xs !py-2">Đăng</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-border-light">
              {user && <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />}
              <CommentList postId={post.id} onCommentDeleted={handleCommentDeleted} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Action button với hover color + background riêng */
function ActionBtn({ onClick, disabled, active, activeColor, hoverColor, hoverBg, icon: Icon, count, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-1 text-sm font-medium transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${active ? activeColor : `text-text-tertiary ${hoverColor}`}`}
      title={label}
    >
      <span className={`p-1.5 rounded-full transition-all duration-200 ${hoverBg} ${active ? 'bg-current/10' : ''}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
