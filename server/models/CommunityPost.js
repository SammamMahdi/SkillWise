const mongoose = require('mongoose');

const PRIVACY = ['public', 'friends', 'only_me'];
const POST_TYPES = ['blog', 'image', 'poll', 'debate', 'share_course', 'shared'];

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const pollOptionSchema = new mongoose.Schema({
  optionId: { type: String, required: true }, // client-generated stable id
  text: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const imageVariantSchema = new mongoose.Schema({
  original: { type: String },
  webp: { type: String },
  thumb: { type: String }
}, { _id: false });

const sharedCourseSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: Date,
  overallProgress: { type: Number, min: 0, max: 100 },
  currentLectureIndex: Number
}, { _id: false });

const communityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: POST_TYPES, required: true },
  privacy: { type: String, enum: PRIVACY, default: 'public' },

  // Common
  text: { type: String },
  comments: [commentSchema], // Comments available for all post types

  // Blog
  title: String,

  // Images
  images: [imageVariantSchema],

  // Poll
  poll: {
    question: String,
    options: [pollOptionSchema],
    closesAt: Date,
  },

  // Debate
  debateTopic: String,

  // Share enrolled course
  sharedCourse: sharedCourseSchema,

  // Track if this is a shared post
  sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ privacy: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);



