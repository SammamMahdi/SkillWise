const { validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('parent', 'name email')
      .populate('childAccounts', 'name email age dateOfBirth');

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:userId/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if current user is admin
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    user.role = role;
    user.roleConfirmed = true;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
};

// @desc    Block/Unblock user account (Admin only)
// @route   PUT /api/admin/users/:userId/block
// @access  Private (Admin)


const toggleUserBlock = async (req, res) => {
  try {
    console.log('Toggle user block request:', req.body, req.params); // Debug log

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array()); // Debug log
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if current user is admin
    const currentUser = await User.findById(req.userId);
    console.log('Current user:', currentUser ? { id: currentUser._id, role: currentUser.role } : 'Not found'); // Debug log

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found.'
      });
    }

    if (currentUser.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId } = req.params;
    const { isBlocked, reason } = req.body;

    console.log('Target user ID:', userId); // Debug log

    const user = await User.findById(userId);
    console.log('Target user found:', user ? { id: user._id, role: user.role, age: user.age, isBlocked: user.isAccountBlocked } : 'Not found'); // Debug log

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Allow blocking any student, but restrict unblocking under 13 without parental approval
    if (!isBlocked && user.role === 'Student') {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 13 && (!user.parentConfirmed || !user.parent)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot unblock a student under 13 without parental approval'
        });
      }
    }

    // Allow blocking/unblocking
    user.isAccountBlocked = isBlocked;
    user.blockedReason = isBlocked ? reason : undefined;
    await user.save();

    // Create notification
    const notification = new Notification({
      recipient: userId,
      sender: req.userId,
      type: isBlocked ? 'account_blocked' : 'account_unblocked',
      title: isBlocked ? 'Account Blocked' : 'Account Unblocked',
      message: isBlocked 
        ? `Your account has been blocked. Reason: ${reason}` 
        : 'Your account has been unblocked and is now active.',
      data: {
        reason: isBlocked ? reason : undefined
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: `User account ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { user }
    });

  } catch (error) {
    console.error('Toggle user block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user block status'
    });
  }
};


// @desc    Get user statistics for admin dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'Student' });
    const teachers = await User.countDocuments({ role: 'Teacher' });
    const parents = await User.countDocuments({ role: 'Parent' });
    const admins = await User.countDocuments({ role: 'Admin' });
    const blockedUsers = await User.countDocuments({ isAccountBlocked: true });
    const pendingApprovals = await User.countDocuments({ 
      requiresParentalApproval: true, 
      parentConfirmed: false 
    });

    // Get recent activity
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');

    const stats = {
      totalUsers,
      students,
      teachers,
      parents,
      admins,
      blockedUsers,
      pendingApprovals,
      recentUsers
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin statistics'
    });
  }
};

// @desc    Get pending parental approvals
// @route   GET /api/admin/pending-approvals
// @access  Private (Admin)
const getPendingApprovals = async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await User.findById(req.userId);
    if (!currentUser || currentUser.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const pendingUsers = await User.find({
      requiresParentalApproval: true,
      parentConfirmed: false
    })
    .populate('parent', 'name email')
    .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    res.json({
      success: true,
      data: { pendingUsers }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending approvals'
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserBlock,
  getAdminStats,
  getPendingApprovals
}; 