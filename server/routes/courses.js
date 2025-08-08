const express = require('express');
const { body } = require('express-validator');
const courseController = require('../controllers/courseController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes (no authentication required)
router.get('/', courseController.getAllCourses);
router.get('/search', courseController.searchCourses);
router.get('/:id', courseController.getCourseById);
router.get('/teacher/:teacherId', courseController.getCoursesByTeacher);

// Protected routes (authentication required)
router.use(verifyToken);
router.use(apiLimiter);

// Course creation (Teachers only)
router.post('/', [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Course title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Course description must be between 10 and 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid prerequisite course ID'),
  body('lectures')
    .optional()
    .isArray()
    .withMessage('Lectures must be an array'),
  body('flashcards')
    .optional()
    .isArray()
    .withMessage('Flashcards must be an array'),
  body('greenScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Green score must be between 0 and 100')
], courseController.createCourse);

// Course updates (Course owner only)
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Course title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Course description must be between 10 and 2000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid prerequisite course ID'),
  body('lectures')
    .optional()
    .isArray()
    .withMessage('Lectures must be an array'),
  body('flashcards')
    .optional()
    .isArray()
    .withMessage('Flashcards must be an array'),
  body('greenScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Green score must be between 0 and 100')
], courseController.updateCourse);

// Course deletion (Course owner only)
router.delete('/:id', courseController.deleteCourse);

// Course statistics (Course owner only)
router.get('/:id/stats', courseController.getCourseStats);

module.exports = router;
