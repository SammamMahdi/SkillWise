const express = require('express');
const router = express.Router();
const {
  initializeSkills,
  getAllSkills,
  getUserSkillPreferences,
  saveUserSkillPreferences,
  calculateSkillConnections
} = require('../controllers/skillConnectController');
const { protect } = require('../middleware/auth');

// Initialize skills data (admin only)
router.post('/initialize', protect, async (req, res) => {
  try {
    // Check if user is admin or superuser
    if (req.user.role !== 'Admin' && !req.user.isSuperUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const result = await initializeSkills();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all available skills
router.get('/skills', protect, getAllSkills);

// Get user's skill preferences
router.get('/preferences', protect, getUserSkillPreferences);

// Save user's skill preferences
router.post('/preferences', protect, saveUserSkillPreferences);

// Get skill-based connections for the user
router.get('/connections', protect, calculateSkillConnections);

module.exports = router;
