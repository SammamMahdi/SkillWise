import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Eye,
  Trash2,
  X,
  Settings
} from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchNotifications();
    fetchNotificationCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications/count?unreadOnly=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications();
        fetchNotificationCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications();
        fetchNotificationCount();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchNotifications();
        fetchNotificationCount();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'parent_request':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'child_request':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case 'parent_approval':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'child_approval':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'account_blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'account_unblocked':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'friend_accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'friend_rejected':
        return <X className="w-5 h-5 text-red-600" />;
      case 'exam_review_request':
        return <Eye className="w-5 h-5 text-orange-600" />;
      case 'exam_approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'exam_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'exam_published':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'exam_graded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-foreground/60" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'parent_request':
      case 'child_request':
        return 'border-l-blue-500';
      case 'parent_approval':
      case 'child_approval':
      case 'account_unblocked':
      case 'friend_accepted':
        return 'border-l-green-500';
      case 'account_blocked':
      case 'friend_rejected':
      case 'exam_rejected':
        return 'border-l-red-500';
      case 'friend_request':
        return 'border-l-purple-500';
      case 'exam_review_request':
        return 'border-l-orange-500';
      case 'exam_approved':
      case 'exam_graded':
        return 'border-l-green-500';
      case 'exam_published':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  const filteredNotifications = selectedType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === selectedType);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-foreground hover:text-primary transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                >
                  <option value="all">All</option>
                  <option value="parent_request">Parent Requests</option>
                  <option value="child_request">Child Requests</option>
                  <option value="parent_approval">Parent Approvals</option>
                  <option value="child_approval">Child Approvals</option>
                  <option value="account_blocked">Account Blocked</option>
                  <option value="account_unblocked">Account Unblocked</option>
                </select>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                <p className="text-foreground/60">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-background/50 transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.isRead ? 'bg-blue-50/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-sm text-foreground/80 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-foreground/60 mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {notification.isActionRequired && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Action Required
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-border bg-background/50">
              <div className="flex items-center justify-between text-sm text-foreground/60">
                <span>{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-primary hover:text-primary/80"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter; 