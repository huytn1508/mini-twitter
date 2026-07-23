import { useState, useRef } from 'react';
import { HiPhotograph, HiX } from 'react-icons/hi';
import { postsAPI } from '../../api/posts';
import { useAuth } from '../../context/AuthContext';
import { validatePostContent } from '../../utils/validators';
import Avatar from '../ui/Avatar';

const MAX_CHARS = 280;

export default function PostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5MB');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validatePostContent(content);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (image) formData.append('image', image);

      const res = await postsAPI.create(formData);
      setContent('');
      handleRemoveImage();
      onPostCreated?.(res.data.post);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng bài thất bại. Thử lại!');
    } finally {
      setPosting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="card mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar src={user.avatar_url} alt={user.display_name} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              rows={3}
              className="w-full resize-none border-0 focus:ring-0 text-gray-800 placeholder-gray-400
                         text-lg bg-transparent outline-none"
              maxLength={MAX_CHARS + 50} // Cho phép gõ quá để hiển thị cảnh báo
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative inline-block mt-2">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1
                             hover:bg-black/80 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error */}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                  title="Thêm ảnh"
                >
                  <HiPhotograph className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Character counter */}
                <span className={`text-sm ${isOverLimit ? 'text-red-500 font-bold' : charsLeft < 20 ? 'text-yellow-500' : 'text-gray-400'}`}>
                  {charsLeft}
                </span>

                <button
                  type="submit"
                  disabled={posting || !content.trim() || isOverLimit}
                  className="btn-primary text-sm px-6"
                >
                  {posting ? 'Đang đăng...' : 'Đăng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
