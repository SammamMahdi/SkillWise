import axios from 'axios';
import API_CONFIG from '../config/api.js';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
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

const parentService = {
  // Request parent role with childlock and phone number
  async requestParentRole(childLockPassword, phoneNumber) {
    try {
      console.log('🟢 Requesting parent role...', { phoneNumber });
      
      const response = await api.post('/parent/request-role', {
        childLockPassword,
        phoneNumber
      });
      
      console.log('✅ Parent role request response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Parent role request error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to request parent role');
    }
  },

  // Get children for parent
  async getChildren() {
    try {
      const response = await api.get('/parent/children');
      return response.data;
    } catch (error) {
      console.error('Error fetching children:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch children');
    }
  },

  // Request child connection
  async requestChildConnection(childEmail) {
    try {
      const response = await api.post('/parent/request-child', {
        childEmail
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting child connection:', error);
      throw new Error(error.response?.data?.message || 'Failed to request child connection');
    }
  },

  // Accept child request
  async acceptChildRequest(childId) {
    try {
      const response = await api.post('/parent/accept-child-request', {
        childId
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting child request:', error);
      throw new Error(error.response?.data?.message || 'Failed to accept child request');
    }
  },

  // Reject child request
  async rejectChildRequest(childId) {
    try {
      const response = await api.post('/parent/reject-child-request', {
        childId
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting child request:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject child request');
    }
  },

  // Get child progress
  async getChildProgress(childId) {
    try {
      const response = await api.get(`/parent/children/${childId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Error fetching child progress:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch child progress');
    }
  },

  // Remove child connection
  async removeChildConnection(childId) {
    try {
      const response = await api.delete(`/parent/children/${childId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing child connection:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove child connection');
    }
  },

  // Get pending parent requests
  async getPendingParentRequests() {
    try {
      const response = await api.get('/parent/pending-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending parent requests:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending parent requests');
    }
  },

  // Get all pending requests for parent
  async getAllPendingRequests() {
    try {
      const response = await api.get('/parent/all-pending-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching all pending requests:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch all pending requests');
    }
  }
};

export default parentService;
