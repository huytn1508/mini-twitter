import PostCard from './PostCard';
import EmptyState from '../ui/EmptyState';
import ErrorMessage from '../ui/ErrorMessage';
import { SkeletonPostList } from '../ui/SkeletonPost';
import { HiOutlineNewspaper } from 'react-icons/hi';

export default function PostList({ posts, loading, error, onRetry, onPostDelete, emptyMessage }) {
  if (loading) {
    return <SkeletonPostList count={3} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineNewspaper}
        title={emptyMessage || 'Chưa có bài viết nào'}
        description="Hãy follow mọi người để xem bài viết của họ!"
      />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, idx) => (
        <div key={post.id} style={{ animationDelay: `${Math.min(idx, 4) * 60}ms` }}
          className="animate-fade-in-up">
          <PostCard post={post} onDelete={onPostDelete} />
        </div>
      ))}
    </div>
  );
}
