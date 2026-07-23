import client from './client';

export const followsAPI = {
  toggle: (userId) => client.post(`/users/${userId}/follow`),
  getFollowers: (username) => client.get(`/users/${username}/followers`),
  getFollowing: (username) => client.get(`/users/${username}/following`),
};
