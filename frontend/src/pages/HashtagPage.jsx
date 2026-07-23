import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiHashtag } from 'react-icons/hi';
import PostList from '../components/posts/PostList';
import client from '../api/client';

export default function HashtagPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get(`/hashtags/${tag}`);
      setPosts(res.data.posts);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [tag]);

  return (
    <div>
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <HiHashtag className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">#{tag}</h1>
            <p className="text-sm text-neutral-500">
              {loading ? 'Đang tải...' : `${posts.length} bài viết`}
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <PostList
        posts={posts}
        loading={loading}
        error={error}
        onRetry={fetchPosts}
        emptyMessage={`Chưa có bài viết nào với #${tag}`}
      />
    </div>
  );
}
