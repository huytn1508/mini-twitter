import { useState, useEffect } from 'react';
import { postsAPI } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import PostForm from '../components/posts/PostForm';
import PostList from '../components/posts/PostList';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const fetchPosts = async (pageNum = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      const fetcher = tab === 'following' ? postsAPI.getFollowing : postsAPI.getAll;
      const res = await fetcher(pageNum);
      const newPosts = res.data.posts;
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPosts(1);
  }, [tab]);

  const handlePostCreated = (newPost) => {
    if (tab === 'all') setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex border-b border-neutral-200 mb-5">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 ${
            tab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setTab('following')}
          disabled={!isAuthenticated}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 ${
            tab === 'following'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          } disabled:opacity-50`}
        >
          Đang follow
        </button>
      </div>

      {/* Post Form */}
      {isAuthenticated && tab === 'all' && (
        <PostForm onPostCreated={handlePostCreated} />
      )}

      {/* Post List */}
      <PostList
        posts={posts}
        loading={loading}
        error={error}
        onRetry={() => fetchPosts(1)}
        onPostDelete={handlePostDelete}
        emptyMessage={
          tab === 'following'
            ? 'Chưa follow ai. Hãy follow mọi người để xem bài viết!'
            : 'Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!'
        }
      />

      {/* Load More */}
      {posts.length > 0 && !loading && (
        <div className="text-center mt-6">
          <button onClick={handleLoadMore} className="btn-outline text-sm">Xem thêm</button>
        </div>
      )}
    </div>
  );
}
