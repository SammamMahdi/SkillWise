const mongoose = require('mongoose');

const aiRecommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['courses_to_add'], default: 'courses_to_add' },
  fromCV: { type: Boolean, default: true },
  cvSnapshot: { type: String },
  // Store plain text suggestions and also normalized course name list
  suggestionsText: { type: String },
  suggestedCourseNames: [String],
  status: { type: String, enum: ['pending', 'actioned', 'dismissed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

aiRecommendationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AIRecommendation', aiRecommendationSchema);


