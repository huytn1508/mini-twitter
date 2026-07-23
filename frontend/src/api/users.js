import client from './client';

export const usersAPI = {
  getProfile: (username) => client.get(`/users/${username}`),
  updateProfile: (formData) => client.put('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUserPosts: (username, page = 1) => client.get(`/users/${username}/posts?page=${page}&limit=20`),
};
