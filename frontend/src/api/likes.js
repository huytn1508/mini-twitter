import client from './client';

export const likesAPI = {
  toggle: (postId) => client.post(`/posts/${postId}/like`),
};
