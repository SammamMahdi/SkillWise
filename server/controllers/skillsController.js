const SkillPost = require('../models/SkillPost');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get all skill posts with filtering
const getSkillPosts = async (req, res) => {
  try {
    const { type, pricing, level, skillTag, page = 1, limit = 12 } = req.query;
    
    let filter = { isApproved: true };
    
    if (type) filter.type = type;
    if (pricing) filter.pricing = pricing;
    if (level) filter.level = level;
    if (skillTag) filter.skillTags = { $in: [skillTag] };

    const skillPosts = await SkillPost.find(filter)
      .populate('user', 'name avatarUrl email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SkillPost.countDocuments(filter);

    res.json({
      success: true,
      data: {
        skillPosts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching skill posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skill posts'
    });
  }
};

// Get user's skill posts
const getMySkillPosts = async (req, res) => {
  try {
    const skillPosts = await SkillPost.find({ user: req.user.id })
      .populate('user', 'name avatarUrl email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: skillPosts
    });
  } catch (error) {
    console.error('Error fetching user skill posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your skill posts'
    });
  }
};

// Create new skill post
const createSkillPost = async (req, res) => {
  try {
    console.log('Create skill post request:', {
      body: req.body,
      files: req.files ? req.files.length : 0,
      user: req.user?.id || req.user?._id,
      headers: Object.keys(req.headers)
    });

    // Check if user is authenticated
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in again.',
        error: 'User authentication failed'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
        location: err.location
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: formattedErrors,
        details: formattedErrors.map(err => `${err.field}: ${err.message}`).join(', ')
      });
    }

    const {
      title,
      description,
      type,
      pricing,
      level,
      skillTags,
      barterRequest,
      priceAmount,
      videoIntro
    } = req.body;

    // Validate required fields manually
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be at least 3 characters long'
      });
    }

    if (!description || description.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be at least 5 characters long'
      });
    }

    if (!type || !['offer', 'request'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "offer" or "request"'
      });
    }

    if (!pricing || !['free', 'barter', 'paid'].includes(pricing)) {
      return res.status(400).json({
        success: false,
        message: 'Pricing must be "free", "barter", or "paid"'
      });
    }

    // Handle uploaded images
    const images = req.files ? req.files.map(file => file.filename) : [];
    console.log('Uploaded images:', images);

    // Parse skillTags if it's a string
    let parsedSkillTags = skillTags;
    if (typeof skillTags === 'string') {
      try {
        parsedSkillTags = JSON.parse(skillTags);
      } catch (e) {
        parsedSkillTags = [skillTags];
      }
    }

    if (!parsedSkillTags || (Array.isArray(parsedSkillTags) && parsedSkillTags.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill tag is required'
      });
    }

    const userId = req.user.id || req.user._id;
    const skillPost = new SkillPost({
      user: userId,
      title: title.trim(),
      description: description.trim(),
      type,
      pricing,
      level: level || undefined,
      skillTags: Array.isArray(parsedSkillTags) ? parsedSkillTags : [parsedSkillTags],
      barterRequest: barterRequest || undefined,
      priceAmount: priceAmount ? parseFloat(priceAmount) : undefined,
      videoIntro: videoIntro || undefined,
      images,
      isApproved: true // Auto-approve for now
    });

    console.log('Creating skill post:', {
      user: userId,
      title,
      type,
      pricing,
      skillTagsCount: skillPost.skillTags.length
    });

    await skillPost.save();
    await skillPost.populate('user', 'name avatarUrl email');

    console.log('Skill post created successfully:', skillPost._id);

    res.status(201).json({
      success: true,
      data: skillPost,
      message: 'Skill post created successfully'
    });
  } catch (error) {
    console.error('Error creating skill post:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating skill post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

// Update skill post
const updateSkillPost = async (req, res) => {
  try {
    const skillPost = await SkillPost.findById(req.params.id);
    
    if (!skillPost) {
      return res.status(404).json({
        success: false,
        message: 'Skill post not found'
      });
    }

    // Check if user owns the post
    if (skillPost.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    Object.assign(skillPost, req.body);
    await skillPost.save();
    await skillPost.populate('user', 'name avatarUrl email');

    res.json({
      success: true,
      data: skillPost,
      message: 'Skill post updated successfully'
    });
  } catch (error) {
    console.error('Error updating skill post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating skill post'
    });
  }
};

// Delete skill post
const deleteSkillPost = async (req, res) => {
  try {
    const skillPost = await SkillPost.findById(req.params.id);
    
    if (!skillPost) {
      return res.status(404).json({
        success: false,
        message: 'Skill post not found'
      });
    }

    // Check if user owns the post
    if (skillPost.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await SkillPost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Skill post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting skill post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting skill post'
    });
  }
};

// Add review to skill post
const addReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const skillPost = await SkillPost.findById(req.params.id);
    
    if (!skillPost) {
      return res.status(404).json({
        success: false,
        message: 'Skill post not found'
      });
    }

    // Check if user already reviewed this post
    const existingReview = skillPost.reviews.find(
      review => review.reviewer.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this skill post'
      });
    }

    const { rating, comment } = req.body;

    skillPost.reviews.push({
      reviewer: req.user.id,
      rating,
      comment
    });

    await skillPost.save();
    await skillPost.populate('reviews.reviewer', 'name avatarUrl');

    res.json({
      success: true,
      data: skillPost,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
};

// Get skill of the month
const getSkillOfMonth = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('enrolledCourses.course');
    
    if (!user || !user.enrolledCourses.length) {
      return res.json({
        success: true,
        data: { skill: 'General Learning' }
      });
    }

    // Get the top course (first one) and its first tag
    const topCourse = user.enrolledCourses[0].course;
    const skillOfMonth = topCourse?.tags?.[0] || 'General Learning';

    res.json({
      success: true,
      data: { skill: skillOfMonth }
    });
  } catch (error) {
    console.error('Error getting skill of month:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting skill of month'
    });
  }
};

module.exports = {
  getSkillPosts,
  getMySkillPosts,
  createSkillPost,
  updateSkillPost,
  deleteSkillPost,
  addReview,
  getSkillOfMonth
};
