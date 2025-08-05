const mongoose = require('mongoose');

const lectureContentSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'pdf'], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: Number, // in seconds
  timestampNotes: [{
    time: { type: Number, required: true }, // timestamp in seconds
    note: { type: String, required: true }
  }]
});

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['mcq', 'short', 'essay'], 
    required: true 
  },
  options: [String],
  answer: mongoose.Schema.Types.Mixed,
  points: Number
});

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: [lectureContentSchema],
  quiz: [quizQuestionSchema],
  isLocked: { type: Boolean, default: true },
  isExam: { type: Boolean, default: false },
  timeLimit: Number, // in minutes for exams
  shuffleQuestions: { type: Boolean, default: false }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tags: [String],
  prerequisites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  price: { type: Number, default: 0 },
  lectures: [lectureSchema],
  
  // Learning tools
  flashcards: [{ 
    front: { type: String, required: true }, 
    back: { type: String, required: true } 
  }],
  spacedRepetitionSchedule: [Date],
  
  // Peer assessment
  peerSubmissions: [{
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
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

module.exports = mongoose.model('Course', courseSchema);