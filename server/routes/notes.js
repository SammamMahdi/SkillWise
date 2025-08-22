const express = require('express');
const { body, param, query } = require('express-validator');
const noteController = require('../controllers/noteController');
const { verifyToken } = require('../config/auth');

const router = express.Router();

router.use(verifyToken); // All routes require login

// Create a new note
router.post(
  '/',
  [
    body('title').notEmpty().trim().isLength({ min: 1, max: 100 }),
    body('content').notEmpty().trim(),
    body('tags').optional().isArray(),
    body('tags.*').optional().trim().isLength({ min: 1, max: 20 }),
    body('keywords').optional().isArray(),
    body('keywords.*').optional().trim().isLength({ min: 1, max: 30 }),
    body('category').optional().trim().isLength({ min: 1, max: 50 }),
    body('isPinned').optional().isBoolean(),
    body('isPublic').optional().isBoolean()
  ],
  noteController.createNote
);

// Get all notes for logged-in user with filtering and search
router.get('/', [
  query('category').optional().trim(),
  query('tag').optional().trim(),
  query('keyword').optional().trim(),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['title', 'createdAt', 'updatedAt', 'category']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], noteController.getUserNotes);

// Get note statistics
router.get('/stats', noteController.getNoteStats);

// Get a specific note by ID
router.get('/:id', [
  param('id').isMongoId()
], noteController.getNoteById);

// Update a note
router.put('/:id', [
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('content').optional().trim(),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim().isLength({ min: 1, max: 20 }),
  body('keywords').optional().isArray(),
  body('keywords.*').optional().trim().isLength({ min: 1, max: 30 }),
  body('category').optional().trim().isLength({ min: 1, max: 50 }),
  body('isPinned').optional().isBoolean(),
  body('isPublic').optional().isBoolean()
], noteController.updateNote);

// Toggle pin status
router.patch('/:id/pin', [
  param('id').isMongoId()
], noteController.togglePin);

// Delete a note by ID
router.delete('/:id', [
  param('id').isMongoId()
], noteController.deleteNote);

module.exports = router;
