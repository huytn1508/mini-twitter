import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatDate';
import Avatar from '../components/ui/Avatar';

export default function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetch = () => {
      client.get(`/chat/conversations/${id}/messages`)
        .then(res => {
          setMessages(res.data.messages || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetch();
    const interval = setInterval(fetch, 3000); // Poll mỗi 3s
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Get other user from conversations list
  useEffect(() => {
    client.get('/chat/conversations').then(res => {
      const conv = (res.data.conversations || []).find(c => c.id === parseInt(id));
      if (conv) setOtherUser(conv.other_user);
    }).catch(() => {});
  }, [id]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await client.post(`/chat/conversations/${id}/messages`, { content: content.trim() });
      setMessages(prev => [...prev, { ...res.data.message, sender: { username: user.username, display_name: user.display_name, avatar_url: user.avatar_url }, is_mine: true }]);
      setContent('');
    } catch (err) { console.error('Send failed:', err); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-200">
        <Link to="/messages" className="p-1.5 hover:bg-neutral-100 rounded-full"><HiArrowLeft className="w-5 h-5" /></Link>
        {otherUser && (
          <Link to={`/profile/${otherUser.username}`} className="flex items-center gap-2">
            <Avatar src={otherUser.avatar_url} size="sm" />
            <span className="font-semibold text-sm">{otherUser.display_name}</span>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {loading ? <p className="text-center text-neutral-400 text-sm py-8">Đang tải...</p> :
         messages.length === 0 ? <p className="text-center text-neutral-400 text-sm py-8">Chưa có tin nhắn</p> :
         messages.map(m => (
          <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
            {!m.is_mine && <Avatar src={m.sender?.avatar_url} size="sm" className="mr-2 flex-shrink-0" />}
            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
              m.is_mine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
            }`}>
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              <span className={`text-[10px] mt-1 block ${m.is_mine ? 'text-indigo-200' : 'text-neutral-400'}`}>
                {formatDate(m.created_at)}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 pt-3 border-t border-neutral-200">
        <input value={content} onChange={e => setContent(e.target.value)}
          placeholder="Nhập tin nhắn..." maxLength={1000}
          className="input-field flex-1 !py-2.5" />
        <button type="submit" disabled={!content.trim() || sending}
          className="btn-primary !py-2.5 !px-5">Gửi</button>
      </form>
    </div>
  );
}
