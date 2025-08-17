const express = require('express');
const { body, query } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

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
