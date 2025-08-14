const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
  // Student and course relationship
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lectureIndex: {
    type: Number,
    required: true
  },
  
  // Progress status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'locked'],
    default: 'not_started'
  },
  
  // Content completion tracking
  contentProgress: {
    videoWatched: { type: Boolean, default: false },
    videoProgress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    videoTimeSpent: { type: Number, default: 0 }, // in seconds
    pdfDownloaded: { type: Boolean, default: false },
    pdfRead: { type: Boolean, default: false },
    pdfPagesRead: { type: Number, default: 0 }
  },
  
  // Exam tracking
  examProgress: {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    attempts: [{
      attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt' },
      score: Number,
      passed: Boolean,
      completedAt: Date
    }],
    bestScore: Number,
    totalAttempts: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    lastAttemptDate: Date
  },
  
  // Quiz tracking (if lecture has embedded quiz)
  quizProgress: {
    completed: { type: Boolean, default: false },
    score: Number,
    attempts: Number,
    lastAttemptDate: Date
  },
  
  // Timestamps
  startedAt: Date,
  completedAt: Date,
  lastAccessed: { type: Date, default: Date.now },
  
  // Notes and feedback
  studentNotes: String,
  teacherFeedback: String,
  
  // Prerequisites check
  prerequisitesMet: { type: Boolean, default: true },
  blockedBy: [{
    lectureIndex: Number,
    reason: String
  }]
}, { 
  timestamps: true 
});

// Compound index for efficient queries
lectureProgressSchema.index({ student: 1, course: 1, lectureIndex: 1 }, { unique: true });
lectureProgressSchema.index({ course: 1, lectureIndex: 1 });
lectureProgressSchema.index({ student: 1, status: 1 });

// Pre-save middleware to update exam progress
lectureProgressSchema.pre('save', function(next) {
  // Update exam progress summary
  if (this.examProgress && this.examProgress.attempts) {
    this.examProgress.totalAttempts = this.examProgress.attempts.length;
    
    if (this.examProgress.attempts.length > 0) {
      const bestAttempt = this.examProgress.attempts.reduce((best, current) => {
        return (current.score > best.score) ? current : best;
      });
      
      this.examProgress.bestScore = bestAttempt.score;
      this.examProgress.passed = bestAttempt.passed;
      this.examProgress.lastAttemptDate = bestAttempt.completedAt;
    }
  }
  
  // Update status based on completion
  if (this.contentProgress.videoWatched && this.contentProgress.pdfRead) {
    if (this.examProgress.passed || !this.examProgress.examId) {
      this.status = 'completed';
      if (!this.completedAt) {
        this.completedAt = new Date();
      }
    }
  }
  
  next();
});

// Virtual for overall progress percentage
lectureProgressSchema.virtual('overallProgress').get(function() {
  let progress = 0;
  let totalSteps = 0;
  
  // Content progress (50% weight)
  if (this.contentProgress.videoWatched) progress += 25;
  if (this.contentProgress.pdfRead) progress += 25;
  totalSteps += 2;
  
  // Exam progress (50% weight)
  if (this.examProgress.examId) {
    if (this.examProgress.passed) {
      progress += 50;
    } else {
      progress += (this.examProgress.bestScore || 0) * 0.5; // Convert score to percentage
    }
    totalSteps += 1;
  }
  
  return totalSteps > 0 ? Math.round(progress) : 0;
});

module.exports = mongoose.model('LectureProgress', lectureProgressSchema);

