import { useState, useRef } from 'react';
import { HiCamera } from 'react-icons/hi';
import { usersAPI } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { validateDisplayName, validateUsername } from '../../utils/validators';
import Avatar from '../ui/Avatar';

export default function EditProfileForm({ onClose }) {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setErrors({ avatar: 'Ảnh không được vượt quá 5MB' }); return; }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    const nameErr = validateDisplayName(displayName);
    if (nameErr) errs.display_name = nameErr;
    const userErr = validateUsername(username);
    if (userErr) errs.username = userErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('display_name', displayName.trim());
      formData.append('username', username.trim());
      formData.append('bio', bio.trim());
      if (avatar) formData.append('avatar', avatar);
      const res = await usersAPI.updateProfile(formData);
      updateUser({ ...user, ...res.data.profile });
      onClose?.();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ username: 'Username đã tồn tại' });
      } else {
        setErrors({ general: err.response?.data?.error || 'Cập nhật thất bại' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-bold text-neutral-900 mb-5">Chỉnh sửa profile</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Avatar src={avatarPreview || user?.avatar_url} size="xl" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1.5
                         hover:bg-indigo-700 transition-all shadow-lg"
            >
              <HiCamera className="w-4 h-4" />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
          {errors.avatar && <p className="text-rose-500 text-xs">{errors.avatar}</p>}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tên hiển thị</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field" maxLength={50} />
          {errors.display_name && <p className="text-rose-500 text-xs mt-1">{errors.display_name}</p>}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" maxLength={30} />
          {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-field resize-none"
            rows={3}
            maxLength={160}
            placeholder="Viết gì đó về bạn..."
          />
          <p className="text-xs text-neutral-400 mt-1">{bio.length}/160</p>
        </div>

        {/* General error */}
        {errors.general && <p className="text-rose-500 text-sm text-center">{errors.general}</p>}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-outline text-sm">Hủy</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
