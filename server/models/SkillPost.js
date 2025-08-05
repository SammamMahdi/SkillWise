const mongoose = require('mongoose');

const skillPostSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['offer', 'request'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoIntro: String,
  images: [String],
  skillTags: [{ type: String, required: true }],
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'] 
  },
  pricing: { 
    type: String, 
    enum: ['free', 'barter', 'paid'], 
    required: true 
  },
  
  // Skill exchange details
  barterRequest: String, // For barter type
  priceAmount: Number,   // For paid type
  
  // Moderation
  isApproved: { type: Boolean, default: false },
  
  // Recognition
  badgeEarned: String,
  
  // Feedback
  reviews: [{
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkillPost', skillPostSchema);