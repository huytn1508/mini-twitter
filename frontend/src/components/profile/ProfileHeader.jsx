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
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <Avatar src={profile.avatar_url} size="xl" />

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-neutral-900">{profile.display_name}</h1>
          <p className="text-neutral-500 text-sm mt-0.5">@{profile.username}</p>

          {profile.bio && (
            <p className="text-neutral-700 text-sm mt-3 leading-relaxed">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-5 mt-4 justify-center sm:justify-start">
            <span className="text-sm">
              <strong className="text-neutral-900 font-semibold">{profile.posts_count}</strong>{' '}
              <span className="text-neutral-500">bài viết</span>
            </span>
            <span className="text-sm">
              <strong className="text-neutral-900 font-semibold">{profile.followers_count}</strong>{' '}
              <span className="text-neutral-500">followers</span>
            </span>
            <span className="text-sm">
              <strong className="text-neutral-900 font-semibold">{profile.following_count}</strong>{' '}
              <span className="text-neutral-500">đang follow</span>
            </span>
          </div>

          <p className="text-xs text-neutral-400 mt-3">
            Tham gia {formatFullDate(profile.created_at)}
          </p>
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all active:scale-[0.98] ${
              isFollowing
                ? 'bg-white border-2 border-rose-300 text-rose-500 hover:bg-rose-50 hover:border-rose-400'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm'
            } disabled:opacity-50`}
          >
            {followLoading ? '...' : isFollowing ? 'Đang follow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}
