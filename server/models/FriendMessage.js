const mongoose = require('mongoose');

const friendMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Encrypted message content
  encryptedContent: {
    iv: {
      type: String,
      required: true
    },
    tag: {
      type: String,
      required: true
    },
    encrypted: {
      type: String,
      required: true
    }
  },
  // Message hash for integrity verification
  messageHash: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // Conversation ID (derived from both user IDs)
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  // Message type
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  // Optional: File attachment for encrypted file sharing
  attachment: {
    filename: String,
    encryptedData: String,
    mimeType: String,
    size: Number
  },
  // Delivery status
  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  // Message reactions (encrypted)
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Message replied to (for threading)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FriendMessage'
  },
  // Editing history
  editHistory: [{
    previousHash: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
friendMessageSchema.index({ sender: 1, recipient: 1 });
friendMessageSchema.index({ conversationId: 1, createdAt: -1 });
friendMessageSchema.index({ createdAt: -1 });
friendMessageSchema.index({ isRead: 1 });

// Static method to generate conversation ID
friendMessageSchema.statics.generateConversationId = function(userId1, userId2) {
  // Sort user IDs to ensure consistent conversation ID
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `conv_${sortedIds[0]}_${sortedIds[1]}`;
};

// Instance method to mark as read
friendMessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.deliveryStatus = 'read';
  this.updatedAt = new Date();
  return this.save();
};

// Pre-save hook to update timestamps
friendMessageSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('FriendMessage', friendMessageSchema);
