import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiPhotograph, HiX } from 'react-icons/hi';
import { supabase } from '../lib/supabase';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';

/** Format thời gian cho chat */
function chatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer = useRef(null);
  const channelRef = useRef(null);

  // ── Fetch other user info ──────────────────────────────────
  useEffect(() => {
    client.get('/chat/conversations')
      .then(res => {
        const conv = (res.data.conversations || []).find(c => c.id === parseInt(id));
        if (conv) setOtherUser(conv.other_user);
      })
      .catch(() => {});
  }, [id]);

  // ── Load message history ───────────────────────────────────
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    client.get(`/chat/conversations/${id}/messages`)
      .then(res => setMessages(res.data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // ── Auto-scroll to bottom ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Supabase Realtime: messages + typing + presence ────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase.channel(`chat:${id}`, {
      config: {
        presence: { key: user?.id },
        broadcast: { self: true },
      },
    });

    // Lắng nghe INSERT messages (CDC Postgres)
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${id}`,
    }, (payload) => {
      const msg = payload.new;
      if (msg.sender_id === user?.id) return; // Bỏ qua tin của chính mình (đã thêm qua send)
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id,
          content: msg.content,
          image_url: msg.image_url || null,
          created_at: msg.created_at,
          is_read: msg.is_read,
          sender: otherUser ? {
            username: otherUser.username,
            display_name: otherUser.display_name,
            avatar_url: otherUser.avatar_url,
          } : null,
          is_mine: false,
        }];
      });
      // Đánh dấu đã đọc
      client.put(`/chat/conversations/${id}/read`).catch(() => {});
    });

    // Lắng nghe UPDATE messages (read receipts)
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${id}`,
    }, (payload) => {
      setMessages(prev => prev.map(m =>
        m.id === payload.new.id ? { ...m, is_read: payload.new.is_read, read_at: payload.new.read_at } : m
      ));
    });

    // Typing indicator (broadcast)
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId === user?.id) return;
      setIsTyping(payload.payload.isTyping);
      if (payload.payload.isTyping) {
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Online/Offline presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const otherOnline = Object.values(state).some(
        presences => presences.some(p => p.user_id !== user?.id)
      );
      setIsOnline(otherOnline);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && user) {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      clearTimeout(typingTimer.current);
      supabase.removeChannel(channel);
    };
  }, [id, user, otherUser]);

  // ── Broadcast typing ───────────────────────────────────────
  const broadcastTyping = useCallback((isTypingNow) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, isTyping: isTypingNow },
      });
    }
  }, [user]);

  // ── Send message ───────────────────────────────────────────
  const send = async (e) => {
    e.preventDefault();
    if ((!content.trim() && !image) || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (image) formData.append('image', image);

      const res = await client.post(`/chat/conversations/${id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessages(prev => [...prev, res.data.message]);
      setContent('');
      setImage(null);
      setImagePreview(null);
      broadcastTyping(false);
    } catch (err) {
      console.error('Send failed:', err);
    } finally { setSending(false); }
  };

  // ── Image select ───────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Handle typing broadcast ────────────────────────────────
  const handleContentChange = (e) => {
    setContent(e.target.value);
    broadcastTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => broadcastTyping(false), 2000);
  };

  // ── Go back (mobile) ───────────────────────────────────────
  const goBack = () => navigate('/messages');

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2 pb-3 border-b border-neutral-200">
        <button onClick={goBack}
          className="p-1.5 hover:bg-neutral-100 rounded-full lg:hidden" title="Quay lại">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <Link to="/messages"
          className="p-1.5 hover:bg-neutral-100 rounded-full hidden lg:block" title="Quay lại">
          <HiArrowLeft className="w-5 h-5" />
        </Link>

        {otherUser && (
          <Link to={`/profile/${otherUser.username}`} className="flex items-center gap-2.5">
            <div className="relative">
              <Avatar src={otherUser.avatar_url} size="sm" />
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <div>
              <span className="font-semibold text-sm text-neutral-900 block leading-tight">
                {otherUser.display_name}
              </span>
              <span className="text-xs text-neutral-400">
                {isTyping ? 'Đang soạn tin...' : isOnline ? 'Đang online' : 'Offline'}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* ── Message list ────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {loading ? (
          <p className="text-center text-neutral-400 text-sm py-12">Đang tải...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">💬</span>
            <p className="text-neutral-400 text-sm mt-3">Gửi tin nhắn đầu tiên!</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const showAvatar = !m.is_mine && (i === 0 || messages[i - 1]?.is_mine);
            const showTail = i === messages.length - 1 || messages[i + 1]?.is_mine !== m.is_mine;

            return (
              <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-1.5 max-w-[75%] ${m.is_mine ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar người kia (chỉ hiện ở tin cuối của nhóm) */}
                  {showTail && !m.is_mine && (
                    <Avatar src={m.sender?.avatar_url} size="sm" className="flex-shrink-0 mb-0.5" />
                  )}
                  {showTail && m.is_mine && <div className="w-8 flex-shrink-0" />}

                  <div className="space-y-0.5">
                    {/* Tin nhắn ảnh */}
                    {m.image_url && (
                      <img src={m.image_url} alt="attachment"
                        className={`rounded-2xl max-w-60 max-h-80 object-cover ${
                          m.is_mime ? 'rounded-br-md' : 'rounded-bl-md'
                        }`} loading="lazy" />
                    )}

                    {/* Tin nhắn text */}
                    {m.content && (
                      <div className={`px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        m.is_mine
                          ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md'
                          : 'bg-neutral-100 text-neutral-900 rounded-2xl rounded-bl-md'
                      }`}>
                        {m.content}
                      </div>
                    )}

                    {/* Timestamp + read receipt */}
                    {showTail && (
                      <div className={`flex items-center gap-1.5 ${m.is_mine ? 'justify-end pr-1' : 'pl-1'}`}>
                        <span className="text-[10px] text-neutral-400">{chatTime(m.created_at)}</span>
                        {m.is_mine && m.is_read && (
                          <span className="text-[10px] text-indigo-500 font-medium">Đã xem</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end gap-1.5">
              <Avatar src={otherUser?.avatar_url} size="sm" />
              <div className="bg-neutral-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Image preview ───────────────────────── */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img src={imagePreview} alt="preview" className="rounded-xl max-h-32 object-cover" />
          <button onClick={() => { setImage(null); setImagePreview(null); }}
            className="absolute -top-1.5 -right-1.5 bg-neutral-800 text-white rounded-full p-0.5">
            <HiX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Input bar ───────────────────────────── */}
      <form onSubmit={send} className="flex items-center gap-2 pt-3 border-t border-neutral-200">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 rounded-full transition-all flex-shrink-0" title="Gửi ảnh">
          <HiPhotograph className="w-5 h-5" />
        </button>

        <input
          value={content}
          onChange={handleContentChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
          placeholder="Bắt đầu tin nhắn..."
          maxLength={1000}
          className="input-field flex-1 !py-2.5"
          autoFocus
        />

        <button type="submit" disabled={(!content.trim() && !image) || sending}
          className="bg-indigo-600 text-white rounded-full p-2.5 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0" title="Gửi">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
