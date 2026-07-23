import client from './client';

export const postsAPI = {
  getAll: (page = 1) => client.get(`/posts?page=${page}&limit=20`),
  getFollowing: (page = 1) => client.get(`/posts/following?page=${page}&limit=20`),
  getById: (id) => client.get(`/posts/${id}`),
  create: (formData) => client.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => client.put(`/posts/${id}`, data),
  delete: (id) => client.delete(`/posts/${id}`),
  retweet: (id) => client.post(`/posts/${id}/retweet`),
  quote: (id, content) => client.post(`/posts/${id}/quote`, { content }),
};
