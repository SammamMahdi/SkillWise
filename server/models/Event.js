const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  calendarLink: String,
  eventType: {
    type: String,
    enum: ['live-class', 'workshop', 'skill-share', 'one-day'],
    required: true
  },
  // Timestamps
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);