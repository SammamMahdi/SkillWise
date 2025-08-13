const express = require('express');
const { body } = require('express-validator');
const friendController = require('../controllers/friendController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Send friend request
router.post('/request', [
  body('targetHandle')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Target handle is required and must be between 1 and 50 characters')
], friendController.sendFriendRequest);

// Accept friend request
router.put('/accept/:requesterId', friendController.acceptFriendRequest);

// Reject friend request
router.put('/reject/:requesterId', friendController.rejectFriendRequest);

// Get friends list
router.get('/', friendController.getFriends);

// Get pending friend requests
router.get('/requests', friendController.getPendingRequests);

// Remove friend
router.delete('/:friendId', friendController.removeFriend);

module.exports = router;
