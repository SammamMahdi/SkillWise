const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
};

// @desc    Get notification count
// @route   GET /api/notifications/count
// @access  Private
const getNotificationCount = async (req, res) => {
  try {
    const userId = req.userId;
    const { unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification count'
    });
  }
};

// @desc    Get notifications by type
// @route   GET /api/notifications/type/:type
// @access  Private
const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({
      recipient: userId,
      type: type
    })
    .populate('sender', 'name email profilePhoto')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Notification.countDocuments({
      recipient: userId,
      type: type
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications by type'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount,
  getNotificationsByType
}; 