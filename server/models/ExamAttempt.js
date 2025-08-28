const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  // Final scores after instructor review
  finalScore: {
    type: Number
  },
  finalPercentage: {
    type: Number
  },
  finalPassed: {
    type: Boolean
  },
  scorePublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  instructorFeedback: {
    type: String,
    default: ''
  },
  gradingStatus: {
    type: String,
    enum: ['not_graded', 'partially_graded', 'fully_graded'],
    default: 'not_graded'
  },
  // Exam snapshot to preserve exam state at time of attempt
  examSnapshot: {
    title: String,
    timeLimit: Number,
    totalPoints: Number,
    questions: [{
      _id: mongoose.Schema.Types.ObjectId,
      questionText: String,
      type: {
        type: String,
        enum: ['mcq', 'short_answer', 'essay']
      },
      options: [{
        text: String,
        isCorrect: Boolean
      }],
      correctAnswer: String,
      points: Number,
      maxWords: Number,
      explanation: String
    }],
    antiCheat: {
      preventTabSwitch: { type: Boolean, default: false },
      preventCopyPaste: { type: Boolean, default: false },
      preventRightClick: { type: Boolean, default: false },
      fullScreenRequired: { type: Boolean, default: false }
    },
    passingScore: Number
  },
  // Student answers
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    questionType: {
      type: String,
      enum: ['mcq', 'short_answer', 'essay'],
      required: true
    },
    selectedOption: Number, // for MCQ
    textAnswer: String, // for short_answer and essay
    points: {
      type: Number,
      default: 0
    },
    maxPoints: Number,
    isCorrect: {
      type: Boolean,
      default: false
    },
    autoGraded: {
      type: Boolean,
      default: false
    },
    manualScore: Number, // for instructor grading
    feedback: String // instructor feedback for this answer
  }],
  // Anti-cheat violations
  violations: [{
    type: {
      type: String,
      enum: ['tab_switch', 'copy_paste', 'right_click', 'fullscreen_exit', 'timeout', 'other']
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  // Browser and system info
  browserInfo: {
    userAgent: String,
    screenResolution: String,
    timezone: String,
    language: String
  },
  ipAddress: String,
  // Auto-submission flags
  isTimedOut: {
    type: Boolean,
    default: false
  },
  submissionMethod: {
    type: String,
    enum: ['manual', 'auto_timeout', 'auto_violation'],
    default: 'manual'
  },
  terminatedDueToViolation: {
    type: Boolean,
    default: false
  },
  terminationReason: String
}, {
  timestamps: true
});

// Indexes for better query performance
examAttemptSchema.index({ exam: 1, student: 1 });
examAttemptSchema.index({ student: 1, status: 1 });
examAttemptSchema.index({ exam: 1, status: 1 });
examAttemptSchema.index({ submittedAt: -1 });

// Virtual for calculating percentage
examAttemptSchema.virtual('calculatedPercentage').get(function() {
  if (this.examSnapshot && this.examSnapshot.totalPoints > 0) {
    return Math.round((this.totalScore / this.examSnapshot.totalPoints) * 100);
  }
  return 0;
});

// Pre-save middleware to calculate percentage and passed status
examAttemptSchema.pre('save', function(next) {
  if (this.examSnapshot && this.examSnapshot.totalPoints > 0) {
    this.percentage = Math.round((this.totalScore / this.examSnapshot.totalPoints) * 100);
    this.passed = this.percentage >= (this.examSnapshot.passingScore || 60);
  }
  next();
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
