const User = require('../models/User');
const SuperUser = require('../models/SuperUser');

// @desc    Check if user is superuser
// @route   GET /api/superuser/check
// @access  Private
const checkSuperUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user email is in SuperUser collection
    const superUser = await SuperUser.findOne({ 
      email: user.email, 
      isActive: true 
    });

    if (superUser) {
      // Update last access
      superUser.lastAccess = new Date();
      await superUser.save();

      // Update user's isSuperUser flag if not already set
      if (!user.isSuperUser) {
        user.isSuperUser = true;
        await user.save();
      }

      return res.json({
        success: true,
        isSuperUser: true,
        message: 'SuperUser access confirmed'
      });
    }

    // Remove superuser flag if user is not in SuperUser collection
    if (user.isSuperUser) {
      user.isSuperUser = false;
      await user.save();
    }

    res.json({
      success: true,
      isSuperUser: false,
      message: 'Not a superuser'
    });

  } catch (error) {
    console.error('Check superuser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking superuser status'
    });
  }
};

// @desc    Get all users for role management
// @route   GET /api/superuser/users
// @access  Private (SuperUser only)
const getAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user is superuser
    const superUser = await SuperUser.findOne({ 
      email: currentUser.email, 
      isActive: true 
    });

    if (!superUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperUser privileges required.'
      });
    }

    // Get all users with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Search functionality
    const search = req.query.search || '';
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(searchQuery)
      .select('_id name email username role createdAt lastLogin emailVerified isAccountBlocked isSuperUser')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalUsers = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Update user role
// @route   PUT /api/superuser/users/:userId/role
// @access  Private (SuperUser only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['Admin', 'Student', 'Teacher', 'Parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: Admin, Student, Teacher, Parent'
      });
    }

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current user not found'
      });
    }

    // Check if current user is superuser
    const superUser = await SuperUser.findOne({ 
      email: currentUser.email, 
      isActive: true 
    });

    if (!superUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperUser privileges required.'
      });
    }

    // Find and update target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Prevent superuser from changing their own role
    if (targetUser.email === currentUser.email) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}`,
      data: {
        userId: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        oldRole,
        newRole: role
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
};

module.exports = {
  checkSuperUser,
  getAllUsers,
  updateUserRole
};
