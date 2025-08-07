const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['parent_request', 'child_request', 'parent_approval', 'child_approval', 'account_blocked', 'account_unblocked'],
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  data: {
    // Additional data specific to notification type
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestId: String,
    reason: String
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  isActionRequired: { 
    type: Boolean, 
    default: false 
  },
  actionUrl: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: Date
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);