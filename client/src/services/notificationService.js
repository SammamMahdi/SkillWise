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

// Backend notification methods
export const backendNotificationService = {
  // Get user notifications
  async getNotifications({ page = 1, limit = 20, unreadOnly = false } = {}) {
    const res = await api.get(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
    return res.data;
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const res = await api.put(`/notifications/${notificationId}/read`);
    return res.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  // Get notifications by type
  async getNotificationsByType(type, { page = 1, limit = 20 } = {}) {
    const res = await api.get(`/notifications/type/${type}?page=${page}&limit=${limit}`);
    return res.data;
  },

  // Get unread count
  async getUnreadCount() {
    const res = await api.get('/notifications?unreadOnly=true&limit=1');
    return res.data;
  }
};

// Simple notification service for UI feedback
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  // Add a notification
  show(message, type = 'success', duration = 3000) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration,
      timestamp: new Date()
    };

    this.notifications.push(notification);
    this.notifyListeners();

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, duration);
    }

    return notification.id;
  }

  // Remove a notification
  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Subscribe to notification changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
