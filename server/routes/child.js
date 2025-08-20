const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const childController = require('../controllers/childController');

// @desc    Convert user to child role (for users 25+)
// @route   POST /api/child/convert
// @access  Private
router.post('/convert', protect, [
  body('childLockPassword')
    .isLength({ min: 6 })
    .withMessage('Child lock password must be at least 6 characters long'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 digits')
], childController.convertToChildRole);

// @desc    Verify child lock password
// @route   POST /api/child/verify-lock
// @access  Private (Child only)
router.post('/verify-lock', protect, [
  body('childLockPassword')
    .notEmpty()
    .withMessage('Child lock password is required')
], childController.verifyChildLock);

// @desc    Update child lock password
// @route   PUT /api/child/update-lock
// @access  Private (Child only)
router.put('/update-lock', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], childController.updateChildLock);

module.exports = router;
