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
        <h2 className="font-bold text-neutral-900">Xu hướng</h2>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 mb-4">
        <button onClick={() => setPeriod('day')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${
            period === 'day' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:bg-neutral-100'
          }`}>
          24h qua
        </button>
        <button onClick={() => setPeriod('week')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${
            period === 'week' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:bg-neutral-100'
          }`}>
          7 ngày
        </button>
      </div>

      {/* Trending list */}
      {trending.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-4">Chưa có xu hướng</p>
      ) : (
        <div className="space-y-1">
          {trending.map((t, i) => (
            <Link key={t.name} to={`/hashtag/${t.name}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
              <div>
                <span className="text-xs font-medium text-neutral-400">{i + 1}</span>
                <span className="ml-2 text-sm font-semibold text-neutral-900">#{t.name}</span>
              </div>
              <span className="text-xs text-neutral-400">{t.count} bài</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
