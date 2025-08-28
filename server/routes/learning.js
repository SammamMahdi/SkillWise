const express = require('express');
const { body } = require('express-validator');
const learningController = require('../controllers/learningController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { checkChildRestrictions } = require('../middleware/childRestrictions');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Get learning dashboard data (allow for all users)
router.get('/dashboard', learningController.getLearningDashboard);

// Course enrollment (child accounts need childlock password)
router.post('/courses/:courseId/enroll', checkChildRestrictions('course_enrollment'), learningController.enrollInCourse);
router.delete('/courses/:courseId/enroll', checkChildRestrictions('course_enrollment'), learningController.unenrollFromCourse);

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

// NEW: Lecture progress tracking routes
router.put('/courses/:courseId/lectures/:lectureIndex/progress', [
  body('videoProgress')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Video progress must be between 0 and 100'),
  body('videoWatched')
    .optional()
    .isBoolean()
    .withMessage('Video watched must be a boolean'),
  body('pdfRead')
    .optional()
    .isBoolean()
    .withMessage('PDF read must be a boolean'),
  body('pdfPagesRead')
    .optional()
    .isInt({ min: 0 })
    .withMessage('PDF pages read must be a non-negative integer'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
], learningController.updateLectureProgress);

router.get('/courses/:courseId/lectures/:lectureIndex/progress', learningController.getLectureProgress);

// Auto Quiz attempt save (stores in user.extradictionary2)
router.post('/courses/:courseId/lectures/:lectureIndex/auto-quiz', learningController.saveAutoQuizAttempt);

// NEW: Course progress overview
router.get('/courses/:courseId/progress', learningController.getCourseProgress);



// Get user certificates
router.get('/certificates', learningController.getUserCertificates);

// Get user skill posts
router.get('/skill-posts', learningController.getUserSkillPosts);

module.exports = router;
