const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Teachers only)
const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if user is a teacher
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create courses'
      });
    }

    const {
      title,
      description,
      tags,
      prerequisites,
      price,
      lectures,
      flashcards,
      greenScore
    } = req.body;

    // Create new course
    const course = new Course({
      title,
      description,
      teacher: req.userId,
      tags: tags || [],
      prerequisites: prerequisites || [],
      price: price || 0,
      lectures: lectures || [],
      flashcards: flashcards || [],
      greenScore: greenScore || 0,
      updatedAt: new Date()
    });

    await course.save();

    // Populate teacher information
    await course.populate('teacher', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
};

// @desc    Get all courses (with optional search and filters)
// @route   GET /api/courses
// @access  Public
const getAllCourses = async (req, res) => {
  try {
    const {
      search,
      tags,
      minPrice,
      maxPrice,
      teacher,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by teacher
    if (teacher) {
      query.teacher = teacher;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCourses: total,
          hasNextPage: skip + courses.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('teacher', 'name email')
      .populate('prerequisites', 'title description');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course owner only)
const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.userId;

    // Find course and check ownership
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own courses'
      });
    }

    // Update course fields
    const updateFields = req.body;
    updateFields.updatedAt = new Date();

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('teacher', 'name email');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course owner only)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find course and check ownership
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own courses'
      });
    }

    // Check if there are enrolled students
    const enrolledStudents = await User.countDocuments({
      'dashboardData.enrolledCourses.course': id
    });

    if (enrolledStudents > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course. ${enrolledStudents} student(s) are currently enrolled.`
      });
    }

    await Course.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course'
    });
  }
};

// @desc    Search courses
// @route   GET /api/courses/search
// @access  Public
const searchCourses = async (req, res) => {
  try {
    const {
      q,
      category,
      difficulty,
      priceRange,
      duration,
      sortBy = 'relevance',
      page = 1,
      limit = 12
    } = req.query;

    // Build search query
    const query = {};

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.tags = { $in: [category] };
    }

    // Difficulty filter (assuming difficulty is stored in tags or as a field)
    if (difficulty) {
      query.tags = { $in: [difficulty] };
    }

    // Price range filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      query.price = {};
      if (min !== undefined) query.price.$gte = min;
      if (max !== undefined) query.price.$lte = max;
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      case 'price_low':
        sort.price = 1;
        break;
      case 'price_high':
        sort.price = -1;
        break;
      case 'title':
        sort.title = 1;
        break;
      default:
        // Default relevance sorting (could be based on popularity, ratings, etc.)
        sort.createdAt = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCourses: total,
          hasNextPage: skip + courses.length < total,
          hasPrevPage: parseInt(page) > 1
        },
        searchQuery: q,
        filters: { category, difficulty, priceRange, duration }
      }
    });

  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching courses'
    });
  }
};

// @desc    Get courses by teacher
// @route   GET /api/courses/teacher/:teacherId
// @access  Public
const getCoursesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher') {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get courses by teacher
    const courses = await Course.find({ teacher: teacherId })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Course.countDocuments({ teacher: teacherId });

    res.json({
      success: true,
      data: {
        courses,
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCourses: total,
          hasNextPage: skip + courses.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get courses by teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher courses'
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/:id/stats
// @access  Private (Course owner only)
const getCourseStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find course and check ownership
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view stats for your own courses'
      });
    }

    // Get enrollment statistics
    const enrolledStudents = await User.countDocuments({
      'dashboardData.enrolledCourses.course': id
    });

    // Get completion statistics
    const completedStudents = await User.countDocuments({
      'dashboardData.certificates.course': id
    });

    // Calculate completion rate
    const completionRate = enrolledStudents > 0 ? (completedStudents / enrolledStudents) * 100 : 0;

    res.json({
      success: true,
      data: {
        courseId: id,
        enrolledStudents,
        completedStudents,
        completionRate: Math.round(completionRate * 100) / 100,
        totalLectures: course.lectures.length,
        averageRating: 0, // TODO: Implement rating system
        totalRevenue: 0 // TODO: Implement payment system
      }
    });

  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course statistics'
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  searchCourses,
  getCoursesByTeacher,
  getCourseStats
};
