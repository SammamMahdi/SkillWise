const mongoose = require('mongoose');

const postReportSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  resolutionNote: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionTaken: { type: String, enum: ['none', 'deleted_post', 'warned_user', 'other'], default: 'none' }
}, { timestamps: true });

postReportSchema.index({ post: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('PostReport', postReportSchema);


