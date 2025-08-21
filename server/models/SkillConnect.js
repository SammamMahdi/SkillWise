const mongoose = require('mongoose');

// Individual skill definition
const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Physics', 'Music Theory', 'Psychology', 'Mathematics', 'Engineering', 'Arts', 'Business', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  subSkills: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    }
  }],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  icon: {
    type: String,
    default: 'Code'
  },
  color: {
    type: String,
    default: '#7C3AED'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Skills by users - tracks which users have which skills
const skillUserSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  users: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    selectedSubSkills: [String], // Array of sub-skill names
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// User preferences and skill selections
const userSkillPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  selectedSkills: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    selectedSubSkills: [String], // Array of sub-skill names
    proficiencyLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Age groups for connection algorithm
const ageGroupSchema = new mongoose.Schema({
  ageRange: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Course enrollment groups for connection algorithm
const courseEnrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Skill connections - computed matches between users
const skillConnectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connections: [{
    connectedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    matchReasons: {
      skillsMatch: {
        score: Number,
        commonSkills: [String]
      },
      ageMatch: {
        score: Number,
        ageDifference: Number
      },
      courseMatch: {
        score: Number,
        commonCourses: [String]
      }
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for performance
skillSchema.index({ category: 1, name: 1 });
skillUserSchema.index({ skill: 1 });
skillUserSchema.index({ 'users.user': 1 });
userSkillPreferenceSchema.index({ user: 1 });
ageGroupSchema.index({ 'ageRange.min': 1, 'ageRange.max': 1 });
courseEnrollmentSchema.index({ course: 1 });
skillConnectionSchema.index({ user: 1 });
skillConnectionSchema.index({ 'connections.connectedUser': 1 });

const Skill = mongoose.model('Skill', skillSchema);
const SkillUser = mongoose.model('SkillUser', skillUserSchema);
const UserSkillPreference = mongoose.model('UserSkillPreference', userSkillPreferenceSchema);
const AgeGroup = mongoose.model('AgeGroup', ageGroupSchema);
const CourseEnrollment = mongoose.model('CourseEnrollment', courseEnrollmentSchema);
const SkillConnection = mongoose.model('SkillConnection', skillConnectionSchema);

module.exports = {
  Skill,
  SkillUser,
  UserSkillPreference,
  AgeGroup,
  CourseEnrollment,
  SkillConnection
};
