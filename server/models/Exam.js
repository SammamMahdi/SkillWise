const mongoose = require('mongoose');

// Question schema for exams
const examQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['mcq', 'short_answer', 'essay'], 
    required: true 
  },
  // For MCQ questions
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  // For short answer and essay questions
  correctAnswer: String, // For short answers
  maxWords: Number, // For essays
  points: { type: Number, required: true, min: 1 },
  explanation: String, // Optional explanation for the correct answer
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
}, { _id: true });

// Main exam schema
const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  
  // Course and teacher relationship
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Questions
  questions: [examQuestionSchema],
  
  // Exam settings
  timeLimit: { 
    type: Number, 
    required: true, 
    min: 5, 
    max: 300 // 5 hours max
  }, // in minutes
  
  totalPoints: { type: Number, default: 0 },
  passingScore: { type: Number, default: 60 }, // percentage
  
  // Randomization settings
  shuffleQuestions: { type: Boolean, default: true },
  randomizeOptions: { type: Boolean, default: true },
  questionsPerAttempt: Number, // If set, randomly select this many questions
  
  // Anti-cheat settings
  antiCheat: {
    blockCopyPaste: { type: Boolean, default: true },
    blockTabSwitching: { type: Boolean, default: true },
    blockRightClick: { type: Boolean, default: true },
    fullScreenRequired: { type: Boolean, default: false },
    webcamRequired: { type: Boolean, default: false }
  },
  
  // Attempt settings
  maxAttempts: { type: Number, default: 1, min: 1 },
  showResultsImmediately: { type: Boolean, default: false },
  showCorrectAnswers: { type: Boolean, default: false },
  
  // Exam status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  // Scheduling
  availableFrom: Date,
  availableUntil: Date,
  
  // Visibility
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  
  // Statistics
  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  passRate: { type: Number, default: 0 }
});

// Pre-save middleware to calculate total points
examSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  }
  this.updatedAt = new Date();
  next();
});

// Virtual for exam duration in human readable format
examSchema.virtual('durationText').get(function() {
  const hours = Math.floor(this.timeLimit / 60);
  const minutes = this.timeLimit % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Index for efficient queries
examSchema.index({ course: 1, status: 1 });
examSchema.index({ teacher: 1, status: 1 });
examSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Exam', examSchema);
