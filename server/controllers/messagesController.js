const Message = require('../models/Message');
const User = require('../models/User');
const SkillPost = require('../models/SkillPost');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipientId, skillPostId, content } = req.body;
    const senderId = req.user.id || req.user._id;

    // Validate that sender and recipient are different
    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself'
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Verify skill post exists
    const skillPost = await SkillPost.findById(skillPostId);
    if (!skillPost) {
      return res.status(404).json({
        success: false,
        message: 'Skill post not found'
      });
    }

    // Create the message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      skillPost: skillPostId,
      content: content.trim()
    });

    await message.save();
    await message.populate([
      { path: 'sender', select: 'name avatarUrl' },
      { path: 'recipient', select: 'name avatarUrl' },
      { path: 'skillPost', select: 'title type' }
    ]);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Get conversations for a user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 20 } = req.query;

    console.log('Getting conversations for user:', userId);

    // Get all messages for the user
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    })
    .populate('sender', 'name avatarUrl')
    .populate('recipient', 'name avatarUrl')
    .populate('skillPost', 'title type')
    .sort({ createdAt: -1 });

    // Group conversations manually
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.sender._id.toString() === userId 
        ? message.recipient._id.toString() 
        : message.sender._id.toString();
      
      const conversationKey = `${otherUserId}-${message.skillPost._id}`;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          _id: {
            participants: [userId, otherUserId],
            skillPost: message.skillPost._id
          },
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      // Count unread messages for current user
      if (message.recipient._id.toString() === userId && !message.isRead) {
        const conversation = conversationMap.get(conversationKey);
        conversation.unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt))
      .slice((page - 1) * limit, page * limit);

    console.log(`Found ${conversations.length} conversations for user ${userId}`);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations: ' + error.message
    });
  }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const { otherUserId, skillPostId } = req.params;
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      skillPost: skillPostId,
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
    .populate('sender', 'name avatarUrl')
    .populate('recipient', 'name avatarUrl')
    .populate('skillPost', 'title type')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read if current user is the recipient
    await Message.updateMany(
      {
        skillPost: skillPostId,
        sender: otherUserId,
        recipient: userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages
};
