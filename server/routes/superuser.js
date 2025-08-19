const express = require('express');
const { body } = require('express-validator');
const superUserController = require('../controllers/superUserController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Check if current user is superuser
router.get('/check', superUserController.checkSuperUser);

// Get all users for role management
router.get('/users', superUserController.getAllUsers);

// Update user role
router.put('/users/:userId/role', [
  body('role')
    .isIn(['Admin', 'Student', 'Teacher', 'Parent'])
    .withMessage('Role must be one of: Admin, Student, Teacher, Parent')
], superUserController.updateUserRole);

module.exports = router;
