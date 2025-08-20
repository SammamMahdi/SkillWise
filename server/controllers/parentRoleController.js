const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Controller to handle child role requests (become-parent converts to Child role)
const parentRoleController = {
  // Request child role - converts user to child account with childlock protection
  async requestParentRole(req, res) {
    try {
      console.log('🟢 Child role request received (become-parent conversion)');
      console.log('User ID:', req.userId);
      console.log('Request body:', req.body);

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.userId;
      const { phoneNumber, childLockPassword } = req.body;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('👤 Current user:', {
        name: user.name,
        email: user.email,
        age: user.age,
        role: user.role
      });

      // Check if user is eligible (25+ and not already a child)
      if (user.age < 25) {
        console.log('❌ User too young');
        return res.status(400).json({
          success: false,
          message: 'You must be at least 25 years old to become a child account'
        });
      }

      if (user.role === 'Child') {
        console.log('❌ User already a child account');
        return res.status(400).json({
          success: false,
          message: 'You already have a child account'
        });
      }

      // Validate phone number (basic validation)
      if (!phoneNumber || phoneNumber.trim().length < 10) {
        console.log('❌ Invalid phone number');
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number'
        });
      }

      // Validate child lock password
      if (!childLockPassword || childLockPassword.length < 6) {
        console.log('❌ Invalid child lock password');
        return res.status(400).json({
          success: false,
          message: 'Child lock password must be at least 6 characters long'
        });
      }

      console.log('✅ User is eligible, converting to child role...');

      // Hash the child lock password
      const hashedChildLockPassword = await bcrypt.hash(childLockPassword, 12);

      // Update user to child role
      user.role = 'Child';
      user.childLockPhoneNumber = phoneNumber.trim();
      user.childLockPassword = hashedChildLockPassword;
      await user.save();

      console.log('🎉 Successfully converted user to child account');
      console.log('Updated user:', {
        name: user.name,
        role: user.role,
        phoneNumber: user.childLockPhoneNumber
      });

      // Return success with updated user data
      res.json({
        success: true,
        message: 'Successfully converted to child account! You now have childlock protection.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.childLockPhoneNumber,
            age: user.age
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in child role conversion:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = parentRoleController;
