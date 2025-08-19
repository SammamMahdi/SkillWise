const express = require('express');
const { body } = require('express-validator');
const parentController = require('../controllers/parentController');
const { verifyToken } = require('../config/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.use(apiLimiter);

// Send parent request to child
router.post('/request-child', [
  body('childEmail')
    .isEmail()
    .withMessage('Please provide a valid email address')
], parentController.requestChildConnection);

// Send parent request to child by email
router.post('/request-child-by-email', [
  body('childEmail')
    .isEmail()
    .withMessage('Please provide a valid email address')
], parentController.requestChildByEmail);

// Accept parent request (by child)
router.post('/accept-request', [
  body('parentId')
    .isMongoId()
    .withMessage('Please provide a valid parent ID')
], parentController.acceptParentRequest);

// Reject parent request (by child)
router.post('/reject-request', [
  body('parentId')
    .isMongoId()
    .withMessage('Please provide a valid parent ID')
], parentController.rejectParentRequest);

// Accept child request (by parent)
router.post('/accept-child-request', [
  body('childId')
    .isMongoId()
    .withMessage('Please provide a valid child ID')
], parentController.acceptChildRequest);

// Reject child request (by parent)
router.post('/reject-child-request', [
  body('childId')
    .isMongoId()
    .withMessage('Please provide a valid child ID')
], parentController.rejectChildRequest);

// Get child accounts for parent
router.get('/children', parentController.getChildAccounts);

// Get pending parent requests for child
router.get('/pending-requests', parentController.getPendingParentRequests);

// Get all pending requests for parent
router.get('/all-pending-requests', parentController.getAllPendingRequests);

// Remove child connection (by parent)
router.delete('/children/:childId', parentController.removeChildConnection);

// Get child learning progress
router.get('/children/:childId/progress', parentController.getChildProgress);

// Approve child account (by parent)
router.post('/approve-child/:childId', parentController.approveChildAccount);

// Get pending child approval requests for parent
router.get('/pending-approvals', parentController.getPendingChildApprovals);

// NEW: Routes for under-13 parental approval
// Send parent approval request (by under-13 user)
router.post('/request', [
  body('parentEmail')
    .isEmail()
    .withMessage('Please provide a valid parent email address'),
  body('parentName')
    .notEmpty()
    .withMessage('Please provide a parent name')
], parentController.requestParentApproval);

// Get parent approval status (by under-13 user)
router.get('/approval-status', parentController.getParentApprovalStatus);

// Get children for parent dashboard
router.get('/children', parentController.getChildren);

// Request parent role - new simple endpoint
router.post('/request-role', [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 digits')
], require('../controllers/parentRoleController').requestParentRole);

module.exports = router; 