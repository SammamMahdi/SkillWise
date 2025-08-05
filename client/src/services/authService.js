import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
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
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
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

export const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const { data } = response.data;
    
    console.log('Login response:', response.data);
    
    // Store tokens
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return { user: data.user };
  },

  // Google OAuth login
  async googleAuth(idToken, role = null) {
    console.log('Sending Google auth request with token length:', idToken.length, 'role:', role);
    try {
      const response = await api.post('/auth/google', { idToken, role });
      console.log('Google auth response:', response.data);
      
      // Check if role selection is required
      if (response.data.requiresRoleSelection) {
        console.log('Role selection required, throwing error');
        throw new Error('ROLE_SELECTION_REQUIRED');
      }
      
      const { data } = response.data;
      
      console.log('Storing tokens:', { accessToken: data.accessToken, refreshToken: data.refreshToken });
      
      // Store tokens
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return { user: data.user };
    } catch (error) {
      console.log('Google auth API error:', error.response?.data || error.message);
      
      // If it's a role selection error, throw it as a specific error
      if (error.response?.data?.requiresRoleSelection) {
        throw new Error('ROLE_SELECTION_REQUIRED');
      }
      
      throw error;
    }
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Change password
  async changePassword(passwords) {
    const response = await api.post('/auth/change-password', passwords);
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    const { token } = response.data;
    localStorage.setItem('token', token);
    return response.data;
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Verify email
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Get current user
  async getCurrentUser() {
    console.log('Making API call to get current user...');
    const response = await api.get('/users/profile');
    console.log('API response:', response.data);
    return response.data.data.user;
  },

  // Update user profile
  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    console.log('Checking authentication, token exists:', !!token);
    return !!token;
  },

  // Get stored user data
  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Store user data
  storeUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export default authService; 