import { useState, useRef, useCallback } from 'react';
import { HiPhotograph, HiX, HiEmojiHappy, HiOutlinePhotograph, HiClock, HiEyeOff } from 'react-icons/hi';
import EmojiPicker from 'emoji-picker-react';
import { postsAPI } from '../../api/posts';
import { useAuth } from '../../context/AuthContext';
import { validatePostContent } from '../../utils/validators';
import Avatar from '../ui/Avatar';

const MAX_CHARS = 280;
const GIPHY_API = 'https://api.giphy.com/v1/gifs';
const GIPHY_KEY = 'YOUR_GIPHY_API_KEY'; // 👈 Đăng ký tại developers.giphy.com

export default function PostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [isSensitive, setIsSensitive] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const fileInputRef = useRef(null);

  const charsLeft = MAX_CHARS - content.length;

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) { setError('Tối đa 4 ảnh'); return; }
    files.forEach(f => {
      if (!f.type.startsWith('image/')) return;
      if (f.size > 5 * 1024 * 1024) { setError('Ảnh không được vượt quá 5MB'); return; }
      setImages(prev => [...prev, f]);
      setImagePreviews(prev => [...prev, URL.createObjectURL(f)]);
    });
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(imagePreviews[i]);
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleEmojiClick = useCallback((emoji) => {
    setContent(prev => prev + emoji.emoji);
    setShowEmoji(false);
  }, []);

  const searchGif = async () => {
    if (!gifSearch.trim()) return;
    try {
      const res = await fetch(`${GIPHY_API}/search?api_key=${GIPHY_KEY}&q=${gifSearch}&limit=12&rating=g`);
      const data = await res.json();
      setGifResults(data.data || []);
    } catch { setError('Tìm GIF thất bại'); }
  };

  const selectGif = (gif) => {
    const gifUrl = gif.images?.original?.url;
    setImagePreviews(prev => [...prev, gifUrl]);
    setImages(prev => [...prev, { isGif: true, url: gifUrl }]);
    setShowGif(false);
    setGifSearch('');
    setGifResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validatePostContent(content);
    if (validationError && images.length === 0) { setError(validationError); return; }
    if (!content.trim() && images.length === 0) { setError('Vui lòng nhập nội dung hoặc thêm ảnh'); return; }
    setPosting(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (isSensitive) formData.append('is_sensitive', 'true');
      if (scheduleDate) formData.append('scheduled_at', new Date(scheduleDate).toISOString());

      // Upload images (non-GIF)
      const realImages = images.filter(img => !img.isGif);
      realImages.forEach(img => formData.append('images', img));

      // GIF URLs (gửi riêng)
      const gifImages = images.filter(img => img.isGif);
      if (gifImages.length > 0) formData.append('images', gifImages[0]);

      const res = await postsAPI.create(formData);
      setContent('');
      setImages([]);
      imagePreviews.forEach(p => URL.revokeObjectURL(p));
      setImagePreviews([]);
      setIsSensitive(false);
      setScheduleDate('');
      onPostCreated?.(res.data.post);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng bài thất bại. Thử lại!');
    } finally { setPosting(false); }
  };

  if (!user) return null;

  return (
    <div className="card mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar src={user.avatar_url} alt={user.display_name} />
          <div className="flex-1 min-w-0">
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì?" rows={3}
              className="w-full resize-none border-0 focus:ring-0 text-[15px] text-neutral-800 placeholder:text-neutral-400 bg-transparent outline-none leading-relaxed"
              maxLength={MAX_CHARS + 50} />

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className={`grid gap-2 mt-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative">
                    <img src={preview} alt="" className="rounded-xl max-h-48 w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 bg-neutral-900/70 text-white rounded-full p-1 hover:bg-neutral-900">
                      <HiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sensitive toggle indicator */}
            {isSensitive && (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                <HiEyeOff className="w-4 h-4" /> Nội dung nhạy cảm
              </div>
            )}

            {/* Schedule indicator */}
            {scheduleDate && (
              <div className="flex items-center gap-2 mt-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5">
                <HiClock className="w-4 h-4" /> Đăng vào {new Date(scheduleDate).toLocaleString('vi-VN')}
              </div>
            )}

            {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-full transition-all" title="Thêm ảnh">
                  <HiPhotograph className="w-5 h-5" />
                </button>

                {/* GIF button */}
                <button type="button" onClick={() => setShowGif(!showGif)}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-full transition-all" title="GIF">
                  <HiOutlinePhotograph className="w-5 h-5" />
                </button>

                {/* Emoji button */}
                <div className="relative">
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-full transition-all" title="Emoji">
                    <HiEmojiHappy className="w-5 h-5" />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} />
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div className="relative">
                  <button type="button" onClick={() => document.getElementById('schedule-input').showPicker()}
                    className={`p-2 rounded-full transition-all ${scheduleDate ? 'text-indigo-600 bg-indigo-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}`} title="Lên lịch">
                    <HiClock className="w-5 h-5" />
                  </button>
                  <input id="schedule-input" type="datetime-local" value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="absolute opacity-0 w-0 h-0" />
                </div>

                {/* Content warning */}
                <button type="button" onClick={() => setIsSensitive(!isSensitive)}
                  className={`p-2 rounded-full transition-all ${isSensitive ? 'text-amber-600 bg-amber-50' : 'text-neutral-400 hover:text-amber-600 hover:bg-amber-50'}`} title="Nội dung nhạy cảm">
                  <HiEyeOff className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${charsLeft < 0 ? 'text-rose-500' : charsLeft < 20 ? 'text-amber-500' : 'text-neutral-400'}`}>
                  {content.length > 0 ? charsLeft : ''}
                </span>
                <button type="submit" disabled={posting || (!content.trim() && images.length === 0) || charsLeft < 0}
                  className="btn-primary !py-2 !px-5 !text-sm">
                  {posting ? 'Đang đăng...' : scheduleDate ? 'Lên lịch' : 'Đăng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* GIF Search Popover */}
      {showGif && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex gap-2 mb-3">
            <input value={gifSearch} onChange={e => setGifSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchGif())}
              placeholder="Tìm GIF..." className="input-field !py-2 !text-sm" autoFocus />
            <button type="button" onClick={searchGif} className="btn-primary !py-2 !text-xs">Tìm</button>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {gifResults.map(gif => (
              <img key={gif.id} src={gif.images?.fixed_height_small?.url} alt={gif.title}
                onClick={() => selectGif(gif)}
                className="rounded-lg cursor-pointer hover:ring-2 ring-indigo-500 w-full object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
