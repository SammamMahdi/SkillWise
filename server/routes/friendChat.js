const express = require('express');
const router = express.Router();
const { 
  sendTextMessage, 
  sendFileMessage, 
  getMessages, 
  getConversations, 
  downloadFile, 
  viewFile,
  deleteMessage,
  upload 
} = require('../controllers/friendChatController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Get all friend conversations
router.get('/conversations', getConversations);

// Get messages with a specific friend
router.get('/messages/:friendId', getMessages);

// Send text message
router.post('/send-text', sendTextMessage);

// Send file/image message
router.post('/send-file', upload, sendFileMessage);

// Download file
router.get('/download/:messageId', downloadFile);

// View file for display (images)
router.get('/view/:messageId', viewFile);

// Delete message
router.delete('/message/:messageId', deleteMessage);

module.exports = router;
