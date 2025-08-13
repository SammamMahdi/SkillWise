const mongoose = require('mongoose');

const examReAttemptRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  examCreator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: false // Not required for contact creator requests
  },
  violationType: {
    type: String,
    required: true,
    enum: [
      'tab_switching',
      'copy_paste',
      'right_click',
      'fullscreen_exit',
      'webcam_violation',
      'time_exceeded',
      'multiple_violations',
      'contact_creator',
      'other'
    ]
  },
  violationDetails: {
    type: String,
    required: true
  },
  studentMessage: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  creatorResponse: {
    type: String,
    maxlength: 300
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // If approved, track the new attempt
  newAttemptGranted: {
    type: Boolean,
    default: false
  },
  newAttemptUsed: {
    type: Boolean,
    default: false
  },
  newAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
examReAttemptRequestSchema.index({ student: 1, exam: 1 });
examReAttemptRequestSchema.index({ examCreator: 1, status: 1 });
examReAttemptRequestSchema.index({ createdAt: -1 });

// Index for efficient queries - only unique when originalAttempt exists (not null)
// This allows multiple contact creator requests (originalAttempt: null) but prevents
// duplicate violation-based requests (originalAttempt: ObjectId)
examReAttemptRequestSchema.index({
  student: 1,
  originalAttempt: 1
}, {
  unique: true,
  partialFilterExpression: { originalAttempt: { $ne: null } }
});

module.exports = mongoose.model('ExamReAttemptRequest', examReAttemptRequestSchema);
