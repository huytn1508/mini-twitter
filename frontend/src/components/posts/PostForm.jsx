import { useState, useRef, useCallback, useEffect } from 'react';
import { HiPhotograph, HiX, HiEmojiHappy, HiOutlineFilm, HiClock, HiEyeOff, HiSearch, HiVideoCamera } from 'react-icons/hi';
import EmojiPicker from 'emoji-picker-react';
import { postsAPI } from '../../api/posts';
import { useAuth } from '../../context/AuthContext';
import { validatePostContent } from '../../utils/validators';
import { searchGifs, getTrending, debounce } from '../../services/giphy';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

const MAX_CHARS = 280;

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
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState('');
  const [gifUrl, setGifUrl] = useState(null);        // URL gốc lưu vào DB
  const [gifPreview, setGifPreview] = useState(null); // URL preview trong compose
  const [video, setVideo] = useState(null);           // File video
  const [videoPreview, setVideoPreview] = useState(null); // URL preview
  const [isSensitive, setIsSensitive] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const fileInputRef = useRef(null);

  const charsLeft = MAX_CHARS - content.length;

  // ── Media (Ảnh + Video) ─────────────────────────────────────
  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFile = files.find(f => f.type.startsWith('video/'));

    // Video: chỉ 1, thay thế ảnh + GIF
    if (videoFile) {
      if (videoFile.size > 100 * 1024 * 1024) { setError('Video không được vượt quá 100MB'); return; }
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      imagePreviews.forEach(p => URL.revokeObjectURL(p));
      setVideo(videoFile);
      setVideoPreview(URL.createObjectURL(videoFile));
      setImages([]);
      setImagePreviews([]);
      setGifUrl(null);
      setGifPreview(null);
      setError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Ảnh: tối đa 4, chỉ nhận nếu chưa có video
    if (imageFiles.length > 0) {
      if (video) { setError('Chỉ được chọn ảnh hoặc video, không phải cả hai'); return; }
      if (images.length + imageFiles.length > 4) { setError('Tối đa 4 ảnh'); return; }
      imageFiles.forEach(f => {
        if (f.size > 5 * 1024 * 1024) { setError('Ảnh không được vượt quá 5MB'); return; }
        setImages(prev => [...prev, f]);
        setImagePreviews(prev => [...prev, URL.createObjectURL(f)]);
      });
      // Chọn ảnh → xoá GIF
      setGifUrl(null);
      setGifPreview(null);
    }
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(imagePreviews[i]);
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
  };

  // ── Emoji ───────────────────────────────────────────────────
  const handleEmojiClick = useCallback((emoji) => {
    setContent(prev => prev + emoji.emoji);
    setShowEmoji(false);
  }, []);

  // ── GIF: Load trending khi mở picker ────────────────────────
  const openGifPicker = async () => {
    const opening = !showGif;
    setShowGif(opening);
    if (opening) {
      setGifSearch('');
      setGifError('');
      setGifLoading(true);
      try {
        const res = await getTrending({ limit: 15 });
        setGifResults(res.gifs);
      } catch (err) {
        setGifError(err.message);
        setGifResults([]);
      } finally { setGifLoading(false); }
    }
  };

  // ── GIF Search với debounce 350ms ───────────────────────────
  const doSearch = useCallback(async (query) => {
    if (!query.trim()) {
      // Về trending nếu xoá hết search
      setGifError('');
      setGifLoading(true);
      try {
        const res = await getTrending({ limit: 15 });
        setGifResults(res.gifs);
      } catch (err) { setGifError(err.message); }
      finally { setGifLoading(false); }
      return;
    }
    setGifLoading(true);
    setGifError('');
    try {
      const res = await searchGifs(query, { limit: 15 });
      setGifResults(res.gifs);
      if (res.gifs.length === 0) setGifError('Không tìm thấy GIF nào');
    } catch (err) {
      setGifError(err.message);
      setGifResults([]);
    } finally { setGifLoading(false); }
  }, []);

  const debouncedSearch = useRef(debounce(doSearch, 350)).current;

  // Cleanup debounce khi unmount
  useEffect(() => () => debouncedSearch.cancel?.(), [debouncedSearch]);

  const handleGifSearchChange = (val) => {
    setGifSearch(val);
    debouncedSearch(val);
  };

  // ── Select GIF ──────────────────────────────────────────────
  const selectGif = (gif) => {
    setGifUrl(gif.url);
    setGifPreview(gif.preview);
    setShowGif(false);
    setGifSearch('');
    setGifResults([]);
    // Xoá ảnh + video (ràng buộc: GIF HOẶC ảnh HOẶC video)
    imagePreviews.forEach(p => URL.revokeObjectURL(p));
    setImages([]);
    setImagePreviews([]);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
  };

  const removeGif = () => {
    setGifUrl(null);
    setGifPreview(null);
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validatePostContent(content);
    const hasMedia = images.length > 0 || !!gifUrl || !!video;
    if (validationError && !hasMedia) { setError(validationError); return; }
    if (!content.trim() && !hasMedia) { setError('Vui lòng nhập nội dung hoặc thêm ảnh/video/GIF'); return; }
    setPosting(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (isSensitive) formData.append('is_sensitive', 'true');
      if (scheduleDate) formData.append('scheduled_at', new Date(scheduleDate).toISOString());

      // Upload ảnh (nếu không có GIF/video)
      if (!gifUrl && !video) {
        images.forEach(img => formData.append('images', img));
      }

      // Video
      if (video) formData.append('video', video);

      // GIF URL
      if (gifUrl) formData.append('gif_url', gifUrl);

      const res = await postsAPI.create(formData);
      setContent('');
      setImages([]);
      imagePreviews.forEach(p => URL.revokeObjectURL(p));
      setImagePreviews([]);
      setGifUrl(null);
      setGifPreview(null);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideo(null);
      setVideoPreview(null);
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

            {/* Video preview */}
            {videoPreview && (
              <div className="relative mt-2 max-w-sm">
                <video src={videoPreview} controls muted autoPlay loop playsInline
                  className="rounded-xl max-h-64 w-full object-contain bg-black" />
                <span className="absolute bottom-2 left-2 bg-neutral-900/75 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-sm tracking-wider select-none">
                  VIDEO
                </span>
                <button type="button" onClick={removeVideo}
                  className="absolute top-1.5 right-1.5 bg-neutral-900/70 text-white rounded-full p-1 hover:bg-neutral-900">
                  <HiX className="w-4 h-4" />
                </button>
              </div>
            )}

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

            {/* GIF preview */}
            {gifPreview && (
              <div className="relative inline-block mt-2">
                <img src={gifPreview} alt="GIF preview" className="rounded-xl max-h-48 w-full object-cover" />
                <span className="absolute bottom-2 left-2 bg-neutral-900/75 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-sm tracking-wider select-none">
                  GIF
                </span>
                <button type="button" onClick={removeGif}
                  className="absolute top-1.5 right-1.5 bg-neutral-900/70 text-white rounded-full p-1 hover:bg-neutral-900">
                  <HiX className="w-4 h-4" />
                </button>
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
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleMediaSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={!!gifUrl || !!video}
                  className={`p-2 rounded-full transition-all ${(gifUrl || video) ? 'text-neutral-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}`} title="Thêm ảnh/video">
                  <HiPhotograph className="w-5 h-5" />
                </button>

                {/* GIF button — styled like X with "GIF" text */}
                <button type="button" onClick={openGifPicker}
                  disabled={images.length > 0 || !!video}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide transition-all ${
                    (images.length > 0 || video)
                      ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                      : gifUrl
                        ? 'text-indigo-700 bg-indigo-100'
                        : 'text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50'
                  }`} title="GIF">
                  GIF
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
                <button type="submit" disabled={posting || (!content.trim() && images.length === 0 && !gifUrl && !video) || charsLeft < 0}
                  className="btn-primary !py-2 !px-5 !text-sm">
                  {posting ? 'Đang đăng...' : scheduleDate ? 'Lên lịch' : 'Đăng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* GIF Popover */}
      {showGif && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          {/* Search bar */}
          <div className="relative mb-3">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={gifSearch}
              onChange={e => handleGifSearchChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              placeholder="Tìm GIF..."
              className="input-field !py-2 !pl-9 !pr-3 !text-sm"
              autoFocus
            />
          </div>

          {/* Label */}
          <p className="text-xs text-neutral-500 mb-2 font-medium">
            {gifSearch.trim() ? `Kết quả: "${gifSearch}"` : '🔥 Xu hướng'}
          </p>

          {/* Loading */}
          {gifLoading && (
            <div className="flex justify-center py-8"><Spinner /></div>
          )}

          {/* Error */}
          {!gifLoading && gifError && (
            <p className="text-xs text-rose-500 py-4 text-center">{gifError}</p>
          )}

          {/* Grid */}
          {!gifLoading && gifResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {gifResults.map(gif => (
                <img key={gif.id} src={gif.preview} alt={gif.title}
                  onClick={() => selectGif(gif)}
                  loading="lazy"
                  className="rounded-lg cursor-pointer hover:ring-2 ring-indigo-500 w-full object-cover bg-neutral-200"
                  style={{ aspectRatio: gif.width && gif.height ? `${gif.width}/${gif.height}` : 'auto' }}
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {!gifLoading && !gifError && gifResults.length === 0 && (
            <p className="text-xs text-neutral-400 py-4 text-center">
              {gifSearch.trim() ? 'Không tìm thấy GIF nào' : 'Đang tải GIF...'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
