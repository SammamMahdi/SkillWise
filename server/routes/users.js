const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth'); // <-- NEW
const { updateAvatar, updateCover } = require('../controllers/userController');
// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update profile information
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('preferredLanguage')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Language code must be between 2 and 10 characters'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  body('interests.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each interest must be between 1 and 50 characters'),
  body('accessibility.fontSize')
    .optional()
    .isIn(['14px', '16px', '18px', '20px', '22px'])
    .withMessage('Font size must be one of: 14px, 16px, 18px, 20px, 22px'),
  body('accessibility.accentColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Accent color must be a valid hex color'),
  body('role')
    .optional()
    .isIn(['Student', 'Teacher', 'Parent', 'Admin'])
    .withMessage('Role must be one of: Student, Teacher, Parent, Admin'),
  body('profilePhoto')
    .optional()
    .isURL()
    .withMessage('Profile photo must be a valid URL')
], userController.updateProfile);

// Update accessibility settings
router.put('/accessibility', [
  body('fontSize')
    .isIn(['14px', '16px', '18px', '20px', '22px'])
    .withMessage('Font size must be one of: 14px, 16px, 18px, 20px, 22px'),
  body('colorMode')
    .isIn(['light', 'dark', 'highContrast'])
    .withMessage('Color mode must be light, dark, or highContrast')
], userController.updateAccessibility);

// Get user dashboard data
router.get('/dashboard', userController.getDashboard);

// Get user statistics
router.get('/stats', userController.getStats);

// Update user interests
router.put('/interests', [
  body('interests')
    .isArray({ min: 1 })
    .withMessage('At least one interest is required'),
  body('interests.*')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each interest must be between 1 and 50 characters')
], userController.updateInterests);

// Get user badges and achievements
router.get('/badges', userController.getBadges);

// Get user skill progress
router.get('/skills', userController.getSkills);

// Update user concentrations
router.put('/concentrations', [
  body('concentrations')
    .isArray()
    .withMessage('Concentrations must be an array'),
  body('concentrations.*.key')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Concentration key must be between 1 and 100 characters'),
  body('concentrations.*.treeProgress')
    .optional()
    .isArray()
    .withMessage('Tree progress must be an array'),
  body('concentrations.*.treeProgress.*.node')
    .optional()
    .isString()
    .withMessage('Node must be a string'),
  body('concentrations.*.treeProgress.*.progressPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percent must be between 0 and 100')
], userController.updateConcentrations);




// --- Add these routes ---
// With protect (if you have it):
// router.post('/me/avatar', protect, upload.single('image'), updateAvatar);
// router.post('/me/cover',  protect, upload.single('image'), updateCover);

// Without protect (controller validates token itself):
router.post('/me/avatar', protect, upload.single('image'), updateAvatar);
router.post('/me/cover',  protect, upload.single('image'), updateCover);
// You can keep/export your existing routes here as well.



// Delete user account
router.delete('/account', userController.deleteAccount);

module.exports = router; 