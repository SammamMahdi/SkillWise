const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Middleware to check if user is a child and restrict certain features
const checkChildRestrictions = (restrictedFeature) => {
  return async (req, res, next) => {
    try {
      // Fetch user from database using userId from auth middleware
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // If user is not a child, allow access
      if (user.role !== 'Child') {
        return next();
      }

      // Child account restrictions
      const childLockRequiredFeatures = [
        'course_enrollment', 
        'friend_requests',
        'skill_posts',
        'community_post'
      ];

      const completelyBlockedFeatures = [
        // Features that are completely blocked for children
      ];

      // If this feature is completely blocked for children
      if (completelyBlockedFeatures.includes(restrictedFeature)) {
        return res.status(403).json({
          success: false,
          message: 'This feature is not available for child accounts',
          isChildAccount: true,
          feature: restrictedFeature
        });
      }

      // If this feature requires child lock verification
      if (childLockRequiredFeatures.includes(restrictedFeature)) {
        // Check if child lock password is provided in request
        const { childLockPassword } = req.body;
        
        if (!childLockPassword) {
          return res.status(403).json({
            success: false,
            message: 'Child lock password is required to access this feature',
            requiresChildLock: true,
            feature: restrictedFeature
          });
        }

        // Verify child lock password
        const isValidPassword = await bcrypt.compare(childLockPassword, user.childLockPassword);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Invalid child lock password',
            requiresChildLock: true,
            feature: restrictedFeature
          });
        }

        // Password verified, allow access
        return next();
      }

      // For other features, child accounts are completely blocked
      return res.status(403).json({
        success: false,
        message: 'This feature is not available for child accounts',
        isChildAccount: true,
        feature: restrictedFeature
      });

    } catch (error) {
      console.error('Child restrictions check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error checking account restrictions'
      });
    }
  };
};

// Middleware to completely block child accounts from certain features
const blockChildAccounts = (feature) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (user.role === 'Child') {
      return res.status(403).json({
        success: false,
        message: 'This feature is not available for child accounts',
        isChildAccount: true,
        feature: feature
      });
    }
    
    next();
  };
};

module.exports = {
  checkChildRestrictions,
  blockChildAccounts
};
