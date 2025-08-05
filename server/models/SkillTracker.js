const mongoose = require('mongoose');

// Skill DNA tracking
const skillSnapshotSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  skillTag: { type: String, required: true },
  depth: { 
    type: Number, 
    min: 1, 
    max: 10, 
    default: 1 
  },
  lastPracticed: { type: Date, default: Date.now },
  practiceCount: { type: Number, default: 1 }
});

// Green initiative tracking
const greenPrintSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  activityType: { 
    type: String, 
    enum: ['digital-only', 'no-travel', 'eco-content', 'device-sharing'],
    required: true 
  },
  carbonSaved: { type: Number, default: 0 }, // in kg CO2
  createdAt: { type: Date, default: Date.now }
});

// Skill Quests
const skillQuestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  questType: { 
    type: String, 
    enum: ['daily', 'weekly'], 
    required: true 
  },
  xpReward: { type: Number, required: true },
  badgeReward: String,
  requiredAction: { 
    type: String, 
    enum: ['teach', 'learn', 'complete', 'share'],
    required: true
  },
  targetCount: { type: Number, default: 1 },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = {
  SkillSnapshot: mongoose.model('SkillSnapshot', skillSnapshotSchema),
  GreenPrint: mongoose.model('GreenPrint', greenPrintSchema),
  SkillQuest: mongoose.model('SkillQuest', skillQuestSchema)
};