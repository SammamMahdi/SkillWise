const { validationResult } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const SkillPost = require('../models/SkillPost');

// @desc    Get user learning dashboard data
// @route   GET /api/learning/dashboard
// @access  Private
const getLearningDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'dashboardData.enrolledCourses.course',
        populate: {
          path: 'teacher',
          select: 'name email'
        }
      })
      .populate('dashboardData.skillPosts')
      .populate({
        path: 'dashboardData.certificates.course',
        populate: {
          path: 'teacher',
          select: 'name email'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate learning metrics
    const enrolledCourses = user.dashboardData.enrolledCourses || [];
    const certificates = user.dashboardData.certificates || [];
    const skillPosts = user.dashboardData.skillPosts || [];
    const feedbackScore = user.dashboardData.feedbackScore || 0;

    // Calculate completion rates for enrolled courses
    const coursesWithProgress = enrolledCourses.map(enrollment => {
      const course = enrollment.course;
      const totalLectures = course?.lectures?.length || 0;
      const completedLectures = enrollment.completedLectures?.length || 0;
      const progress = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

      return {
        ...enrollment.toObject(),
        progress: Math.round(progress * 100) / 100,
        totalLectures,
        completedLectures
      };
    });

    const dashboardData = {
      enrolledCourses: coursesWithProgress,
      skillPosts: skillPosts,
      certificates: certificates,
      feedbackScore: feedbackScore,
      stats: {
        totalEnrolledCourses: enrolledCourses.length,
        completedCourses: certificates.length,
        totalSkillPosts: skillPosts.length,
        averageProgress: enrolledCourses.length > 0 
          ? Math.round((coursesWithProgress.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length) * 100) / 100 
          : 0
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get learning dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching learning dashboard data'
    });
  }
};

// @desc    Enroll in a course
// @route   POST /api/learning/courses/:courseId/enroll
// @access  Private
const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    const isAlreadyEnrolled = user.dashboardData.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Add course to user's enrolled courses
    user.dashboardData.enrolledCourses.push({
      course: courseId,
      currentLectureIndex: 0,
      completedLectures: [],
      completedQuizzes: []
    });

    await user.save();

    // Populate the course data for response
    await user.populate({
      path: 'dashboardData.enrolledCourses.course',
      match: { _id: courseId },
      populate: {
        path: 'teacher',
        select: 'name email'
      }
    });

    const enrollment = user.dashboardData.enrolledCourses.find(
      enrollment => enrollment.course && enrollment.course._id.toString() === courseId
    );

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });

  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while enrolling in course'
    });
  }
};

// @desc    Unenroll from a course
// @route   DELETE /api/learning/courses/:courseId/enroll
// @access  Private
const unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find user and check enrollment
    const user = await User.findById(userId);
    const enrollmentIndex = user.dashboardData.enrolledCourses.findIndex(
      enrollment => enrollment.course.toString() === courseId
    );

    if (enrollmentIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Remove course from enrolled courses
    user.dashboardData.enrolledCourses.splice(enrollmentIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
    });

  } catch (error) {
    console.error('Unenroll from course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unenrolling from course'
    });
  }
};

// @desc    Get enrolled course details
// @route   GET /api/learning/courses/:courseId
// @access  Private
const getEnrolledCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const user = await User.findById(req.userId)
      .populate({
        path: 'dashboardData.enrolledCourses.course',
        match: { _id: courseId },
        populate: {
          path: 'teacher',
          select: 'name email'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const enrollment = user.dashboardData.enrolledCourses.find(
      enrollment => enrollment.course && enrollment.course._id.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in enrolled courses'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });

  } catch (error) {
    console.error('Get enrolled course details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course details'
    });
  }
};

// @desc    Update course progress
// @route   PUT /api/learning/courses/:courseId/progress
// @access  Private
const updateCourseProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { courseId } = req.params;
    const { completedLectures, completedQuizzes, currentLectureIndex } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const enrollmentIndex = user.dashboardData.enrolledCourses.findIndex(
      enrollment => enrollment.course.toString() === courseId
    );

    if (enrollmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in enrolled courses'
      });
    }

    // Update progress
    if (completedLectures) {
      user.dashboardData.enrolledCourses[enrollmentIndex].completedLectures = completedLectures;
    }
    if (completedQuizzes) {
      user.dashboardData.enrolledCourses[enrollmentIndex].completedQuizzes = completedQuizzes;
    }
    if (currentLectureIndex !== undefined) {
      user.dashboardData.enrolledCourses[enrollmentIndex].currentLectureIndex = currentLectureIndex;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Course progress updated successfully',
      data: user.dashboardData.enrolledCourses[enrollmentIndex]
    });

  } catch (error) {
    console.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course progress'
    });
  }
};

// @desc    Get user certificates
// @route   GET /api/learning/certificates
// @access  Private
const getUserCertificates = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'dashboardData.certificates.course',
        populate: {
          path: 'teacher',
          select: 'name email'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const certificates = user.dashboardData.certificates || [];

    res.json({
      success: true,
      data: certificates
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching certificates'
    });
  }
};

// @desc    Get user skill posts
// @route   GET /api/learning/skill-posts
// @access  Private
const getUserSkillPosts = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('dashboardData.skillPosts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const skillPosts = user.dashboardData.skillPosts || [];

    res.json({
      success: true,
      data: skillPosts
    });

  } catch (error) {
    console.error('Get skill posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching skill posts'
    });
  }
};

module.exports = {
  getLearningDashboard,
  enrollInCourse,
  unenrollFromCourse,
  getEnrolledCourseDetails,
  updateCourseProgress,
  getUserCertificates,
  getUserSkillPosts
};
