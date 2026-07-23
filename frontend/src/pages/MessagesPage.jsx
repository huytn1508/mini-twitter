import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiPencilAlt, HiSearch, HiX } from 'react-icons/hi';
import { supabase } from '../lib/supabase';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

/** Format thời gian tương đối */
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

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null); // mobile: selected chat id

  // ── Load conversations ─────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await client.get('/chat/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Realtime: cập nhật last message + unread ───────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('chat:inbox', {
      config: { broadcast: { self: true } },
    });

    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, () => {
      // Reload conversations khi có tin nhắn mới
      loadConversations();
    });

    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
    }, () => {
      loadConversations();
    });

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadConversations]);

  // ── Search users ───────────────────────────────────────────
  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await client.get(`/chat/search-users?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.users || []);
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  // ── Start conversation ─────────────────────────────────────
  const startChat = async (username) => {
    try {
      const res = await client.post('/chat/start', { username });
      setShowNewMsg(false);
      setSearchQuery('');
      setSearchResults([]);
      navigate(`/messages/${res.data.conversation_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể bắt đầu chat');
    }
  };

  // ── Mobile layout ──────────────────────────────────────────
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <HiOutlineMail className="w-5 h-5" /> Tin nhắn
        </h1>
        <button onClick={() => setShowNewMsg(true)}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all" title="Tin nhắn mới">
          <HiPencilAlt className="w-5 h-5" />
        </button>
      </div>

      {/* Loading */}
      {loading && <Spinner size="lg" className="py-24" />}

      {/* Empty state */}
      {!loading && conversations.length === 0 && (
        <div className="text-center py-20">
          <span className="text-5xl">💬</span>
          <h3 className="text-lg font-semibold text-neutral-700 mt-4">Chưa có tin nhắn nào</h3>
          <p className="text-neutral-400 text-sm mt-1">Gửi tin nhắn cho bạn bè ngay!</p>
          <button onClick={() => setShowNewMsg(true)}
            className="btn-primary mt-4 !text-sm">
            Tin nhắn mới
          </button>
        </div>
      )}

      {/* Conversations list */}
      {!loading && conversations.length > 0 && (
        <div className="space-y-1">
          {conversations.map(c => (
            <Link key={c.id} to={`/messages/${c.id}`}
              className="card hover:shadow-md flex items-center gap-3 transition-shadow p-3">
              <div className="relative flex-shrink-0">
                <Avatar src={c.other_user?.avatar_url} />
                {/* Online dot placeholder — updated via presence in ChatPage */}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-neutral-900 truncate">
                    {c.other_user?.display_name}
                  </span>
                  {c.last_message && (
                    <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                      {relativeTime(c.last_message.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-sm truncate ${c.unread_count > 0 ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                    {c.last_message?.is_mine && (
                      <span className="text-neutral-400 mr-1">{c.last_message?.is_read ? '✓✓' : '✓'}</span>
                    )}
                    {c.last_message?.image_url ? '📷 Ảnh' : c.last_message?.content || 'Bắt đầu trò chuyện'}
                  </span>

                  {c.unread_count > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                      {c.unread_count > 99 ? '99+' : c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── New Message Modal ────────────────────────────────── */}
      {showNewMsg && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50" onClick={() => setShowNewMsg(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900">Tin nhắn mới</h3>
              <button onClick={() => setShowNewMsg(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-full">
                <HiX className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Search input */}
            <div className="p-4">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  value={searchQuery}
                  onChange={e => searchUsers(e.target.value)}
                  placeholder="Tìm kiếm theo username..."
                  className="input-field !pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto border-t border-neutral-100">
              {searching ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : searchResults.length === 0 && searchQuery.trim() ? (
                <p className="text-center text-neutral-400 text-sm py-8">Không tìm thấy người dùng</p>
              ) : (
                searchResults.map(u => (
                  <button key={u.username}
                    onClick={() => startChat(u.username)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-all text-left">
                    <Avatar src={u.avatar_url} />
                    <div>
                      <span className="font-semibold text-sm text-neutral-900 block">{u.display_name}</span>
                      <span className="text-sm text-neutral-500">@{u.username}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
