const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Get all users (Admin only)
router.get('/users', adminController.getAllUsers);

// Update user role (Admin only)
router.put('/users/:userId/role', [
  body('role')
    .isIn(['Admin', 'Student', 'Teacher', 'Child'])
    .withMessage('Role must be one of: Admin, Student, Teacher, Child')
], adminController.updateUserRole);

// Block/Unblock user account (Admin only)
router.put('/users/:userId/block', [
  body('isBlocked')
    .isBoolean()
    .withMessage('isBlocked must be a boolean'),
  body('reason')
    .optional()
    .isString()
    .custom((value) => {
      if (value && value.trim().length === 0) {
        throw new Error('Reason cannot be empty if provided');
      }
      if (value && value.length > 500) {
        throw new Error('Reason must be less than 500 characters');
      }
      return true;
    })
], adminController.toggleUserBlock);

// Get admin statistics
router.get('/stats', adminController.getAdminStats);

// Get pending parental approvals
router.get('/pending-approvals', adminController.getPendingApprovals);

module.exports = router; 