const mongoose = require('mongoose');

const superUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  addedBy: {
    type: String,
    default: 'Database Owner'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccess: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

// Index for faster lookups
superUserSchema.index({ email: 1 });

module.exports = mongoose.model('SuperUser', superUserSchema);
