// models/ConsultationRequest.js
const mongoose = require('mongoose');

const ConsultationRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  topic: { type: String, required: true },
  description: { type: String },
  proposedDateTime: { type: Date, required: true },
  meetingLink: { type: String },
  attachments: [{ type: String }], // array of file URLs or paths
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ConsultationRequest', ConsultationRequestSchema);
