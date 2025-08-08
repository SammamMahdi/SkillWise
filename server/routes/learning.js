const express = require('express');
const { body } = require('express-validator');
const learningController = require('../controllers/learningController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Get learning dashboard data
router.get('/dashboard', learningController.getLearningDashboard);

// Get enrolled course details
router.get('/courses/:courseId', learningController.getEnrolledCourseDetails);

// Update course progress
router.put('/courses/:courseId/progress', [
  body('completedLectures')
    .optional()
    .isArray()
    .withMessage('Completed lectures must be an array'),
  body('completedLectures.*')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Completed lecture indices must be non-negative integers'),
  body('completedQuizzes')
    .optional()
    .isArray()
    .withMessage('Completed quizzes must be an array'),
  body('completedQuizzes.*')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Completed quiz indices must be non-negative integers'),
  body('currentLectureIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current lecture index must be a non-negative integer')
], learningController.updateCourseProgress);

// Get user certificates
router.get('/certificates', learningController.getUserCertificates);

// Get user skill posts
router.get('/skill-posts', learningController.getUserSkillPosts);

module.exports = router;
