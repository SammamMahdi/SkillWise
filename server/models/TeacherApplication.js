// Teacher Application Model - All fields are optional except applicant ID
const mongoose = require('mongoose');

const teacherApplicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  personalDetails: {
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  qualifications: {
    highestDegree: {
      type: String,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    university: {
      type: String,
      trim: true
    },
    graduationYear: {
      type: Number
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4
    }
  },
  experience: {
    yearsOfExperience: {
      type: Number,
      min: 0
    },
    previousPositions: [{
      title: String,
      institution: String,
      duration: String,
      description: String
    }],
    teachingExperience: {
      type: String
    }
  },
  specializations: [{
    subject: {
      type: String,
      trim: true
    },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    yearsOfExperience: {
      type: Number,
      min: 0
    }
  }],
  motivation: {
    whyTeach: {
      type: String,
      maxlength: 1000
    },
    goals: {
      type: String,
      maxlength: 1000
    },
    contribution: {
      type: String,
      maxlength: 1000
    }
  },
  documents: {
    resume: {
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: Date
    },
    certificates: [{
      filename: String,
      originalName: String,
      path: String,
      certificateType: String,
      uploadedAt: Date
    }],
    identityDocument: {
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: Date
    },
    portfolioLinks: [{
      title: String,
      url: String,
      description: String
    }]
  },
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewDate: Date,
    reviewNotes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
teacherApplicationSchema.index({ applicant: 1 });
teacherApplicationSchema.index({ applicationStatus: 1 });
teacherApplicationSchema.index({ submittedAt: -1 });

// Pre-save middleware to update lastUpdated
teacherApplicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get application statistics
teacherApplicationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$applicationStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Instance method to check if user can edit application
teacherApplicationSchema.methods.canEdit = function() {
  return this.applicationStatus === 'pending';
};

module.exports = mongoose.model('TeacherApplication', teacherApplicationSchema);
