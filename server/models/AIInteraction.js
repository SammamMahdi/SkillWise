const mongoose = require('mongoose');

const interactionLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  context: {
    type: { type: String, enum: ['course', 'skill', 'forum'] },
    id: mongoose.Schema.Types.ObjectId
  },
  input: String,
  response: String,
  actionTaken: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InteractionLog', interactionLogSchema);