import axios from 'axios';
import API_CONFIG from '../config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const superUserService = {
  // Check if current user is superuser
  async checkSuperUser() {
    const response = await api.get('/superuser/check');
    return response.data;
  },

  // Get all users for role management
  async getAllUsers(page = 1, limit = 50, search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    
    const response = await api.get(`/superuser/users?${params}`);
    return response.data;
  },

  // Update user role
  async updateUserRole(userId, role) {
    const response = await api.put(`/superuser/users/${userId}/role`, { role });
    return response.data;
  }
};

export default superUserService;
