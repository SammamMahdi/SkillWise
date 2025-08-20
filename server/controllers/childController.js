const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// @desc    Convert user to child role (for users 25+)
// @route   POST /api/child/convert
// @access  Private
const convertToChildRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const { childLockPassword, phoneNumber } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is eligible (25+ and not already a child)
    if (user.age < 25) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 25 years old to convert to child account'
      });
    }

    if (user.role === 'Child') {
      return res.status(400).json({
        success: false,
        message: 'You already have a child account'
      });
    }

    // Validate inputs
    if (!childLockPassword || childLockPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Child lock password must be at least 6 characters long'
      });
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (at least 10 digits)'
      });
    }

    // Hash the child lock password
    const hashedChildLockPassword = await bcrypt.hash(childLockPassword, 12);

    // Update user to child role
    user.role = 'Child';
    user.childLockPassword = hashedChildLockPassword;
    user.childLockPhoneNumber = phoneNumber.trim();
    await user.save();

    res.json({
      success: true,
      message: 'Successfully converted to child account',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          age: user.age
        }
      }
    });

  } catch (error) {
    console.error('Convert to child role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while converting to child account'
    });
  }
};

// @desc    Verify child lock password
// @route   POST /api/child/verify-lock
// @access  Private (Child only)
const verifyChildLock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const { childLockPassword } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a child
    if (user.role !== 'Child') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for child accounts'
      });
    }

    // Verify child lock password
    const isValidPassword = await bcrypt.compare(childLockPassword, user.childLockPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid child lock password'
      });
    }

    res.json({
      success: true,
      message: 'Child lock password verified successfully'
    });

  } catch (error) {
    console.error('Verify child lock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying child lock password'
    });
  }
};

// @desc    Update child lock password
// @route   PUT /api/child/update-lock
// @access  Private (Child only)
const updateChildLock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a child
    if (user.role !== 'Child') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for child accounts'
      });
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.childLockPassword);
    if (!isValidCurrentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.childLockPassword = hashedNewPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Child lock password updated successfully'
    });

  } catch (error) {
    console.error('Update child lock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating child lock password'
    });
  }
};

module.exports = {
  convertToChildRole,
  verifyChildLock,
  updateChildLock
};
