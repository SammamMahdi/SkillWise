const express = require('express');
const { body, param } = require('express-validator');
const examController = require('../controllers/examController');
const reAttemptController = require('../controllers/reAttemptController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Validation middleware for exam creation
const validateExamCreation = [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('title')
    .notEmpty()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('timeLimit')
    .isInt({ min: 5, max: 300 })
    .withMessage('Time limit must be between 5 and 300 minutes'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.questionText')
    .notEmpty()
    .withMessage('Question text is required'),
  body('questions.*.type')
    .isIn(['mcq', 'short_answer', 'essay'])
    .withMessage('Question type must be mcq, short_answer, or essay'),
  body('questions.*.points')
    .isInt({ min: 1 })
    .withMessage('Question points must be at least 1')
];

// Teacher routes
router.post('/', validateExamCreation, examController.createExam);
router.get('/my-exams', examController.getTeacherExams);

router.put('/:id/publish', examController.publishExam);

// Admin routes


// Student routes
router.get('/available', examController.getAvailableExams);
router.get('/course/:courseId', [
  param('courseId').isMongoId().withMessage('Valid course ID is required')
], examController.getCourseExams);
router.post('/:id/start', [
  param('id').isMongoId().withMessage('Valid exam ID is required')
], examController.startExamAttempt);

// Exam attempt routes
router.put('/attempts/:attemptId/submit', [
  param('attemptId').isMongoId().withMessage('Valid attempt ID is required'),
  body('answers').isArray().withMessage('Answers must be an array')
], examController.submitExamAttempt);

router.post('/attempts/:attemptId/violation', [
  param('attemptId').isMongoId().withMessage('Valid attempt ID is required'),
  body('type')
    .isIn(['tab_switch', 'copy_paste', 'right_click', 'fullscreen_exit', 'suspicious_activity'])
    .withMessage('Invalid violation type')
], examController.recordViolation);

// Review and grading routes (Teacher/Admin only)
router.get('/attempts/pending-review', examController.getPendingReviewAttempts);
router.get('/attempts/:attemptId/review', examController.getAttemptForReview);
router.put('/attempts/:attemptId/publish-score', [
  param('attemptId').isMongoId().withMessage('Valid attempt ID is required'),
  body('finalScore').optional().isNumeric().withMessage('Final score must be a number'),
  body('feedback').optional().trim().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters')
], examController.publishExamScore);

// Student attempt details route
router.get('/attempts/:attemptId/details', [
  param('attemptId').isMongoId().withMessage('Valid attempt ID is required')
], examController.getAttemptDetails);

// Student results review route
router.get('/attempts/:attemptId/results', examController.getExamResults);

// Test notification endpoint (for debugging)
router.post('/test-notification', examController.testNotification);

// Debug admin submissions endpoint (for debugging)
router.get('/debug/admin-submissions', examController.debugAdminSubmissions);



// Debug all exams endpoint (for debugging)
router.get('/debug/all-exams', examController.debugAllExams);

// Debug attempt data endpoint (for debugging)
router.get('/debug/attempt/:attemptId', [
  param('attemptId').isMongoId().withMessage('Valid attempt ID is required')
], examController.debugAttemptData);

// Re-attempt request routes
router.post('/re-attempt-request', [
  body('attemptId')
    .isMongoId()
    .withMessage('Valid attempt ID is required'),
  body('violationType')
    .isIn(['tab_switching', 'copy_paste', 'right_click', 'fullscreen_exit', 'webcam_violation', 'time_exceeded', 'multiple_violations', 'other'])
    .withMessage('Valid violation type is required'),
  body('violationDetails')
    .notEmpty()
    .trim()
    .withMessage('Violation details are required'),
  body('studentMessage')
    .notEmpty()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters')
], reAttemptController.submitReAttemptRequest);

router.get('/re-attempt-requests', reAttemptController.getReAttemptRequests);

router.put('/re-attempt-requests/:requestId', [
  param('requestId')
    .isMongoId()
    .withMessage('Valid request ID is required'),
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be approve or reject'),
  body('response')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Response must be less than 300 characters')
], reAttemptController.reviewReAttemptRequest);

// Contact creator route
router.post('/contact-creator', [
  body('examId')
    .isMongoId()
    .withMessage('Valid exam ID is required'),
  body('reason')
    .isIn(['missed_deadline', 'technical_issues', 'personal_emergency', 'want_retake', 'misunderstood_content', 'other'])
    .withMessage('Valid reason is required'),
  body('message')
    .notEmpty()
    .trim()
    .isLength({ min: 20, max: 500 })
    .withMessage('Message must be between 20 and 500 characters')
], examController.contactCreator);

module.exports = router;
