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
