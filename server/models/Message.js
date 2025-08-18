const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  skillPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillPost',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isMonitored: {
    type: Boolean,
    default: true
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'flagged'],
    default: 'approved'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ skillPost: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
