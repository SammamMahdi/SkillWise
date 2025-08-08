const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { 
    type: String, 
    required: function() {
      // Password is required only if user is not using Google OAuth
      return !this.googleId;
    }
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Student', 'Teacher', 'Parent', null], 
    default: null 
  },
  roleConfirmed: { type: Boolean, default: false }, // Track if user has explicitly chosen role
  
  // Parent-child features
  age: Number,
  dateOfBirth: Date,
  requiresParentalApproval: { type: Boolean, default: false },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentConfirmed: { type: Boolean, default: false },
  childAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingParentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingChildRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAccountBlocked: { type: Boolean, default: false },
  blockedReason: String,
  
  // Profile management
  profilePhoto: String,
  preferredLanguage: String,
  accessibility: {
    fontSize: String,
    accentColor: { type: String, default: '#7C3AED' }, // Default purple
  },
  
  // Personalization
  interests: [String],
  concentrations: [{
    key: String,
    treeProgress: [{
      node: String,
      progressPercent: { type: Number, default: 0 }
    }]
  }],
  
  // Gamification
  badges: [String],
  xp: { type: Number, default: 0 },
  credits: { type: Number, default: 0 },
  avatarsUnlocked: [String],
  skillQuests: [{
    questId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillQuest' },
    completed: Boolean,
    completionDate: Date
  }],
avatarUrl: { type: String, default: '' },
coverUrl:  { type: String, default: '' },

  // Dashboard data
  dashboardData: {
    enrolledCourses: [{
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      currentLectureIndex: { type: Number, default: 0 },
      completedLectures: [Number],
      completedQuizzes: [Number]
    }],
    skillPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SkillPost' }],
    certificates: [{
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      issueDate: Date,
      credentialId: String
    }],
    feedbackScore: Number,
  },
  
  // Recommendations
  recommendedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  
  // Email verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Google OAuth
  googleId: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

// Peer mentor virtual field
userSchema.virtual('isPeerMentor').get(function() {
  return this.badges.length >= 3 && this.xp >= 500;
});

module.exports = mongoose.model('User', userSchema);