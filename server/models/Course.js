const mongoose = require('mongoose');

// ---------- Subschemas ----------
const lectureContentSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'pdf'], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  // For video content
  videoType: { 
    type: String, 
    enum: ['youtube', 'vimeo', 'direct', 'other'], 
    default: 'youtube' 
  },
  videoId: String, // YouTube video ID for embedding
  duration: Number, // in seconds
  // For PDF content
  pdfSize: Number, // file size in bytes
  pdfPages: Number, // number of pages
  // Optional timestamp notes for videos
  timestampNotes: [{
    time: { type: Number, required: true },
    note: { type: String, required: true }
  }]
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short', 'essay'], required: true },
  options: [String],
  answer: mongoose.Schema.Types.Mixed,
  points: Number
}, { _id: false });

const lectureSchema = new mongoose.Schema({
  // NEW: internal 5-digit lecture code (manual)
  lectureCode: {
    type: String,
    required: true,
    match: [/^\d{5}$/, 'Lecture code must be 5 digits'],
  },
  title: { type: String, required: true },
  // NEW: Rich text description shown near video/content
  description: { type: String, default: '' },
  content: [lectureContentSchema],
  quiz: [quizQuestionSchema],
  isLocked: { type: Boolean, default: true },
  isExam: { type: Boolean, default: false },
  timeLimit: Number, // in minutes for exams
  shuffleQuestions: { type: Boolean, default: false },
  // NEW: Exam relationship
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: false
  },
  // NEW: Exam requirements
  examRequired: { type: Boolean, default: false },
  passingScore: { type: Number, default: 60, min: 0, max: 100 }, // percentage
  // NEW: Lecture completion tracking
  estimatedDuration: Number, // in minutes
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'beginner' 
  },
  // NEW: Auto-graded lecture quiz (separate from existing system)
  autoQuizEnabled: { type: Boolean, default: true },
  autoQuiz: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short'], default: 'mcq' },
    options: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
    points: { type: Number, default: 1 }
  }]
}, { _id: true });

// ---------- Helper ----------
function makePublicCodeFromTitle(title) {
  const base = (title || 'course')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32);
  const rand = Math.random().toString(36).slice(2, 6); // 4 chars
  return `${base || 'course'}-${rand}`;
}

// ---------- Course schema ----------
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },

  // Teacher required
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  tags: [String],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  price: { type: Number, default: 0 },

  // NEW: internal 5-digit course code (manual)
  courseCode: {
    type: String,
    required: true,
    match: [/^\d{5}$/, 'Course code must be 5 digits'],
    index: true,
  },

  // NEW: public code/slug (visible to everyone)
  publicCode: {
    type: String,
    unique: true,
    index: true,
    sparse: true,
  },

  lectures: [lectureSchema],

  // Learning tools
  flashcards: [{ front: { type: String, required: true }, back: { type: String, required: true } }],
  spacedRepetitionSchedule: [Date],

  // Peer assessment
  peerSubmissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lectureIndex: Number,
    content: String,
    grades: [{
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: Number,
      feedback: String
    }],
    finalGrade: Number
  }],

  // Course Ratings
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Aggregated rating statistics
  ratingStats: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },

  // Sustainability
  greenScore: Number,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

// Auto public code if absent
courseSchema.pre('validate', function(next) {
  if (!this.publicCode) this.publicCode = makePublicCodeFromTitle(this.title);
  next();
});

// Process lecture content before saving
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to update rating statistics
courseSchema.methods.updateRatingStats = function() {
  const ratings = this.ratings || [];
  
  if (ratings.length === 0) {
    this.ratingStats = {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    return;
  }

  // Calculate total and distribution
  let totalRating = 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  ratings.forEach(rating => {
    totalRating += rating.rating;
    distribution[rating.rating]++;
  });

  this.ratingStats = {
    averageRating: Math.round((totalRating / ratings.length) * 10) / 10, // Round to 1 decimal
    totalRatings: ratings.length,
    ratingDistribution: distribution
  };
};

// Update rating stats before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('ratings')) {
    this.updateRatingStats();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
