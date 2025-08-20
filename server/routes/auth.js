const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Registration route with validation
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('age')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Age must be between 5 and 120')
], authLimiter, authController.register);

// Login route
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], authLimiter, authController.login);

// Google OAuth routes (without rate limiting to avoid CORS issues)
router.post('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Handle OPTIONS requests for Google auth endpoints
router.options('/google', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
});
router.options('/google/callback', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// Password reset routes
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], authLimiter, authController.forgotPassword);

router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], authLimiter, authController.resetPassword);

// Change password route (requires authentication)
router.post('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], authController.changePassword);

// Refresh token route
router.post('/refresh-token', authController.refreshToken);

// Logout route
router.post('/logout', authController.logout);

// Verify email route
router.get('/verify-email/:token', authController.verifyEmail);

// Basic invitation token validation (can be kept for future use)
router.get('/validate-invitation', authController.validateInvitation);

// Convert to child role (requires authentication and age 25+)
router.post('/convert-to-child', [
  body('childLockPassword')
    .isLength({ min: 6 })
    .withMessage('Child lock password must be at least 6 characters long'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 digits')
], protect, authController.convertToChildRole);

module.exports = router; 