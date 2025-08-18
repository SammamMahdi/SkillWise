const express = require('express');
const { body, query } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Helper middleware to check specific email access for payment code management
const requirePaymentCodeAccess = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has the authorized email
    if (user.email !== 'husnainfarhan@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access payment code management.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Payment code access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during access validation'
    });
  }
};

// Wallet routes
router.post('/wallet/activate', paymentController.activateWallet);
router.get('/wallet', paymentController.getWallet);

// Code redemption
router.post('/redeem', [
  body('code')
    .notEmpty()
    .trim()
    .matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    .withMessage('Invalid code format. Code should be in format: XXXX-XXXX-XXXX')
], paymentController.redeemCode);

// Admin routes for payment code management
router.post('/admin/generate-codes', requirePaymentCodeAccess, [
  body('amount')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Amount must be between 1 and 10,000 credits'),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100 codes'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
], paymentController.generateCodes);

router.get('/admin/codes', requirePaymentCodeAccess, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['all', 'active', 'redeemed'])
    .withMessage('Status must be one of: all, active, redeemed')
], paymentController.getPaymentCodes);

router.get('/admin/codes/stats', requirePaymentCodeAccess, paymentController.getCodeStats);

// Transaction history
router.get('/transactions', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['credit', 'debit', 'refund', 'bonus'])
    .withMessage('Type must be one of: credit, debit, refund, bonus')
], paymentController.getTransactions);

module.exports = router;
