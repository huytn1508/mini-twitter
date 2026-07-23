import { useState, useEffect } from 'react';
import { HiSearch, HiFire, HiUserGroup } from 'react-icons/hi';
import PostList from '../components/posts/PostList';
import TrendingSidebar from '../components/layout/TrendingSidebar';
import client from '../api/client';

export default function ExplorePage() {
  const [tab, setTab] = useState('trending');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await client.get(`/search?q=${query}`);
      setPosts(res.data.posts || []);
    } catch (err) { setError('Tìm kiếm thất bại'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="card mb-4">
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Tìm kiếm bài viết..."
            className="input-field flex-1" />
          <button onClick={search} className="btn-primary !py-2 !px-4"><HiSearch className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {[{ key: 'trending', label: 'Xu hướng', icon: HiFire },
          { key: 'search', label: 'Kết quả', icon: HiSearch }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary hover:bg-surface-50 dark:hover:bg-surface-100'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'trending' ? (
        <TrendingSidebar />
      ) : (
        <PostList posts={posts} loading={loading} error={error} onRetry={search}
          emptyMessage={query ? `Không tìm thấy "${query}"` : 'Nhập từ khóa để tìm kiếm'} />
      )}
    </div>
  );
}
