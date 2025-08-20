const express = require('express');
const { body } = require('express-validator');
const friendController = require('../controllers/friendController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { checkChildRestrictions } = require('../middleware/childRestrictions');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Send friend request (requires child lock for child accounts)
router.post('/request', [
  body('targetHandle')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Target handle is required and must be between 1 and 50 characters')
], checkChildRestrictions('friend_requests'), friendController.sendFriendRequest);

// Accept friend request (requires child lock for child accounts)
router.put('/accept/:requesterId', checkChildRestrictions('friend_requests'), friendController.acceptFriendRequest);

// Reject friend request (requires child lock for child accounts)
router.put('/reject/:requesterId', checkChildRestrictions('friend_requests'), friendController.rejectFriendRequest);

// Get friends list (no childlock required for viewing)
router.get('/', friendController.getFriends);

// Get pending friend requests (no childlock required for viewing)
router.get('/requests', friendController.getPendingRequests);

// Remove friend
router.delete('/:friendId', friendController.removeFriend);

module.exports = router;
