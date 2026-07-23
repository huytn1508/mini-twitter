import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import EditProfileForm from '../components/profile/EditProfileForm';
import PostList from '../components/posts/PostList';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [postsError, setPostsError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const isOwnProfile = user?.username === username;

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersAPI.getProfile(username);
      setProfile(res.data.profile);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const res = await usersAPI.getUserPosts(username);
      setPosts(res.data.posts);
    } catch (err) {
      setPostsError(err.response?.data?.error || 'Không thể tải bài viết');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [username]);

  if (loading) return <Spinner size="lg" className="py-24" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProfile} />;
  if (!profile) return <ErrorMessage message="Không tìm thấy người dùng" />;

  return (
    <div>
      {/* Edit Profile Form */}
      {isOwnProfile && showEditForm && (
        <EditProfileForm onClose={() => { setShowEditForm(false); fetchProfile(); }} />
      )}

      {/* Profile Header */}
      <ProfileHeader profile={profile} onFollowToggle={fetchProfile} />

      {/* Edit Profile Button (owner only) */}
      {isOwnProfile && !showEditForm && (
        <div className="mb-4">
          <button onClick={() => setShowEditForm(true)} className="btn-outline text-sm">
            Chỉnh sửa profile
          </button>
        </div>
      )}

      {/* Posts */}
      <h2 className="font-bold text-lg text-gray-900 mb-4">Bài viết</h2>
      <PostList
        posts={posts}
        loading={postsLoading}
        error={postsError}
        onRetry={fetchPosts}
        onPostDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
        emptyMessage={`@${username} chưa đăng bài viết nào`}
      />
    </div>
  );
}
