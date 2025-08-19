const jwt = require('jsonwebtoken');
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

    console.log('User found:', { 
      id: user._id, 
      name: user.name, 
      email: user.email,
      age: user.age,
      role: user.role,
      hasPhoneNumber: !!user.phoneNumber
    });

          res.json({
        success: true,
        data: { 
          user: {
            ...user.toObject(),
            roleConfirmed: user.roleConfirmed,
            isFirstTimeUser: user.isFirstTimeUser,
            isSuperUser: user.isSuperUser
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
      username,
      dateOfBirth,
      preferredLanguage,
      interests,
      accessibility,
      profilePhoto,
      role,
      isFirstTimeUser
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
    if (username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        username: username,
        _id: { $ne: req.userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      user.username = username;
    }
    if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
      // Calculate age from date of birth
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      user.age = calculatedAge;
      console.log('Updated age from date of birth:', calculatedAge, 'for user:', user.email);
    }
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (interests) user.interests = interests;
    if (accessibility) {
      if (accessibility.fontSize) user.accessibility.fontSize = accessibility.fontSize;
      if (accessibility.accentColor) user.accessibility.accentColor = accessibility.accentColor;
    }
    if (profilePhoto) user.profilePhoto = profilePhoto;
    
    // Handle first-time user flag
    if (typeof isFirstTimeUser === 'boolean') {
      user.isFirstTimeUser = isFirstTimeUser;
    }
    
    // Only allow role updates for admins
    if (role && user.role === 'Admin') {
      user.role = role;
    }

    await user.save();

    // Check if user is now under 13 after profile update
    const isUnder13 = user.age && user.age < 13;
    if (isUnder13 && user.status === 'active') {
      console.log('User became under-13 after profile update, requires parental approval:', user.email);
      
      // Generate a temporary token for the user to submit parent email
      const jwt = require('jsonwebtoken');
      const tempToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      return res.status(403).json({
        success: false,
        message: 'Account requires parental approval',
        requiresParentalApproval: true,
        isAccountBlocked: true,
        isUnder13: true,
        status: user.status,
        blockedReason: 'Account requires parental approval for users under 13',
        tempToken: tempToken,
        userData: {
          name: user.name,
          email: user.email,
          age: user.age
        }
      });
    }

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


function getTokenFromReq(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

async function getUserFromReq(req) {
  // Use req.userId if protect middleware already set it
  if (req.userId) {
    const u = await User.findById(req.userId);
    if (u) return u;
  }

  // Fallback to verifying token here (just in case)
  const token = getTokenFromReq(req);
  if (!token) {
    const e = new Error('No token provided'); e.status = 401; throw e;
  }
  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { const e = new Error('Invalid token'); e.status = 401; throw e; }

  const user = await User.findById(decoded.id || decoded._id || decoded.userId);
  if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
  return user;
}



const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const user = await getUserFromReq(req);
    const url = `/uploads/${req.file.filename}`;
    user.avatarUrl = url;
    await user.save();
    res.json({ success: true, url });
  } catch (e) {
    console.error('updateAvatar error:', e);
    res.status(e.status || 500).json({ success: false, message: e.message || 'Server error' });
  }
};

const updateCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const user = await getUserFromReq(req);
    const url = `/uploads/${req.file.filename}`;
    user.coverUrl = url;
    await user.save();
    res.json({ success: true, url });
  } catch (e) {
    console.error('updateCover error:', e);
    res.status(e.status || 500).json({ success: false, message: e.message || 'Server error' });
  }
};

module.exports = { updateAvatar, updateCover };




// @desc    Get public user profile by handle/username
// @route   GET /api/users/public/:handle
// @access  Private
const getPublicProfile = async (req, res) => {
  try {
    const { handle } = req.params;
    const viewerId = req.userId;

    // Find target user by handle or username
    const targetUser = await User.findOne({
      $or: [
        { handle: handle.toLowerCase() },
        { username: handle.toLowerCase() }
      ]
    })
    .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -email')
    .populate('dashboardData.enrolledCourses.course')
    .populate('dashboardData.certificates.course');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get viewer to check friendship status
    const viewer = await User.findById(viewerId).select('friends role');
    if (!viewer) {
      return res.status(404).json({
        success: false,
        message: 'Viewer not found'
      });
    }

    // Check if viewer and target are friends
    const areFriends = viewer.friends.includes(targetUser._id);
    const isOwnProfile = viewerId === targetUser._id.toString();

    // Prepare public profile data
    const publicProfile = {
      _id: targetUser._id,
      name: targetUser.name,
      handle: targetUser.handle,
      username: targetUser.username,
      displayHandle: targetUser.username || targetUser.handle,
      role: targetUser.role,
      profilePhoto: targetUser.profilePhoto,
      avatarUrl: targetUser.avatarUrl,
      coverUrl: targetUser.coverUrl,
      xp: targetUser.xp,
      badges: targetUser.badges,
      interests: targetUser.interests,
      createdAt: targetUser.createdAt,
      isPeerMentor: targetUser.isPeerMentor,
      areFriends,
      isOwnProfile
    };

    // If they are friends or it's own profile, include learning progress
    if (areFriends || isOwnProfile) {
      publicProfile.dashboardData = targetUser.dashboardData;
      publicProfile.concentrations = targetUser.concentrations;
      publicProfile.skillQuests = targetUser.skillQuests;
      publicProfile.credits = targetUser.credits;
      publicProfile.avatarsUnlocked = targetUser.avatarsUnlocked;
    }

    res.json({
      success: true,
      data: { user: publicProfile }
    });

  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching public profile'
    });
  }
};

// @desc    Search users by username/handle
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const searcherId = req.userId;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = q.trim().toLowerCase();

    // Search by username, handle, or name (all users)
    const users = await User.find({
      $and: [
        { _id: { $ne: searcherId } }, // Exclude searcher
        {
          $or: [
            { username: { $regex: searchTerm, $options: 'i' } },
            { handle: { $regex: searchTerm, $options: 'i' } },
            { name: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name handle username profilePhoto avatarUrl xp badges role')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
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
  deleteAccount,
  updateAvatar,
  updateCover,
  getPublicProfile,
  searchUsers,
};