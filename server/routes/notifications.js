const express = require('express');
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Get notification count
router.get('/count', notificationController.getNotificationCount);

// Get notifications by type
router.get('/type/:type', notificationController.getNotificationsByType);

module.exports = router; 