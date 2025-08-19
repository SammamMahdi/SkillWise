const mongoose = require('mongoose');

const friendMessageSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  // Encrypted message content
  encryptedContent: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    }
  },
  // For image/file messages
  encryptedFileData: {
    type: String, // Encrypted JSON containing original filename, mimetype, etc.
    required: function() {
      return this.messageType === 'image' || this.messageType === 'file';
    }
  },
  filePath: {
    type: String, // Path to the encrypted file on server
    required: function() {
      return this.messageType === 'image' || this.messageType === 'file';
    }
  },
  fileSize: {
    type: Number,
    required: function() {
      return this.messageType === 'image' || this.messageType === 'file';
    }
  },
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Deletion (for both users)
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  editedAt: Date,
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FriendMessage'
  }
}, {
  timestamps: true
});

// Index for efficient querying
friendMessageSchema.index({ participants: 1, createdAt: -1 });
friendMessageSchema.index({ sender: 1, createdAt: -1 });

// Method to get conversation ID (sorted participant IDs)
friendMessageSchema.statics.getConversationId = function(userId1, userId2) {
  return [userId1, userId2].sort().join(':');
};

// Method to check if user is participant
friendMessageSchema.methods.isParticipant = function(userId) {
  return this.participants.includes(userId);
};

// Method to mark as read
friendMessageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
  if (!alreadyRead && this.sender.toString() !== userId.toString()) {
    this.readBy.push({ user: userId });
    this.status = 'read';
  }
  return this.save();
};

// Method to delete for user
friendMessageSchema.methods.deleteForUser = function(userId) {
  if (!this.deletedFor.includes(userId)) {
    this.deletedFor.push(userId);
  }
  return this.save();
};

// Virtual to check if message is deleted for all users
friendMessageSchema.virtual('isDeletedForAll').get(function() {
  return this.deletedFor.length >= this.participants.length;
});

// Pre-save middleware to sort participants
friendMessageSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    this.participants.sort();
  }
  next();
});

module.exports = mongoose.model('FriendMessage', friendMessageSchema);
