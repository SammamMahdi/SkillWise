const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  lectureIndex: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  progress: {
    type: Number, // percentage (0-100)
    default: 0,
    min: 0,
    max: 100
  },
  // For video lectures
  videoProgress: {
    currentTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    watchedSegments: [{
      start: Number,
      end: Number,
      duration: Number
    }]
  },
  // For interactive content
  interactions: [{
    type: {
      type: String,
      enum: ['click', 'scroll', 'pause', 'resume', 'seek']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }],
  // Notes taken during lecture
  notes: {
    type: String,
    default: ''
  },
  // Quiz/assessment results if any
  quizResults: {
    score: Number,
    totalQuestions: Number,
    correctAnswers: Number,
    completedAt: Date
  },
  // Bookmarks
  bookmarks: [{
    timestamp: Number,
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Last accessed
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
lectureProgressSchema.index({ user: 1, course: 1, lecture: 1 }, { unique: true });
lectureProgressSchema.index({ user: 1, course: 1 });
lectureProgressSchema.index({ user: 1, status: 1 });

// Virtual for calculating completion percentage
lectureProgressSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'completed') {
    return 100;
  } else if (this.status === 'in_progress') {
    return this.progress;
  }
  return 0;
});

// Pre-save middleware to update timestamps
lectureProgressSchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  
  if (this.status === 'in_progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Static method to get course progress
lectureProgressSchema.statics.getCourseProgress = async function(userId, courseId) {
  const progress = await this.find({ user: userId, course: courseId });
  
  const totalLectures = progress.length;
  const completedLectures = progress.filter(p => p.status === 'completed').length;
  const inProgressLectures = progress.filter(p => p.status === 'in_progress').length;
  
  const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
  
  return {
    totalLectures,
    completedLectures,
    inProgressLectures,
    notStartedLectures: totalLectures - completedLectures - inProgressLectures,
    overallProgress,
    lectureProgress: progress
  };
};

// Instance method to mark as completed
lectureProgressSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  return this.save();
};

// Instance method to update progress
lectureProgressSchema.methods.updateProgress = function(newProgress) {
  this.progress = Math.min(100, Math.max(0, newProgress));
  
  if (this.progress >= 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.status === 'not_started') {
    this.status = 'in_progress';
    this.startedAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('LectureProgress', lectureProgressSchema);
