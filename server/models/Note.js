// models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // links to User model
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String, // markdown content
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  keywords: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'General'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isPublic: {
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

// Update the updatedAt field before saving
noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better search performance
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ userId: 1, keywords: 1 });
noteSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Note', noteSchema);
