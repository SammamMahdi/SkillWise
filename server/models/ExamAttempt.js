const mongoose = require('mongoose');

// Import question schema from Exam model
const examQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'essay'],
    required: true
  },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  correctAnswer: String,
  maxWords: Number,
  points: { type: Number, required: true, min: 1 },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, { _id: true });

// Answer schema for different question types
const answerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  questionType: {
    type: String,
    enum: ['mcq', 'short_answer', 'essay'],
    required: true
  },
  // For MCQ questions - store selected option index
  selectedOption: Number,
  // For short answer and essay questions
  textAnswer: String,
  // Grading information
  points: { type: Number, default: 0 },
  maxPoints: { type: Number, required: true },
  isCorrect: Boolean, // For MCQ and short answers
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  feedback: String, // Teacher/grader feedback
  autoGraded: { type: Boolean, default: false }
}, { _id: false });

// Anti-cheat violation tracking
const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab_switch', 'copy_paste', 'right_click', 'fullscreen_exit', 'suspicious_activity'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  details: String, // Additional details about the violation
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { _id: false });

// Main exam attempt schema
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
  
  // Attempt details
  attemptNumber: { type: Number, required: true, min: 1 },
  
  // Timing
  startedAt: { type: Date, required: true },
  submittedAt: Date,
  timeSpent: Number, // in seconds
  isTimedOut: { type: Boolean, default: false },
  
  // Questions and answers (snapshot of exam questions at attempt time)
  examSnapshot: {
    title: String,
    timeLimit: Number,
    totalPoints: Number,
    questions: [examQuestionSchema] // Copy of questions from Exam model
  },
  
  // Student's answers
  answers: [answerSchema],
  
  // Scoring
  totalScore: { type: Number, default: 0 }, // Auto-calculated score
  finalScore: { type: Number }, // Admin-published final score (overrides totalScore)
  percentage: { type: Number, default: 0 },
  finalPercentage: { type: Number }, // Calculated from finalScore
  passed: { type: Boolean, default: false },
  finalPassed: { type: Boolean }, // Based on finalScore
  
  // Grading status
  gradingStatus: {
    type: String,
    enum: ['pending', 'partially_graded', 'fully_graded'],
    default: 'pending'
  },

  // Score publishing status
  scorePublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  instructorFeedback: { type: String, maxlength: 1000 },
  
  // Anti-cheat monitoring
  violations: [violationSchema],
  violationCount: { type: Number, default: 0 },
  flaggedForReview: { type: Boolean, default: false },
  terminatedDueToViolation: { type: Boolean, default: false },
  terminationReason: { type: String },
  
  // Browser and environment info
  browserInfo: {
    userAgent: String,
    screenResolution: String,
    timezone: String
  },
  
  // Submission details
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'auto_submitted', 'cancelled'],
    default: 'in_progress'
  },
  
  submissionMethod: {
    type: String,
    enum: ['manual', 'auto_timeout', 'auto_violation', 'admin_force'],
    default: 'manual'
  },
  
  // Additional metadata
  ipAddress: String,
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient queries
examAttemptSchema.index({ exam: 1, student: 1, attemptNumber: 1 }, { unique: true });
examAttemptSchema.index({ student: 1, status: 1 });
examAttemptSchema.index({ exam: 1, status: 1 });
examAttemptSchema.index({ flaggedForReview: 1, createdAt: -1 });

// Pre-save middleware to calculate percentage and pass status
examAttemptSchema.pre('save', function(next) {
  if (this.totalScore !== undefined && this.examSnapshot?.totalPoints > 0) {
    this.percentage = Math.round((this.totalScore / this.examSnapshot.totalPoints) * 100);
    
    // Get passing score from exam or use default 60%
    const passingScore = this.examSnapshot.passingScore || 60;
    this.passed = this.percentage >= passingScore;
  }
  
  // Update violation count
  if (this.violations) {
    this.violationCount = this.violations.length;
    
    // Flag for review if too many violations
    if (this.violationCount >= 3) {
      this.flaggedForReview = true;
    }
  }
  
  next();
});

// Virtual for time spent in human readable format
examAttemptSchema.virtual('timeSpentText').get(function() {
  if (!this.timeSpent) return '0m';
  
  const hours = Math.floor(this.timeSpent / 3600);
  const minutes = Math.floor((this.timeSpent % 3600) / 60);
  const seconds = this.timeSpent % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
