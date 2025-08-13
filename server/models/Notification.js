const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional for system notifications
  },
  type: {
    type: String,
    enum: [
      'parent_request', 'child_request', 'parent_approval', 'child_approval',
      'account_blocked', 'account_unblocked', 'friend_request', 'friend_accepted',
      'friend_rejected', 'exam_review_request', 'exam_approved', 'exam_rejected',
      'exam_published', 'exam_graded', 'exam_submission_review', 'exam_score_published',
      'exam_violation_submission', 'exam_reattempt_request', 'exam_reattempt_approved', 'exam_reattempt_rejected',
      'test' // For testing purposes
    ],
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  data: {
    // Additional data specific to notification type
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamAttempt' },
    requestId: String,
    reason: String,
    score: Number,
    grade: String,
    // For violation and re-attempt notifications
    studentName: String,
    examTitle: String,
    violationCount: Number,
    violations: [String],
    violationType: String,
    studentMessage: String,
    action: String,
    response: String
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  isActionRequired: { 
    type: Boolean, 
    default: false 
  },
  actionUrl: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: Date
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);