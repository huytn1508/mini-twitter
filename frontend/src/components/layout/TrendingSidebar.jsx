import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiFire } from 'react-icons/hi';
import client from '../../api/client';

export default function TrendingSidebar() {
  const [trending, setTrending] = useState([]);
  const [period, setPeriod] = useState('day');

  useEffect(() => {
    client.get(`/trending?period=${period}`)
      .then(res => setTrending(res.data.trending || []))
      .catch(() => {});
  }, [period]);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <HiFire className="w-5 h-5 text-amber-500" />
        <h2 className="font-bold text-lg text-text-primary">Xu hướng</h2>
      </div>

      {/* Period toggle — pill style */}
      <div className="flex bg-surface-100 dark:bg-surface-100 rounded-full p-0.5 mb-4">
        <button onClick={() => setPeriod('day')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
            period === 'day'
              ? 'bg-surface-0 text-text-primary shadow-sm dark:bg-surface-200'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}>
          24h qua
        </button>
        <button onClick={() => setPeriod('week')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
            period === 'week'
              ? 'bg-surface-0 text-text-primary shadow-sm dark:bg-surface-200'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}>
          7 ngày
        </button>
      </div>

      {/* Trending list */}
      {trending.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-6">Chưa có xu hướng</p>
      ) : (
        <div className="space-y-0.5">
          {trending.map((t, i) => (
            <Link key={t.name} to={`/hashtag/${t.name}`}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-100 transition-all duration-200 group">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-bold w-5 text-right flex-shrink-0 ${
                  i < 3 ? 'text-primary-600' : 'text-text-tertiary'
                }`}>{i + 1}</span>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors block truncate">
                    #{t.name}
                  </span>
                  <span className="text-xs text-text-tertiary">{t.count} bài viết</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
