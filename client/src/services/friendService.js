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

class FriendService {
  // Send friend request
  async sendFriendRequest(targetHandle) {
    try {
      const response = await api.post('/friends/request', { targetHandle });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send friend request' };
    }
  }

  // Accept friend request
  async acceptFriendRequest(requesterId) {
    try {
      const response = await api.put(`/friends/accept/${requesterId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to accept friend request' };
    }
  }

  // Reject friend request
  async rejectFriendRequest(requesterId) {
    try {
      const response = await api.put(`/friends/reject/${requesterId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject friend request' };
    }
  }

  // Get friends list
  async getFriends() {
    try {
      const response = await api.get('/friends');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch friends' };
    }
  }

  // Get pending friend requests
  async getPendingRequests() {
    try {
      const response = await api.get('/friends/requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending requests' };
    }
  }

  // Remove friend
  async removeFriend(friendId) {
    try {
      const response = await api.delete(`/friends/${friendId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove friend' };
    }
  }

  // Search users
  async searchUsers(query, limit = 10) {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search users' };
    }
  }

  // Get public profile
  async getPublicProfile(handle) {
    try {
      const response = await api.get(`/users/public/${handle}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch public profile' };
    }
  }
}

export default new FriendService();
