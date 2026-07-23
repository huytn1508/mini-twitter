import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMail } from 'react-icons/hi';
import client from '../api/client';
import Avatar from '../components/ui/Avatar';
import { formatDate } from '../utils/formatDate';
import Spinner from '../components/ui/Spinner';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/chat/conversations')
      .then(res => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" className="py-24" />;

  return (
    <div>
      <h1 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
        <HiOutlineMail className="w-5 h-5" /> Tin nhắn
      </h1>

      {conversations.length === 0 ? (
        <div className="card text-center py-12 text-neutral-400 text-sm">
          Chưa có tin nhắn nào
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <Link key={c.id} to={`/messages/${c.id}`}
              className="card hover:shadow-md flex items-center gap-3 transition-shadow">
              <Avatar src={c.other_user?.avatar_url} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-neutral-900">{c.other_user?.display_name}</span>
                  {c.last_message && (
                    <span className="text-xs text-neutral-400">{formatDate(c.last_message.created_at)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm text-neutral-500 truncate">
                    {c.last_message?.is_mine && 'Bạn: '}{c.last_message?.content || 'Bắt đầu trò chuyện'}
                  </span>
                  {c.unread_count > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
