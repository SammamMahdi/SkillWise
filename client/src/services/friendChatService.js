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

const API_BASE_URL = '/friend-chat';

export const friendChatService = {
  // Get all friend conversations
  async getConversations() {
    try {
      const response = await api.get(`${API_BASE_URL}/conversations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching friend conversations:', error);
      throw error;
    }
  },

  // Get messages with a specific friend
  async getMessages(friendId, page = 1, limit = 50) {
    try {
      const response = await api.get(`${API_BASE_URL}/messages/${friendId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching friend messages:', error);
      throw error;
    }
  },

  // Send text message
  async sendTextMessage(friendId, content) {
    try {
      const response = await api.post(`${API_BASE_URL}/send-text`, {
        friendId,
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  },

  // Send file/image message
  async sendFileMessage(friendId, file) {
    try {
      const formData = new FormData();
      formData.append('friendId', friendId);
      formData.append('file', file);

      const response = await api.post(`${API_BASE_URL}/send-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending file message:', error);
      throw error;
    }
  },

  // Download file
  async downloadFile(messageId, filename) {
    try {
      const response = await api.get(`${API_BASE_URL}/download/${messageId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Delete message
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`${API_BASE_URL}/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Get file URL for display (for images)
  getFileUrl(messageId) {
    return `${import.meta.env.VITE_API_URL}${API_BASE_URL}/view/${messageId}`;
  },

  // Get file download URL
  getDownloadUrl(messageId) {
    return `${import.meta.env.VITE_API_URL}${API_BASE_URL}/download/${messageId}`;
  },

  // Get image blob for display
  async getImageBlob(messageId) {
    try {
      const response = await api.get(`${API_BASE_URL}/view/${messageId}`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error fetching image blob:', error);
      throw error;
    }
  }
};
