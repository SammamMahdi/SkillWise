const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getConversations,
  getMessages
} = require('../controllers/messagesController');

// Send a message
router.post('/',
  protect,
  [
    body('recipientId')
      .notEmpty()
      .withMessage('Recipient ID is required')
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    
    body('skillPostId')
      .notEmpty()
      .withMessage('Skill post ID is required')
      .isMongoId()
      .withMessage('Invalid skill post ID'),
    
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ min: 1, max: 500 })
      .withMessage('Message must be between 1 and 500 characters')
  ],
  sendMessage
);

// Get user's conversations
router.get('/conversations', protect, getConversations);

// Get messages in a specific conversation
router.get('/:otherUserId/:skillPostId', protect, getMessages);

module.exports = router;
