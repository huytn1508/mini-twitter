import client from './client';

export const commentsAPI = {
  getByPost: (postId) => client.get(`/posts/${postId}/comments`),
  create: (postId, content) => client.post(`/posts/${postId}/comments`, { content }),
  delete: (postId, commentId) => client.delete(`/posts/${postId}/comments/${commentId}`),
};
