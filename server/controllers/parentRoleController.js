const User = require('../models/User');

// Simple controller to handle parent role requests
const parentRoleController = {
  // Request parent role - simple version that just makes user a parent
  async requestParentRole(req, res) {
    try {
      console.log('🟢 Parent role request received');
      console.log('User ID:', req.userId);
      console.log('Request body:', req.body);

      const userId = req.userId;
      const { phoneNumber } = req.body;

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

      // Check if user is eligible (25+ and not already a parent)
      if (user.age < 25) {
        console.log('❌ User too young');
        return res.status(400).json({
          success: false,
          message: 'You must be at least 25 years old to become a parent'
        });
      }

      if (user.role === 'Parent') {
        console.log('❌ User already a parent');
        return res.status(400).json({
          success: false,
          message: 'You are already a parent'
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

      console.log('✅ User is eligible, updating to parent role...');

      // Update user to parent role
      user.role = 'Parent';
      user.phoneNumber = phoneNumber.trim();
      await user.save();

      console.log('🎉 Successfully updated user to parent role');
      console.log('Updated user:', {
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber
      });

      // Return success with updated user data
      res.json({
        success: true,
        message: 'Successfully assigned parent role!',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            age: user.age
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in parent role request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = parentRoleController;
