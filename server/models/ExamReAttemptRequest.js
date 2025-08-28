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
  // Type of violation or reason for re-attempt request
  violationType: {
    type: String,
    enum: ['technical_issue', 'health_emergency', 'power_outage', 'internet_issue', 'contact_creator', 'other'],
    required: true
  },
  violationDetails: {
    type: String,
    required: true
  },
  // Student's message explaining the situation
  studentMessage: {
    type: String,
    required: true
  },
  // Status of the request
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Creator's response
  creatorResponse: {
    type: String,
    default: ''
  },
  // Whether a new attempt was granted
  newAttemptGranted: {
    type: Boolean,
    default: false
  },
  // Whether the new attempt has been used
  newAttemptUsed: {
    type: Boolean,
    default: false
  },
  // ID of the new attempt if granted and used
  newAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt'
  },
  // Timestamps
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Supporting evidence (optional)
  evidence: {
    type: String, // Could be file path or description
    default: ''
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
examReAttemptRequestSchema.index({ student: 1, exam: 1 });
examReAttemptRequestSchema.index({ examCreator: 1, status: 1 });
examReAttemptRequestSchema.index({ status: 1, createdAt: -1 });
examReAttemptRequestSchema.index({ course: 1, status: 1 });

// Pre-save middleware to update reviewedAt timestamp
examReAttemptRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  next();
});

// Static method to get pending requests for a creator
examReAttemptRequestSchema.statics.getPendingRequests = function(creatorId) {
  return this.find({
    examCreator: creatorId,
    status: 'pending'
  })
  .populate('student', 'name email')
  .populate('exam', 'title')
  .populate('course', 'title')
  .sort({ createdAt: -1 });
};

// Static method to get student's requests
examReAttemptRequestSchema.statics.getStudentRequests = function(studentId) {
  return this.find({
    student: studentId
  })
  .populate('exam', 'title')
  .populate('course', 'title')
  .populate('examCreator', 'name')
  .sort({ createdAt: -1 });
};

// Instance method to approve request
examReAttemptRequestSchema.methods.approve = function(response, reviewerId) {
  this.status = 'approved';
  this.creatorResponse = response;
  this.newAttemptGranted = true;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  return this.save();
};

// Instance method to reject request
examReAttemptRequestSchema.methods.reject = function(response, reviewerId) {
  this.status = 'rejected';
  this.creatorResponse = response;
  this.newAttemptGranted = false;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  return this.save();
};

// Instance method to mark new attempt as used
examReAttemptRequestSchema.methods.markAttemptUsed = function(attemptId) {
  this.newAttemptUsed = true;
  this.newAttemptId = attemptId;
  return this.save();
};

module.exports = mongoose.model('ExamReAttemptRequest', examReAttemptRequestSchema);
