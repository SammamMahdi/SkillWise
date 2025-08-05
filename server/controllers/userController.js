const { validationResult } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const SkillPost = require('../models/SkillPost');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    console.log('Profile request received for userId:', req.userId);
    
    const user = await User.findById(req.userId)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    if (!user) {
      console.log('User not found for userId:', req.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', { id: user._id, name: user.name, email: user.email });

          res.json({
        success: true,
        data: { 
          user: {
            ...user.toObject(),
            roleConfirmed: user.roleConfirmed
          }
        }
      });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      preferredLanguage,
      interests,
      accessibility,
      profilePhoto,
      role
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (interests) user.interests = interests;
    if (accessibility) {
      if (accessibility.fontSize) user.accessibility.fontSize = accessibility.fontSize;
      if (accessibility.accentColor) user.accessibility.accentColor = accessibility.accentColor;
    }
    if (profilePhoto) user.profilePhoto = profilePhoto;
    
    // Only allow role updates for admins
    if (role && user.role === 'Admin') {
      user.role = role;
    }

    await user.save();

    // Return the updated user without sensitive fields
    const updatedUser = await User.findById(req.userId)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// @desc    Update accessibility settings
// @route   PUT /api/users/accessibility
// @access  Private
const updateAccessibility = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fontSize, colorMode } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update accessibility settings
    if (fontSize) user.accessibility.fontSize = fontSize;
    if (colorMode) user.accessibility.colorMode = colorMode;

    await user.save();

    res.json({
      success: true,
      message: 'Accessibility settings updated successfully',
      data: { accessibility: user.accessibility }
    });

  } catch (error) {
    console.error('Update accessibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating accessibility settings'
    });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('dashboardData.enrolledCourses.course')
      .populate('dashboardData.skillPosts')
      .populate('dashboardData.certificates.course')
      .populate('recommendedCourses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate additional dashboard metrics
    const totalCourses = user.dashboardData.enrolledCourses.length;
    const completedCourses = user.dashboardData.certificates.length;
    const totalSkillPosts = user.dashboardData.skillPosts.length;
    const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

    const dashboardData = {
      user: {
        name: user.name,
        role: user.role,
        xp: user.xp,
        credits: user.credits,
        badges: user.badges,
        isPeerMentor: user.isPeerMentor
      },
      stats: {
        totalCourses,
        completedCourses,
        totalSkillPosts,
        completionRate: Math.round(completionRate * 100) / 100,
        feedbackScore: user.dashboardData.feedbackScore || 0
      },
      enrolledCourses: user.dashboardData.enrolledCourses,
      skillPosts: user.dashboardData.skillPosts,
      certificates: user.dashboardData.certificates,
      recommendedCourses: user.recommendedCourses
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats from related collections
    const skillPostsCount = await SkillPost.countDocuments({ user: req.userId });
    const coursesCount = await Course.countDocuments({ teacher: req.userId });

    const stats = {
      xp: user.xp,
      credits: user.credits,
      badges: user.badges.length,
      avatarsUnlocked: user.avatarsUnlocked.length,
      skillQuests: user.skillQuests.length,
      completedQuests: user.skillQuests.filter(quest => quest.completed).length,
      skillPosts: skillPostsCount,
      coursesCreated: coursesCount,
      lastLogin: user.lastLogin,
      memberSince: user.createdAt
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// @desc    Update user interests
// @route   PUT /api/users/interests
// @access  Private
const updateInterests = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { interests } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.interests = interests;
    await user.save();

    res.json({
      success: true,
      message: 'Interests updated successfully',
      data: { interests: user.interests }
    });

  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating interests'
    });
  }
};

// @desc    Get user badges and achievements
// @route   GET /api/users/badges
// @access  Private
const getBadges = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const badgesData = {
      badges: user.badges,
      avatarsUnlocked: user.avatarsUnlocked,
      skillQuests: user.skillQuests,
      isPeerMentor: user.isPeerMentor,
      totalBadges: user.badges.length,
      totalAvatars: user.avatarsUnlocked.length,
      completedQuests: user.skillQuests.filter(quest => quest.completed).length
    };

    res.json({
      success: true,
      data: badgesData
    });

  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching badges'
    });
  }
};

// @desc    Get user skill progress
// @route   GET /api/users/skills
// @access  Private
const getSkills = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skillsData = {
      concentrations: user.concentrations,
      totalConcentrations: user.concentrations.length,
      totalProgress: user.concentrations.reduce((total, concentration) => {
        const concentrationProgress = concentration.treeProgress.reduce((sum, node) => {
          return sum + (node.progressPercent || 0);
        }, 0);
        return total + concentrationProgress;
      }, 0)
    };

    res.json({
      success: true,
      data: skillsData
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching skills'
    });
  }
};

// @desc    Update user concentrations
// @route   PUT /api/users/concentrations
// @access  Private
const updateConcentrations = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { concentrations } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.concentrations = concentrations;
    await user.save();

    res.json({
      success: true,
      message: 'Concentrations updated successfully',
      data: { concentrations: user.concentrations }
    });

  } catch (error) {
    console.error('Update concentrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating concentrations'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any active courses or skill posts
    const activeCourses = await Course.countDocuments({ teacher: req.userId });
    const activeSkillPosts = await SkillPost.countDocuments({ user: req.userId });

    if (activeCourses > 0 || activeSkillPosts > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active courses or skill posts. Please contact support.'
      });
    }

    // Delete user account
    await User.findByIdAndDelete(req.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAccessibility,
  getDashboard,
  getStats,
  updateInterests,
  getBadges,
  getSkills,
  updateConcentrations,
  deleteAccount
}; 