import client from './client';

export const commentsAPI = {
  getByPost: (postId) => client.get(`/posts/${postId}/comments`),
  create: (postId, content, parentCommentId) => client.post(`/posts/${postId}/comments`, { content, parent_comment_id: parentCommentId || null }),
  delete: (postId, commentId) => client.delete(`/posts/${postId}/comments/${commentId}`),
};
