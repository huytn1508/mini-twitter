import { useState } from 'react';
import { followsAPI } from '../../api/follows';
import { useAuth } from '../../context/AuthContext';
import { formatFullDate } from '../../utils/formatDate';
import Avatar from '../ui/Avatar';

export default function ProfileHeader({ profile, onFollowToggle }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profile.is_following);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await followsAPI.toggle(profile.id);
      setIsFollowing(res.data.following);
      onFollowToggle?.(res.data.following);
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const showFollowButton = user && !profile.is_own_profile;

  return (
    <div className="card mb-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <Avatar src={profile.avatar_url} size="xl" />

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-gray-900">{profile.display_name}</h1>
          <p className="text-gray-500">@{profile.username}</p>

          {profile.bio && (
            <p className="text-gray-700 mt-2">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start text-sm">
            <span><strong className="text-gray-900">{profile.posts_count}</strong> <span className="text-gray-500">bài viết</span></span>
            <span><strong className="text-gray-900">{profile.followers_count}</strong> <span className="text-gray-500">followers</span></span>
            <span><strong className="text-gray-900">{profile.following_count}</strong> <span className="text-gray-500">đang follow</span></span>
          </div>

          <p className="text-xs text-gray-400 mt-2">Tham gia {formatFullDate(profile.created_at)}</p>
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
              isFollowing
                ? 'bg-white border-2 border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500'
                : 'bg-black text-white hover:bg-gray-800'
            } disabled:opacity-50`}
          >
            {followLoading ? '...' : isFollowing ? 'Đang follow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}
