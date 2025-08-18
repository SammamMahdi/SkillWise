const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getSkillPosts,
  getMySkillPosts,
  createSkillPost,
  updateSkillPost,
  deleteSkillPost,
  addReview,
  getSkillOfMonth
} = require('../controllers/skillsController');

// Get all skill posts with filtering
router.get('/', getSkillPosts);

// Get user's skill posts
router.get('/my-posts', protect, getMySkillPosts);

// Create new skill post
router.post('/', 
  protect,
  upload.array('images', 5), // Allow up to 5 images
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 5, max: 1000 })
      .withMessage('Description must be between 5 and 1000 characters'),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['offer', 'request'])
      .withMessage('Type must be either "offer" or "request"'),
    
    body('pricing')
      .notEmpty()
      .withMessage('Pricing is required')
      .isIn(['free', 'barter', 'paid'])
      .withMessage('Pricing must be "free", "barter", or "paid"'),
    
    body('level')
      .optional()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Level must be Beginner, Intermediate, or Advanced'),
    
    body('skillTags')
      .custom((value) => {
        if (!value) {
          throw new Error('At least one skill tag is required');
        }
        
        let tags;
        if (typeof value === 'string') {
          try {
            tags = JSON.parse(value);
          } catch (e) {
            tags = [value];
          }
        } else {
          tags = value;
        }
        
        if (!Array.isArray(tags) || tags.length === 0) {
          throw new Error('At least one skill tag is required');
        }
        
        return true;
      }),
    
    body('priceAmount')
      .optional()
      .isNumeric()
      .withMessage('Price amount must be a number')
      .custom((value, { req }) => {
        if (req.body.pricing === 'paid' && (!value || parseFloat(value) <= 0)) {
          throw new Error('Price amount is required and must be greater than 0 for paid posts');
        }
        return true;
      }),
    
    body('barterRequest')
      .optional()
      .custom((value, { req }) => {
        if (req.body.pricing === 'barter' && (!value || !value.trim())) {
          throw new Error('Barter request description is required for barter posts');
        }
        return true;
      })
  ],
  createSkillPost
);

// Update skill post
router.put('/:id', protect, updateSkillPost);

// Delete skill post
router.delete('/:id', protect, deleteSkillPost);

// Add review to skill post
router.post('/:id/review', 
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters')
  ],
  addReview
);

// Get skill of the month
router.get('/skill-of-month/:userId', getSkillOfMonth);

module.exports = router;
