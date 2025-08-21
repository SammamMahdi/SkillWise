const mongoose = require('mongoose');

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

function makeHandleFromObjectId(idStr) {
  // short, unique, deterministic: last 8 of ObjectId in base36
  // (ObjectId is hex; we can just take the last 8 chars for uniqueness)
  return `u_${idStr.slice(-8)}`; // e.g., u_3fae9c1b
}

const userSchema = new mongoose.Schema({
  // NEW: immutable, auto-generated handle (always unique & present)
  handle: {
    type: String,
    unique: true,
    required: true,
    immutable: true,     // cannot be changed after creation
    trim: true,
    lowercase: true
  },

  // Pretty username: optional at first (Google flow), unique when set
  username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,        // allow many docs with no username yet
    match: [USERNAME_REGEX, 'Invalid username (3–20, a-z, 0-9, ., _)']
  },

  // --- your existing fields (unchanged) ---
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { 
    type: String, 
    required: function() { return !this.googleId; }
  },
  phoneNumber: { type: String, sparse: true }, // Phone number for child role requests
  role: { type: String, enum: ['Admin','Student','Teacher','Child'], default: 'Student' },
  roleConfirmed: { type: Boolean, default: true },
  isFirstTimeUser: { type: Boolean, default: false }, // Flag for first-time setup
  isSuperUser: { type: Boolean, default: false }, // Flag for superuser access
  age: Number,
  dateOfBirth: Date,
  
  // Child role system - replaces parent system
  childLockPassword: String, // Password for child account access to restricted features
  childLockPhoneNumber: String, // Phone number for child account verification
  isAccountBlocked: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'suspended'], default: 'active' },
  blockedReason: String,
  profilePhoto: String,
  preferredLanguage: String,
  accessibility: {
    fontSize: String,
    accentColor: { type: String, default: '#7C3AED' },
  },
  interests: [String],
  concentrations: [{
    key: String,
    treeProgress: [{ node: String, progressPercent: { type: Number, default: 0 } }]
  }],
  badges: [String],
  xp: { type: Number, default: 0 },
  credits: { type: Number, default: 0 },

  // SkillPay Wallet
  wallet: {
    isActivated: { type: Boolean, default: false },
    activatedAt: { type: Date, default: null },
    termsAcceptedAt: { type: Date, default: null },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastTransactionAt: { type: Date, default: null }
  },
  avatarsUnlocked: [String],
  skillQuests: [{
    questId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillQuest' },
    completed: Boolean,
    completionDate: Date
  }],
  avatarUrl: { type: String, default: '' },
  coverUrl:  { type: String, default: '' },

  // Your course progress dictionary (kept from before)
  courseProgress: {
    type: Map,
    of: [String],
    default: {}
  },

  dashboardData: {
    enrolledCourses: [{
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      enrolledAt: { type: Date, default: Date.now },
      currentLectureIndex: { type: Number, default: 0 },
      completedLectures: [Number],
      completedQuizzes: [Number],
      // NEW: Enhanced progress tracking
      lectureProgress: [{
        lectureIndex: { type: Number, required: true },
        completed: { type: Boolean, default: false },
        completedAt: Date,
        timeSpent: Number, // in seconds
        examAttempts: [{
          examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
          attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt' },
          score: Number,
          passed: Boolean,
          completedAt: Date
        }],
        lastAccessed: Date
      }],
      // NEW: Course completion tracking
      overallProgress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
      totalTimeSpent: Number, // in seconds
      lastAccessed: Date,
      // NEW: Exam scores tracking
      examScores: [{
        examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
        bestScore: Number,
        attempts: Number,
        lastAttemptDate: Date,
        passed: Boolean
      }]
    }],
    skillPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SkillPost' }],
    certificates: [{
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      issueDate: Date,
      credentialId: String,
      finalScore: Number,
      completionDate: Date
    }],
    feedbackScore: Number,
  },

  recommendedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  googleId: String,

  // Friend system fields
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  receivedFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // SkillConnect system fields
  skillPreferences: {
    selectedSkills: [{
      skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      },
      selectedSubSkills: [String],
      proficiencyLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Beginner'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    hasCompletedSkillOnboarding: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // extra placeholders (as requested earlier)
  extradictionary1: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  extradictionary2: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  extralist1: { type: [mongoose.Schema.Types.Mixed], default: [] },
  extralist2: { type: [mongoose.Schema.Types.Mixed], default: [] },
  variableextra1:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra2:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra3:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra4:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra5:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra6:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra7:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra8:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra9:  { type: mongoose.Schema.Types.Mixed, default: null },
  variableextra10: { type: mongoose.Schema.Types.Mixed, default: null },

  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
}, { timestamps: false });

// Ensure indexes
userSchema.index({ handle: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } });

// Auto-generate handle on first save
userSchema.pre('validate', function(next) {
  if (!this.handle) {
    const idStr = (this._id || new mongoose.Types.ObjectId()).toString();
    this.handle = makeHandleFromObjectId(idStr);
  }
  next();
});

// Auto-set status for under-13 users - block them completely
userSchema.pre('save', function(next) {
  // Block users under 13 completely - they need parent to create account
  if (this.age && this.age < 13) {
    this.status = 'inactive';
    this.isAccountBlocked = true;
    this.blockedReason = 'Users under 13 are not allowed. Please ask your parent to create an account for you.';
    console.log(`Blocking user ${this.email} - under 13 years old (age: ${this.age})`);
  } else if (this.age && this.age >= 13 && this.status === 'inactive' && this.blockedReason?.includes('under 13')) {
    // If user is 13 or older and was previously blocked for being under 13, unblock them
    this.status = 'active';
    this.isAccountBlocked = false;
    this.blockedReason = undefined;
    console.log(`Unblocking user ${this.email} - now 13 or older (age: ${this.age})`);
  }
  
  next();
});

// Virtual: what to show in UI
userSchema.virtual('displayHandle').get(function() {
  return this.username || this.handle;
});

// (existing) peer mentor virtual
userSchema.virtual('isPeerMentor').get(function() {
  return this.badges.length >= 3 && this.xp >= 500;
});

module.exports = mongoose.model('User', userSchema);
