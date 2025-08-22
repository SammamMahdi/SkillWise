import React from 'react'
import { useNavigate } from 'react-router-dom'
import { backendNotificationService } from '../../services/notificationService'

const PostShareNotification = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate()

  const handleMarkAsRead = async () => {
    try {
      await backendNotificationService.markAsRead(notification._id)
      onMarkAsRead(notification._id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleViewPost = () => {
    if (notification.data?.postId) {
      navigate(`/community`)
      // You could also navigate to a specific post if you have a direct link
    }
    handleMarkAsRead()
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const notificationDate = new Date(dateString)
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      notification.isRead 
        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
    }`}>
      <div className="flex items-start gap-3">
        {/* Notification Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          notification.isRead 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
            : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
        }`}>
          <span className="text-lg">📤</span>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-medium text-sm ${
                notification.isRead 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                notification.isRead 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {notification.message}
              </p>
              
              {/* Post Details */}
              {notification.data?.postTitle && (
                <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Shared post: {notification.data.postType || 'post'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {notification.data.postTitle}
                  </p>
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formatTimeAgo(notification.createdAt)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={handleViewPost}
                className="text-xs bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                View Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostShareNotification
