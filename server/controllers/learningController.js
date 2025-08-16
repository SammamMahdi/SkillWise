const { validationResult } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const SkillPost = require('../models/SkillPost');
const LectureProgress = require('../models/LectureProgress');
const ExamAttempt = require('../models/ExamAttempt');

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
    console.log('=== ENROLL IN COURSE DEBUG ===');
    const { courseId } = req.params;
    const userId = req.userId;
    console.log('Course ID:', courseId, 'User ID:', userId);

    // Check if course exists
    const course = await Course.findById(courseId);
    console.log('Course found:', course ? { id: course._id, title: course.title } : 'null');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    console.log('User found:', user ? { id: user._id, name: user.name, dashboardData: !!user.dashboardData } : 'null');

    // Initialize dashboardData if it doesn't exist
    if (!user.dashboardData) {
      console.log('Initializing dashboardData for user');
      user.dashboardData = {
        enrolledCourses: [],
        completedCourses: [],
        certificates: [],
        skillPosts: []
      };
    }

    if (!user.dashboardData.enrolledCourses) {
      console.log('Initializing enrolledCourses array');
      user.dashboardData.enrolledCourses = [];
    }

    console.log('Current enrolled courses:', user.dashboardData.enrolledCourses.map(e => e.course));

    const isAlreadyEnrolled = user.dashboardData.enrolledCourses.some(
      enrollment => enrollment.course && enrollment.course.toString() === courseId
    );

    console.log('Is already enrolled:', isAlreadyEnrolled);

    if (isAlreadyEnrolled) {
      console.log('User already enrolled, returning 400');
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Add course to user's enrolled courses
    user.dashboardData.enrolledCourses.push({
      course: courseId,
      enrolledAt: new Date(),
      progress: {
        completedLectures: [],
        completedAssignments: [],
        overallProgress: 0
      }
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

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already enrolled
    const enrollment = user.dashboardData?.enrolledCourses?.find(
      enrollment => enrollment.course && enrollment.course.toString() === courseId
    );

    if (enrollment) {
      // Return existing enrollment
      const populatedUser = await User.findById(req.userId)
        .populate({
          path: 'dashboardData.enrolledCourses.course',
          match: { _id: courseId },
          populate: {
            path: 'teacher',
            select: 'name email'
          }
        });

      const populatedEnrollment = populatedUser.dashboardData.enrolledCourses.find(
        e => e.course && e.course._id.toString() === courseId
      );

      return res.json({
        success: true,
        data: populatedEnrollment
      });
    }

    // User is not enrolled in this course
    return res.status(404).json({
      success: false,
      message: 'Not enrolled in this course'
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
    const { 
      completedLectures, 
      completedQuizzes, 
      currentLectureIndex,
      lectureProgress,
      examAttempts 
    } = req.body;

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

    const enrollment = user.dashboardData.enrolledCourses[enrollmentIndex];

    // Update basic progress
    if (completedLectures) {
      enrollment.completedLectures = completedLectures;
    }
    if (completedQuizzes) {
      enrollment.completedQuizzes = completedQuizzes;
    }
    if (currentLectureIndex !== undefined) {
      enrollment.currentLectureIndex = currentLectureIndex;
    }

    // Update enhanced lecture progress
    if (lectureProgress && Array.isArray(lectureProgress)) {
      enrollment.lectureProgress = lectureProgress.map(progress => ({
        lectureIndex: progress.lectureIndex,
        completed: progress.completed || false,
        completedAt: progress.completed ? new Date() : undefined,
        timeSpent: progress.timeSpent || 0,
        lastAccessed: new Date()
      }));
    }

    // Update exam attempts
    if (examAttempts && Array.isArray(examAttempts)) {
      examAttempts.forEach(attempt => {
        const lectureIndex = attempt.lectureIndex;
        const existingProgress = enrollment.lectureProgress.find(p => p.lectureIndex === lectureIndex);
        
        if (existingProgress) {
          if (!existingProgress.examAttempts) {
            existingProgress.examAttempts = [];
          }
          
          existingProgress.examAttempts.push({
            examId: attempt.examId,
            attemptId: attempt.attemptId,
            score: attempt.score,
            passed: attempt.passed,
            completedAt: new Date()
          });
        }
      });
    }

    // Calculate overall progress
    const course = await Course.findById(courseId);
    if (course && course.lectures) {
      const totalLectures = course.lectures.length;
      const completedCount = enrollment.lectureProgress?.filter(p => p.completed).length || 0;
      enrollment.overallProgress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;
    }

    enrollment.lastAccessed = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Course progress updated successfully',
      data: enrollment
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

// @desc    Update lecture progress
// @route   PUT /api/learning/courses/:courseId/lectures/:lectureIndex/progress
// @access  Private
const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureIndex } = req.params;
    const { 
      videoProgress, 
      videoWatched, 
      pdfRead, 
      pdfPagesRead,
      timeSpent,
      notes 
    } = req.body;

    // Validate lecture index
    const lectureIdx = parseInt(lectureIndex);
    if (isNaN(lectureIdx) || lectureIdx < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture index'
      });
    }

    // Check if user is enrolled in the course
    const user = await User.findById(req.userId);
    const enrollment = user.dashboardData?.enrolledCourses?.find(
      e => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Course not found in enrolled courses'
      });
    }

    // Get or create lecture progress
    let lectureProgress = await LectureProgress.findOne({
      student: req.userId,
      course: courseId,
      lectureIndex: lectureIdx
    });

    if (!lectureProgress) {
      lectureProgress = new LectureProgress({
        student: req.userId,
        course: courseId,
        lectureIndex: lectureIdx,
        status: 'in_progress'
      });
    }

    // Update progress
    if (videoProgress !== undefined) {
      lectureProgress.contentProgress.videoProgress = Math.min(100, Math.max(0, videoProgress));
      if (videoProgress >= 90) { // Consider 90% as watched
        lectureProgress.contentProgress.videoWatched = true;
      }
    }

    if (videoWatched !== undefined) {
      lectureProgress.contentProgress.videoWatched = videoWatched;
    }

    if (pdfRead !== undefined) {
      lectureProgress.contentProgress.pdfRead = pdfRead;
    }

    if (pdfPagesRead !== undefined) {
      lectureProgress.contentProgress.pdfPagesRead = pdfPagesRead;
    }

    if (timeSpent !== undefined) {
      lectureProgress.contentProgress.videoTimeSpent = (lectureProgress.contentProgress.videoTimeSpent || 0) + timeSpent;
    }

    if (notes !== undefined) {
      lectureProgress.studentNotes = notes;
    }

    lectureProgress.lastAccessed = new Date();
    if (!lectureProgress.startedAt) {
      lectureProgress.startedAt = new Date();
    }

    await lectureProgress.save();

    // Update user's overall course progress
    await updateUserCourseProgress(req.userId, courseId);

    res.json({
      success: true,
      message: 'Lecture progress updated successfully',
      data: lectureProgress
    });

  } catch (error) {
    console.error('Update lecture progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lecture progress'
    });
  }
};

// @desc    Get lecture progress
// @route   GET /api/learning/courses/:courseId/lectures/:lectureIndex/progress
// @access  Private
const getLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureIndex } = req.params;
    const lectureIdx = parseInt(lectureIndex);

    if (isNaN(lectureIdx) || lectureIdx < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture index'
      });
    }

    const lectureProgress = await LectureProgress.findOne({
      student: req.userId,
      course: courseId,
      lectureIndex: lectureIdx
    });

    if (!lectureProgress) {
      return res.json({
        success: true,
        data: {
          status: 'not_started',
          contentProgress: {
            videoWatched: false,
            videoProgress: 0,
            videoTimeSpent: 0,
            pdfDownloaded: false,
            pdfRead: false,
            pdfPagesRead: 0
          },
          examProgress: {
            examId: null,
            attempts: [],
            bestScore: 0,
            totalAttempts: 0,
            passed: false
          },
          overallProgress: 0
        }
      });
    }

    res.json({
      success: true,
      data: lectureProgress
    });

  } catch (error) {
    console.error('Get lecture progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lecture progress'
    });
  }
};

// @desc    Get course progress overview
// @route   GET /api/learning/courses/:courseId/progress
// @access  Private
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get all lecture progress for this course and student
    const lectureProgress = await LectureProgress.find({
      student: req.userId,
      course: courseId
    }).sort({ lectureIndex: 1 });

    // Calculate overall progress
    const totalLectures = course.lectures.length;
    const completedLectures = lectureProgress.filter(lp => lp.status === 'completed').length;
    const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    // Get exam scores
    const examScores = await ExamAttempt.aggregate([
      {
        $match: {
          student: req.userId,
          exam: { $in: course.lectures.filter(l => l.exam).map(l => l.exam) }
        }
      },
      {
        $group: {
          _id: '$exam',
          bestScore: { $max: '$finalScore' },
          attempts: { $sum: 1 },
          passed: { $max: '$finalPassed' }
        }
      }
    ]);

    const progressData = {
      courseId,
      totalLectures,
      completedLectures,
      overallProgress,
      lectureProgress: lectureProgress.map(lp => ({
        lectureIndex: lp.lectureIndex,
        status: lp.status,
        contentProgress: lp.contentProgress,
        examProgress: lp.examProgress,
        overallProgress: lp.overallProgress,
        lastAccessed: lp.lastAccessed
      })),
      examScores
    };

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course progress'
    });
  }
};

// Helper function to update user's overall course progress
const updateUserCourseProgress = async (userId, courseId) => {
  try {
    const lectureProgress = await LectureProgress.find({
      student: userId,
      course: courseId
    });

    const totalLectures = lectureProgress.length;
    const completedLectures = lectureProgress.filter(lp => lp.status === 'completed').length;
    const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    // Update user's course progress
    await User.updateOne(
      { 
        _id: userId,
        'dashboardData.enrolledCourses.course': courseId
      },
      {
        $set: {
          'dashboardData.enrolledCourses.$.overallProgress': overallProgress,
          'dashboardData.enrolledCourses.$.lastAccessed': new Date()
        }
      }
    );
  } catch (error) {
    console.error('Error updating user course progress:', error);
  }
};

module.exports = {
  getLearningDashboard,
  enrollInCourse,
  unenrollFromCourse,
  getEnrolledCourseDetails,
  updateCourseProgress,
  getUserCertificates,
  getUserSkillPosts,
  updateLectureProgress,
  getLectureProgress,
  getCourseProgress
};
