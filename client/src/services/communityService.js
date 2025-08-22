import axios from 'axios';
import API_CONFIG from '../config/api.js';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh-token', {
            refreshToken,
          });
          
          const { data } = response.data;
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const communityService = {
  async fetchFeed({ page = 1, limit = 10 } = {}) {
    const res = await api.get(`/community/feed?page=${page}&limit=${limit}`)
    return res.data
  },

  async createPost(payload) {
    const res = await api.post('/community/posts', payload)
    return res.data
  },

  async uploadImages(files) {
    const form = new FormData()
    files.forEach(f => form.append('images', f))
    const res = await api.post('/community/uploads/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  },

  async like(postId) {
    const res = await api.post(`/community/posts/${postId}/like`)
    return res.data
  },

  async comment(postId, text) {
    const res = await api.post(`/community/posts/${postId}/comments`, { text })
    return res.data
  },

  async vote(postId, optionId) {
    const res = await api.post(`/community/posts/${postId}/poll/vote`, { optionId })
    return res.data
  },

  async pollTop(postId) {
    const res = await api.get(`/community/posts/${postId}/poll/top`)
    return res.data
  },

  async share(postId, payload = {}) {
    const res = await api.post(`/community/posts/${postId}/share`, payload)
    return res.data
  },

  async getShareableEnrollments() {
    const res = await api.get('/community/enrollments/shareable')
    return res.data
  },

  async getUserSharedContent({ page = 1, limit = 10 } = {}) {
    const res = await api.get(`/community/user/shared-content?page=${page}&limit=${limit}`)
    return res.data
  },

  async deletePost(postId) {
    const res = await api.delete(`/community/posts/${postId}`)
    return res.data
  },

  async editPost(postId, updates) {
    const res = await api.put(`/community/posts/${postId}`, updates)
    return res.data
  },

  async updatePostPrivacy(postId, privacy) {
    const res = await api.patch(`/community/posts/${postId}/privacy`, { privacy })
    return res.data
  }
}




