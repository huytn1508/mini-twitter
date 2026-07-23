import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineBell, HiHeart, HiOutlineChat, HiSwitchHorizontal, HiUserAdd, HiAtSymbol } from 'react-icons/hi';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

/** Mô tả từng loại notification */
const NOTIF_INFO = {
  like:    { icon: HiHeart,               color: 'text-rose-500',  bg: 'bg-rose-50 dark:bg-rose-500/10',  text: 'đã thích bài viết của bạn' },
  comment: { icon: HiOutlineChat,         color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'đã bình luận bài viết của bạn' },
  retweet: { icon: HiSwitchHorizontal,    color: 'text-emerald-500',  bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'đã retweet bài viết của bạn' },
  quote:   { icon: HiSwitchHorizontal,    color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'đã quote bài viết của bạn' },
  follow:  { icon: HiUserAdd,             color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10',  text: 'đã theo dõi bạn' },
  mention: { icon: HiAtSymbol,            color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'đã nhắc đến bạn' },
};

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    try {
      const res = await client.get('/notifications');
      setNotifs(res.data.notifications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await client.post('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <HiOutlineBell className="w-5 h-5" /> Thông báo
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium px-3 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <Spinner size="lg" className="py-24" />}

      {/* Empty */}
      {!loading && notifs.length === 0 && (
        <div className="text-center py-20">
          <span className="text-5xl">🔔</span>
          <h3 className="text-lg font-semibold text-text-secondary mt-4">Chưa có thông báo nào</h3>
          <p className="text-text-tertiary text-sm mt-1">Tương tác với mọi người để nhận thông báo</p>
        </div>
      )}

      {/* Notification list */}
      {!loading && notifs.length > 0 && (
        <div className="space-y-0.5">
          {notifs.map(n => {
            const info = NOTIF_INFO[n.type] || NOTIF_INFO.like;
            const Icon = info.icon;
            return (
              <div key={n.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  n.is_read
                    ? 'hover:bg-surface-50 dark:hover:bg-surface-100'
                    : 'bg-primary-50/40 dark:bg-primary-900/20 border-l-2 border-primary-500'
                }`}>
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full ${info.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${info.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {n.actor && (
                      <Link to={`/profile/${n.actor.username}`} className="flex items-center gap-1.5 hover:underline flex-shrink-0">
                        <Avatar src={n.actor.avatar_url} size="sm" />
                        <span className="font-semibold text-sm text-text-primary">{n.actor.display_name}</span>
                      </Link>
                    )}
                    <span className="text-sm text-text-secondary truncate">{info.text}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" title="Chưa đọc" />
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary mt-0.5 block">{relativeTime(n.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
