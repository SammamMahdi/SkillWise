const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['email', 'push', 'in-app'], 
    required: true 
  },
  relatedEntity: {
    type: { type: String, enum: ['course', 'skill', 'event'] },
    id: mongoose.Schema.Types.ObjectId
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);