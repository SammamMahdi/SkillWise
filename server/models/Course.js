const mongoose = require('mongoose');

// ---------- Subschemas ----------
const lectureContentSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'pdf'], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: Number, // in seconds
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
  content: [lectureContentSchema],
  quiz: [quizQuestionSchema],
  isLocked: { type: Boolean, default: true },
  isExam: { type: Boolean, default: false },
  timeLimit: Number, // in minutes for exams
  shuffleQuestions: { type: Boolean, default: false }
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

module.exports = mongoose.model('Course', courseSchema);
