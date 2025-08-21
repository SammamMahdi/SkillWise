const FriendMessage = require('../models/FriendMessages');
const User = require('../models/User');
const MessageEncryption = require('../utils/messageEncryption');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for friend chat file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/friend-chats');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const secureFilename = MessageEncryption.generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

class FriendChatController {
  // Send a text message
  static async sendTextMessage(req, res) {
    try {
      const { friendId, content } = req.body;
      const senderId = req.userId;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      // Verify friendship
      const sender = await User.findById(senderId);
      if (!sender.friends.includes(friendId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only send messages to friends'
        });
      }

      // Generate encryption key for this conversation
      const encryptionKey = MessageEncryption.generateConversationKey(senderId, friendId);
      
      // Encrypt the message
      const encryptedContent = MessageEncryption.encryptToString(content.trim(), encryptionKey);

      // Create message
      const message = new FriendMessage({
        participants: [senderId, friendId].sort(),
        sender: senderId,
        messageType: 'text',
        encryptedContent
      });

      await message.save();
      await message.populate([
        { path: 'sender', select: 'name avatar' },
        { path: 'participants', select: 'name avatar' }
      ]);

      // Decrypt for response
      const decryptedMessage = {
        ...message.toObject(),
        content: MessageEncryption.decryptFromString(message.encryptedContent, encryptionKey),
        encryptedContent: undefined // Don't send encrypted content to client
      };

      res.json({
        success: true,
        data: decryptedMessage
      });
    } catch (error) {
      console.error('Error sending friend message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  }

  // Send image/file message
  static async sendFileMessage(req, res) {
    try {
      const { friendId } = req.body;
      const senderId = req.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'File is required'
        });
      }

      // Verify friendship
      const sender = await User.findById(senderId);
      if (!sender.friends.includes(friendId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only send files to friends'
        });
      }

      // Generate encryption key for this conversation
      const encryptionKey = MessageEncryption.deriveChatKey(senderId, friendId);

      // Prepare file metadata
      const fileData = {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      };

      // Encrypt file metadata
      const encryptedFileData = MessageEncryption.encryptFileData(fileData, encryptionKey);

      // Determine message type
      const messageType = file.mimetype.startsWith('image/') ? 'image' : 'file';

      // Create message
      const message = new FriendMessage({
        participants: [senderId, friendId].sort(),
        sender: senderId,
        messageType,
        encryptedFileData,
        filePath: file.path,
        fileSize: file.size
      });

      await message.save();
      await message.populate([
        { path: 'sender', select: 'name avatar' },
        { path: 'participants', select: 'name avatar' }
      ]);

      // Decrypt file data for response
      const decryptedMessage = {
        ...message.toObject(),
        fileData: MessageEncryption.decryptFileData(message.encryptedFileData, encryptionKey),
        encryptedFileData: undefined // Don't send encrypted data to client
      };

      res.json({
        success: true,
        data: decryptedMessage
      });
    } catch (error) {
      console.error('Error sending file message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send file'
      });
    }
  }

  // Get conversation messages
  static async getMessages(req, res) {
    try {
      const { friendId } = req.params;
      const userId = req.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      // Verify friendship
      const user = await User.findById(userId);
      if (!user.friends.includes(friendId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only view messages with friends'
        });
      }

      // Get messages
      const messages = await FriendMessage.find({
        participants: { $all: [userId, friendId] },
        deletedFor: { $ne: userId }
      })
      .populate([
        { path: 'sender', select: 'name avatar' },
        { path: 'replyTo', select: 'messageType encryptedContent' }
      ])
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

      // Generate encryption key
      const encryptionKey = MessageEncryption.deriveChatKey(userId, friendId);

      // Decrypt messages
      const decryptedMessages = messages.map(message => {
        const messageObj = message.toObject();
        
        if (message.messageType === 'text') {
          messageObj.content = MessageEncryption.decryptFromString(message.encryptedContent, encryptionKey);
          delete messageObj.encryptedContent;
        } else {
          messageObj.fileData = MessageEncryption.decryptFileData(message.encryptedFileData, encryptionKey);
          delete messageObj.encryptedFileData;
        }

        // Decrypt reply-to message if exists
        if (message.replyTo && message.replyTo.encryptedContent) {
          messageObj.replyTo.content = MessageEncryption.decryptFromString(message.replyTo.encryptedContent, encryptionKey);
          delete messageObj.replyTo.encryptedContent;
        }

        return messageObj;
      });

      // Mark messages as read
      await FriendMessage.updateMany(
        {
          participants: { $all: [userId, friendId] },
          sender: friendId,
          'readBy.user': { $ne: userId }
        },
        {
          $push: { readBy: { user: userId } },
          $set: { status: 'read' }
        }
      );

      res.json({
        success: true,
        data: decryptedMessages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit
        }
      });
    } catch (error) {
      console.error('Error fetching friend messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  }

  // Get all friend conversations
  static async getConversations(req, res) {
    try {
      const userId = req.userId;

      // Get user's friends
      const user = await User.findById(userId).populate('friends', 'name avatar lastSeen');
      
      // Get latest message with each friend
      const conversations = await Promise.all(
        user.friends.map(async (friend) => {
          const latestMessage = await FriendMessage.findOne({
            participants: { $all: [userId, friend._id] },
            deletedFor: { $ne: userId }
          })
          .populate('sender', 'name')
          .sort({ createdAt: -1 });

          // Count unread messages
          const unreadCount = await FriendMessage.countDocuments({
            participants: { $all: [userId, friend._id] },
            sender: friend._id,
            'readBy.user': { $ne: userId },
            deletedFor: { $ne: userId }
          });

          let decryptedMessage = null;
          if (latestMessage) {
            const encryptionKey = MessageEncryption.deriveChatKey(userId, friend._id);
            
            if (latestMessage.messageType === 'text') {
              const content = MessageEncryption.decryptFromString(latestMessage.encryptedContent, encryptionKey);
              decryptedMessage = {
                ...latestMessage.toObject(),
                content,
                encryptedContent: undefined
              };
            } else {
              const fileData = MessageEncryption.decryptFileData(latestMessage.encryptedFileData, encryptionKey);
              decryptedMessage = {
                ...latestMessage.toObject(),
                fileData,
                encryptedFileData: undefined
              };
            }
          }

          return {
            friend,
            latestMessage: decryptedMessage,
            unreadCount
          };
        })
      );

      // Sort by latest message time
      conversations.sort((a, b) => {
        const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt) : new Date(0);
        const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt) : new Date(0);
        return bTime - aTime;
      });

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error fetching friend conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations'
      });
    }
  }

  // Download file
  static async downloadFile(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.userId;

      const message = await FriendMessage.findById(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      if (!message.isParticipant(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (message.messageType === 'text') {
        return res.status(400).json({
          success: false,
          message: 'Not a file message'
        });
      }

      // Decrypt file metadata
      const otherParticipant = message.participants.find(p => p.toString() !== userId);
      const encryptionKey = MessageEncryption.deriveChatKey(userId, otherParticipant);
      const fileData = MessageEncryption.decryptFileData(message.encryptedFileData, encryptionKey);

      // Send file
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
      res.setHeader('Content-Type', fileData.mimeType);
      res.sendFile(path.resolve(message.filePath));
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file'
      });
    }
  }

  // View file for display (images)
  static async viewFile(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.userId;

      const message = await FriendMessage.findById(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      if (!message.isParticipant(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (message.messageType === 'text') {
        return res.status(400).json({
          success: false,
          message: 'Not a file message'
        });
      }

      // Decrypt file metadata
      const otherParticipant = message.participants.find(p => p.toString() !== userId);
      const encryptionKey = MessageEncryption.deriveChatKey(userId, otherParticipant);
      const fileData = MessageEncryption.decryptFileData(message.encryptedFileData, encryptionKey);

      // Set headers for inline display (not download)
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Cache-Control', 'private, max-age=86400'); // Cache for 24 hours
      res.sendFile(path.resolve(message.filePath));
    } catch (error) {
      console.error('Error viewing file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to view file'
      });
    }
  }

  // Delete message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.userId;

      const message = await FriendMessage.findById(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      if (!message.isParticipant(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await message.deleteForUser(userId);

      res.json({
        success: true,
        message: 'Message deleted'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message'
      });
    }
  }
}

// Export controller methods and upload middleware
module.exports = {
  sendTextMessage: FriendChatController.sendTextMessage,
  sendFileMessage: FriendChatController.sendFileMessage,
  getMessages: FriendChatController.getMessages,
  getConversations: FriendChatController.getConversations,
  downloadFile: FriendChatController.downloadFile,
  viewFile: FriendChatController.viewFile,
  deleteMessage: FriendChatController.deleteMessage,
  upload: upload.single('file')
};
