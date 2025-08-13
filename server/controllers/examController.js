const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ExamReAttemptRequest = require('../models/ExamReAttemptRequest');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Create new exam (Teachers and Admins for their courses)
// @route   POST /api/exams
// @access  Private (Teacher/Admin)
const createExam = async (req, res) => {
  try {
    console.log('=== CREATE EXAM DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.userId);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const { courseId, title, description, questions, timeLimit, antiCheat, maxAttempts, passingScore, shuffleQuestions, randomizeOptions, questionsPerAttempt, availableFrom, availableUntil } = req.body;

    console.log('Extracted data:', { courseId, title, questionsCount: questions?.length });

    // Verify user and course relationship
    console.log('Finding user with ID:', userId);
    const user = await User.findById(userId);
    console.log('User found:', user ? { id: user._id, role: user.role, name: user.name } : 'null');

    if (!user || (user.role !== 'Teacher' && user.role !== 'Admin')) {
      console.log('User role check failed');
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can create exams'
      });
    }

    console.log('Finding course with ID:', courseId);
    const course = await Course.findById(courseId).populate('teacher', '_id name');
    console.log('Course found:', course ? { id: course._id, title: course.title, teacher: course.teacher } : 'null');

    if (!course) {
      console.log('Course not found');
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user created this course (both teachers and admins)
    if (!course.teacher || course.teacher._id.toString() !== userId) {
      console.log('Teacher check failed:', {
        courseTeacher: course.teacher,
        userId,
        match: course.teacher ? course.teacher._id.toString() === userId : false
      });
      return res.status(403).json({
        success: false,
        message: 'You can only create exams for courses you created'
      });
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required'
      });
    }

    // Validate MCQ questions have correct answers
    for (let question of questions) {
      if (question.type === 'mcq') {
        if (!question.options || question.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: 'MCQ questions must have at least 2 options'
          });
        }
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
          return res.status(400).json({
            success: false,
            message: 'MCQ questions must have exactly one correct answer'
          });
        }
      }
    }

    console.log('Creating exam with data:', {
      title,
      description,
      courseId,
      userId,
      questionsCount: questions?.length,
      timeLimit,
      antiCheat,
      maxAttempts,
      passingScore
    });

    const exam = new Exam({
      title,
      description,
      course: courseId,
      teacher: userId,
      questions,
      timeLimit,
      antiCheat: antiCheat || {},
      maxAttempts: maxAttempts || 1,
      passingScore: passingScore || 60,
      shuffleQuestions: shuffleQuestions !== false,
      randomizeOptions: randomizeOptions !== false,
      questionsPerAttempt,
      availableFrom,
      availableUntil,
      // Admin exams are auto-approved and published, teacher exams go directly to pending review
      status: user.role === 'Admin' ? 'approved' : 'pending_review',
      isPublished: user.role === 'Admin',
      submittedForReviewAt: user.role === 'Teacher' ? new Date() : undefined
    });

    console.log('Exam object created, attempting to save...');
    await exam.save();
    console.log('Exam saved successfully with ID:', exam._id);

    // If teacher created the exam, automatically notify admins for review
    if (user.role === 'Teacher') {
      console.log('=== TEACHER EXAM CREATED - NOTIFYING ADMINS ===');
      console.log('Exam ID:', exam._id);
      console.log('Exam title:', exam.title);
      console.log('Created by:', user.name, '(', user.role, ')');
      console.log('Course:', course.title);
      console.log('Status:', exam.status);

      // Notify all admins
      const admins = await User.find({ role: 'Admin' });

      console.log('Found admins to notify:', admins.length);
      admins.forEach(admin => {
        console.log(`  - ${admin.name} (${admin._id})`);
      });

      if (admins.length > 0) {
        const notifications = admins.map(admin => ({
          recipient: admin._id,
          sender: userId,
          type: 'exam_review_request',
          title: 'New Exam Review Request',
          message: `${user.name} created "${exam.title}" for ${course.title} - needs review`,
          isActionRequired: true,
          actionUrl: `/admin/exams/${exam._id}/review`,
          data: {
            examId: exam._id,
            courseId: course._id
          }
        }));

        await Notification.insertMany(notifications);
        console.log('✅ Notifications sent to', admins.length, 'admins');
      } else {
        console.log('⚠️ No admins found to notify');
      }
    }

    const message = user.role === 'Admin'
      ? 'Exam created and published successfully! Students can now take this exam.'
      : 'Exam created and submitted for admin review! You will be notified once it is approved.';

    res.status(201).json({
      success: true,
      data: { exam },
      message
    });

  } catch (error) {
    console.error('=== CREATE EXAM ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    console.error('========================');

    res.status(500).json({
      success: false,
      message: 'Server error while creating exam',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit exam for admin review (Teachers and Admins)
// @route   PUT /api/exams/:id/submit-for-review
// @access  Private (Teacher/Admin)
const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user || (user.role !== 'Teacher' && user.role !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can submit exams for review'
      });
    }

    const exam = await Exam.findById(id).populate('course');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if teacher owns this exam
    if (exam.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own exams for review'
      });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft exams can be submitted for review'
      });
    }

    exam.status = 'pending_review';
    exam.submittedForReviewAt = new Date();
    await exam.save();

    console.log('=== EXAM SUBMITTED FOR REVIEW ===');
    console.log('Exam ID:', exam._id);
    console.log('Exam title:', exam.title);
    console.log('Submitted by:', user.name, '(', user.role, ')');
    console.log('Course:', exam.course.title);
    console.log('New status:', exam.status);

    // Notify all admins (except the submitter if they are an admin)
    const admins = await User.find({
      role: 'Admin',
      _id: { $ne: userId } // Exclude the submitter
    });

    console.log('Found admins to notify:', admins.length);
    admins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin._id})`);
    });

    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: userId,
        type: 'exam_review_request',
        title: 'Exam Review Request',
        message: `${user.name} submitted "${exam.title}" for ${exam.course.title} - needs review`,
        isActionRequired: true,
        actionUrl: `/admin/exams/${exam._id}/review`,
        data: {
          examId: exam._id,
          courseId: exam.course._id
        }
      }));

      await Notification.insertMany(notifications);
      console.log('✅ Notifications sent to', admins.length, 'admins');
    } else {
      console.log('⚠️ No admins found to notify');
    }

    res.json({
      success: true,
      message: 'Exam submitted for admin review'
    });

  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting exam for review'
    });
  }
};

// @desc    Get exams for teacher/admin
// @route   GET /api/exams/my-exams
// @access  Private (Teacher/Admin)
const getTeacherExams = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, courseId, isPublished } = req.query;

    console.log('=== GET TEACHER EXAMS DEBUG ===');
    console.log('Teacher ID:', userId);
    console.log('Query filters:', { status, courseId, isPublished });

    const user = await User.findById(userId);
    if (!user || (user.role !== 'Teacher' && user.role !== 'Admin')) {
      console.log('❌ Access denied - user role:', user?.role);
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can view their exams'
      });
    }

    console.log('✅ User authorized:', user.name, user.role);

    let query = { teacher: userId };
    if (status) query.status = status;
    if (courseId) query.course = courseId;
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    console.log('📚 Exam query:', query);

    const exams = await Exam.find(query)
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${exams.length} exams for teacher`);
    exams.forEach((exam, index) => {
      console.log(`   ${index + 1}. ${exam.title} (${exam.status}, published: ${exam.isPublished})`);
    });

    res.json({
      success: true,
      data: { exams }
    });

  } catch (error) {
    console.error('Get teacher exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams'
    });
  }
};

// @desc    Get exams pending admin review
// @route   GET /api/exams/pending-review
// @access  Private (Admin)
const getPendingReviewExams = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view pending review exams'
      });
    }

    console.log('=== GET PENDING REVIEW EXAMS DEBUG ===');
    console.log('Admin ID:', req.userId);
    console.log('Admin name:', user.name);

    // First, let's see all exams with pending_review status
    const allPendingExams = await Exam.find({ status: 'pending_review' })
      .populate('course', 'title')
      .populate('teacher', 'name email role')
      .sort({ createdAt: -1 });

    console.log('All pending review exams:', allPendingExams.length);
    allPendingExams.forEach((exam, index) => {
      console.log(`${index + 1}. "${exam.title}" by ${exam.teacher.name} (${exam.teacher.role})`);
      console.log(`   Teacher ID: ${exam.teacher._id}`);
      console.log(`   Course: ${exam.course.title}`);
      console.log(`   Status: ${exam.status}`);
      console.log(`   Created: ${exam.createdAt}`);
    });

    // Show all pending review exams except those created by the current admin
    // Admins should see teacher-created exams that need approval

    // First, let's check what we're comparing
    console.log('Current admin ID (req.userId):', req.userId);
    console.log('Admin ID type:', typeof req.userId);

    const exams = await Exam.find({
      status: 'pending_review',
      teacher: { $ne: req.userId } // Exclude exams created by current admin
    })
      .populate('course', 'title')
      .populate('teacher', 'name email role')
      .sort({ createdAt: -1 });

    console.log('Filtered exams for admin review:', exams.length);

    // Debug: Show what we're returning to admin
    exams.forEach((exam, index) => {
      console.log(`ADMIN SHOULD SEE ${index + 1}. "${exam.title}"`);
      console.log(`   Created by: ${exam.teacher.name} (${exam.teacher.role})`);
      console.log(`   Teacher ID: ${exam.teacher._id} (type: ${typeof exam.teacher._id})`);
      console.log(`   Admin ID: ${req.userId} (type: ${typeof req.userId})`);
      console.log(`   IDs equal? ${exam.teacher._id.toString() === req.userId.toString()}`);
      console.log(`   Course: ${exam.course.title}`);
      console.log(`   Status: ${exam.status}`);
      console.log(`   Submitted for review: ${exam.submittedForReviewAt || 'Not set'}`);
    });

    // Debug: Show summary
    console.log(`\nSUMMARY: Admin should see ${exams.length} exams out of ${allPendingExams.length} total pending exams`);

    res.json({
      success: true,
      data: { exams }
    });

  } catch (error) {
    console.error('Get pending review exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending review exams'
    });
  }
};

// @desc    Admin approve/reject exam
// @route   PUT /api/exams/:id/review
// @access  Private (Admin)
const reviewExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    const adminId = req.userId;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can review exams'
      });
    }

    const exam = await Exam.findById(id).populate('teacher').populate('course');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: 'Only pending review exams can be reviewed'
      });
    }

    // Prevent admins from reviewing their own exams
    if (exam.teacher.toString() === adminId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review your own exam. Another admin must review it.'
      });
    }

    if (action === 'approve') {
      exam.status = 'approved';
      exam.reviewedBy = adminId;
      exam.reviewedAt = new Date();
      exam.reviewComments = comments;

      // Automatically publish the exam after approval
      exam.isPublished = true;
      exam.publishedAt = new Date();
      exam.publishedBy = adminId;

      console.log(`=== AUTO-PUBLISHING APPROVED EXAM ===`);
      console.log('Exam ID:', exam._id);
      console.log('Exam Title:', exam.title);
      console.log('Course:', exam.course.title);
      console.log('Published by Admin:', adminId);

      // Notify teacher of approval and publication
      const teacherNotification = new Notification({
        recipient: exam.teacher._id,
        sender: adminId,
        type: 'exam_approved',
        title: 'Exam Approved & Published',
        message: `Your exam "${exam.title}" for ${exam.course.title} has been approved and is now live for students`,
        data: {
          examId: exam._id,
          courseId: exam.course._id
        }
      });
      await teacherNotification.save();

      // Notify students enrolled in the course that a new exam is available
      const enrolledStudents = await User.find({
        'dashboardData.enrolledCourses.course': exam.course._id,
        role: 'Student'
      });

      console.log(`Found ${enrolledStudents.length} enrolled students to notify`);

      if (enrolledStudents.length > 0) {
        const studentNotifications = enrolledStudents.map(student => ({
          recipient: student._id,
          sender: adminId,
          type: 'exam_published',
          title: 'New Exam Available',
          message: `New exam "${exam.title}" is now available for ${exam.course.title}`,
          actionUrl: `/courses/${exam.course._id}`,
          data: {
            examId: exam._id,
            courseId: exam.course._id
          }
        }));

        await Notification.insertMany(studentNotifications);
        console.log(`Sent notifications to ${enrolledStudents.length} students`);
      }

    } else if (action === 'reject') {
      exam.status = 'rejected';
      exam.reviewedBy = adminId;
      exam.reviewedAt = new Date();
      exam.rejectionReason = comments;

      // Notify teacher of rejection
      const notification = new Notification({
        recipient: exam.teacher._id,
        sender: adminId,
        type: 'exam_rejected',
        title: 'Exam Rejected',
        message: `Your exam "${exam.title}" for ${exam.course.title} has been rejected`,
        data: {
          examId: exam._id,
          courseId: exam.course._id,
          reason: comments
        }
      });
      await notification.save();

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    await exam.save();

    res.json({
      success: true,
      message: `Exam ${action}d successfully`
    });

  } catch (error) {
    console.error('Review exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing exam'
    });
  }
};

// @desc    Publish approved exam
// @route   PUT /api/exams/:id/publish
// @access  Private (Teacher/Admin)
const publishExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    const exam = await Exam.findById(id).populate('course').populate('teacher');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check permissions
    const canPublish = user.role === 'Admin' ||
                      (user.role === 'Teacher' && exam.teacher._id.toString() === userId);

    if (!canPublish) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to publish this exam'
      });
    }

    if (exam.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved exams can be published'
      });
    }

    exam.isPublished = true;
    await exam.save();

    // Notify students enrolled in the course
    const enrolledStudents = await User.find({
      'dashboardData.enrolledCourses.course': exam.course._id,
      role: 'Student'
    });

    const notifications = enrolledStudents.map(student => ({
      recipient: student._id,
      sender: userId,
      type: 'exam_published',
      title: 'New Exam Available',
      message: `New exam "${exam.title}" is now available for ${exam.course.title}`,
      actionUrl: `/exams/${exam._id}`,
      data: {
        examId: exam._id,
        courseId: exam.course._id
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      message: 'Exam published successfully'
    });

  } catch (error) {
    console.error('Publish exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing exam'
    });
  }
};

// @desc    Get available exams for student
// @route   GET /api/exams/available
// @access  Private (Student)
const getAvailableExams = async (req, res) => {
  try {
    const studentId = req.userId;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view available exams'
      });
    }

    // Get enrolled courses
    const enrolledCourseIds = student.dashboardData?.enrolledCourses?.map(
      enrollment => enrollment.course
    ) || [];

    if (enrolledCourseIds.length === 0) {
      return res.json({
        success: true,
        data: { exams: [] }
      });
    }

    // Find published exams for enrolled courses
    const now = new Date();
    const exams = await Exam.find({
      course: { $in: enrolledCourseIds },
      status: 'approved',
      isPublished: true,
      $or: [
        { availableFrom: { $exists: false } },
        { availableFrom: { $lte: now } }
      ],
      $or: [
        { availableUntil: { $exists: false } },
        { availableUntil: { $gte: now } }
      ]
    })
    .populate('course', 'title')
    .select('-questions.correctAnswer -questions.explanation') // Hide answers
    .sort({ createdAt: -1 });

    // Get student's attempts for each exam
    const examIds = exams.map(exam => exam._id);
    const attempts = await ExamAttempt.find({
      exam: { $in: examIds },
      student: studentId
    }).select('exam attemptNumber status totalScore percentage');

    // Add attempt info to exams
    const examsWithAttempts = exams.map(exam => {
      const examAttempts = attempts.filter(attempt =>
        attempt.exam.toString() === exam._id.toString()
      );

      return {
        ...exam.toObject(),
        attemptCount: examAttempts.length,
        canAttempt: examAttempts.length === 0, // Only one attempt allowed
        bestScore: examAttempts.length > 0 ?
          Math.max(...examAttempts.map(a => a.percentage || 0)) : null,
        lastAttempt: examAttempts.length > 0 ?
          examAttempts[examAttempts.length - 1] : null
      };
    });

    res.json({
      success: true,
      data: { exams: examsWithAttempts }
    });

  } catch (error) {
    console.error('Get available exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available exams'
    });
  }
};

// @desc    Start exam attempt
// @route   POST /api/exams/:id/start
// @access  Private (Student)
const startExamAttempt = async (req, res) => {
  try {
    console.log('=== START EXAM ATTEMPT DEBUG ===');
    const { id } = req.params;
    const studentId = req.userId;
    const { browserInfo } = req.body;
    console.log('Exam ID:', id, 'Student ID:', studentId, 'Browser Info:', browserInfo);

    const student = await User.findById(studentId);
    console.log('Student found:', student ? { id: student._id, name: student.name, role: student.role } : 'null');
    if (!student || student.role !== 'Student') {
      console.log('Student role check failed');
      return res.status(403).json({
        success: false,
        message: 'Only students can start exam attempts'
      });
    }

    const exam = await Exam.findById(id).populate('course');
    console.log('Exam found:', exam ? {
      id: exam._id,
      title: exam.title,
      status: exam.status,
      isPublished: exam.isPublished,
      course: exam.course ? exam.course.title : 'null'
    } : 'null');

    if (!exam) {
      console.log('Exam not found');
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam is available
    console.log('Exam availability check:', { isPublished: exam.isPublished, status: exam.status });
    if (!exam.isPublished || exam.status !== 'approved') {
      console.log('Exam not available - isPublished:', exam.isPublished, 'status:', exam.status);
      return res.status(400).json({
        success: false,
        message: 'Exam is not available'
      });
    }

    // Check time availability
    const now = new Date();
    if (exam.availableFrom && exam.availableFrom > now) {
      return res.status(400).json({
        success: false,
        message: 'Exam is not yet available'
      });
    }
    if (exam.availableUntil && exam.availableUntil < now) {
      return res.status(400).json({
        success: false,
        message: 'Exam is no longer available'
      });
    }

    // Check if student is enrolled in the course
    const isEnrolled = student.dashboardData?.enrolledCourses?.some(
      enrollment => enrollment.course.toString() === exam.course._id.toString()
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to take this exam'
      });
    }

    // Check attempt limits and re-attempt permissions
    const existingAttempts = await ExamAttempt.find({
      exam: id,
      student: studentId
    });

    if (existingAttempts.length > 0) {
      // Check if student has an approved re-attempt request
      const approvedRequest = await ExamReAttemptRequest.findOne({
        student: studentId,
        exam: id,
        status: 'approved',
        newAttemptGranted: true,
        newAttemptUsed: false
      });

      if (!approvedRequest) {
        return res.status(400).json({
          success: false,
          message: 'You have already attempted this exam. Each exam can only be taken once unless re-attempt is approved.'
        });
      }

      console.log('✅ Approved re-attempt request found:', approvedRequest._id);
    }

    // Check for ongoing attempt
    const ongoingAttempt = existingAttempts.find(attempt =>
      attempt.status === 'in_progress'
    );
    if (ongoingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You already have an ongoing attempt for this exam',
        data: { attemptId: ongoingAttempt._id }
      });
    }

    // Prepare questions for attempt
    let examQuestions = [...exam.questions];

    // Shuffle questions if enabled
    if (exam.shuffleQuestions) {
      examQuestions = examQuestions.sort(() => Math.random() - 0.5);
    }

    // Select random questions if questionsPerAttempt is set
    if (exam.questionsPerAttempt && exam.questionsPerAttempt < examQuestions.length) {
      examQuestions = examQuestions.slice(0, exam.questionsPerAttempt);
    }

    // Randomize options for MCQ questions if enabled
    if (exam.randomizeOptions) {
      examQuestions = examQuestions.map(question => {
        if (question.type === 'mcq' && question.options) {
          const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
          return { ...question.toObject(), options: shuffledOptions };
        }
        return question;
      });
    }

    // Create exam attempt
    const attempt = new ExamAttempt({
      exam: id,
      student: studentId,
      attemptNumber: existingAttempts.length + 1,
      startedAt: new Date(),
      examSnapshot: {
        title: exam.title,
        timeLimit: exam.timeLimit,
        totalPoints: exam.totalPoints,
        questions: examQuestions
      },
      browserInfo,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await attempt.save();

    // If this is a re-attempt, mark the request as used
    if (existingAttempts.length > 0) {
      const updatedRequest = await ExamReAttemptRequest.findOneAndUpdate(
        {
          student: studentId,
          exam: id,
          status: 'approved',
          newAttemptGranted: true,
          newAttemptUsed: false
        },
        {
          newAttemptUsed: true,
          newAttemptId: attempt._id
        },
        { new: true }
      );

      if (updatedRequest) {
        console.log('✅ Re-attempt request marked as used:', updatedRequest._id);
      } else {
        console.log('⚠️ No approved re-attempt request found to mark as used');
      }
    }

    // Return exam questions without correct answers
    const questionsForStudent = examQuestions.map(question => ({
      _id: question._id,
      questionText: question.questionText,
      type: question.type,
      options: question.type === 'mcq' ?
        question.options.map(opt => ({ text: opt.text })) : undefined,
      maxWords: question.maxWords,
      points: question.points
    }));

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        timeLimit: exam.timeLimit,
        questions: questionsForStudent,
        antiCheat: exam.antiCheat
      },
      message: 'Exam attempt started successfully'
    });

  } catch (error) {
    console.error('Start exam attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting exam attempt'
    });
  }
};

// @desc    Submit exam answers
// @route   PUT /api/exams/attempts/:attemptId/submit
// @access  Private (Student)
const submitExamAttempt = async (req, res) => {
  try {
    console.log('=== SUBMIT EXAM ATTEMPT DEBUG ===');
    const { attemptId } = req.params;
    const { answers } = req.body;
    const studentId = req.userId;
    console.log('Attempt ID:', attemptId);
    console.log('Student ID:', studentId);
    console.log('Answers:', answers);

    const attempt = await ExamAttempt.findById(attemptId).populate('exam');
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own exam attempts'
      });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'This exam attempt is not in progress'
      });
    }

    // Check if time limit exceeded
    const timeSpent = Math.floor((new Date() - attempt.startedAt) / 1000);
    const timeLimit = attempt.examSnapshot.timeLimit * 60; // Convert to seconds

    if (timeSpent > timeLimit) {
      attempt.isTimedOut = true;
      attempt.submissionMethod = 'auto_timeout';
    }

    // Process answers and calculate score
    let totalScore = 0;
    const processedAnswers = [];

    for (let answer of answers) {
      const question = attempt.examSnapshot.questions.find(
        q => q._id.toString() === answer.questionId
      );

      if (!question) continue;

      const processedAnswer = {
        questionId: answer.questionId,
        questionType: question.type,
        maxPoints: question.points,
        points: 0,
        autoGraded: false
      };

      if (question.type === 'mcq') {
        processedAnswer.selectedOption = answer.selectedOption;

        // Auto-grade MCQ
        if (question.options && question.options[answer.selectedOption]?.isCorrect) {
          processedAnswer.points = question.points;
          processedAnswer.isCorrect = true;
        } else {
          processedAnswer.isCorrect = false;
        }
        processedAnswer.autoGraded = true;
        totalScore += processedAnswer.points;

      } else if (question.type === 'short_answer') {
        processedAnswer.textAnswer = answer.textAnswer;

        // Auto-grade if exact match with correct answer
        if (question.correctAnswer &&
            answer.textAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
          processedAnswer.points = question.points;
          processedAnswer.isCorrect = true;
          processedAnswer.autoGraded = true;
          totalScore += processedAnswer.points;
        }
        // Otherwise, needs manual grading

      } else if (question.type === 'essay') {
        processedAnswer.textAnswer = answer.textAnswer;
        // Essays always need manual grading
      }

      processedAnswers.push(processedAnswer);
    }

    // Determine grading status
    const needsManualGrading = processedAnswers.some(answer => !answer.autoGraded);
    const gradingStatus = needsManualGrading ? 'partially_graded' : 'fully_graded';

    // Update attempt using findByIdAndUpdate to avoid versioning conflicts
    const updatedAttempt = await ExamAttempt.findByIdAndUpdate(
      attemptId,
      {
        answers: processedAnswers,
        totalScore: totalScore,
        timeSpent: timeSpent,
        submittedAt: new Date(),
        status: 'submitted',
        gradingStatus: gradingStatus
      },
      { new: true }
    );

    if (!updatedAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    // Update exam statistics
    await updateExamStatistics(attempt.exam._id);

    // Get student information for notification
    const student = await User.findById(studentId).select('name email');

    // Notify course creator about submission for review (for ALL submissions, not just manual grading)
    await notifyCourseCreatorForReview(updatedAttempt, student);

    // Update student's learning progress
    await updateStudentLearningProgress(studentId, attempt.exam.course, updatedAttempt);

    res.json({
      success: true,
      data: {
        totalScore,
        percentage: updatedAttempt.percentage,
        passed: updatedAttempt.passed,
        needsManualGrading
      },
      message: needsManualGrading
        ? 'Exam submitted successfully! Your answers have been sent to the instructor for review.'
        : 'Exam submitted successfully'
    });

  } catch (error) {
    console.error('Submit exam attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting exam'
    });
  }
};

// @desc    Record anti-cheat violation
// @route   POST /api/exams/attempts/:attemptId/violation
// @access  Private (Student)
const recordViolation = async (req, res) => {
  try {
    console.log('=== RECORD VIOLATION DEBUG ===');
    const { attemptId } = req.params;
    const { type, details } = req.body;
    const studentId = req.userId;
    console.log('Attempt ID:', attemptId);
    console.log('Student ID:', studentId);
    console.log('Violation type:', type);
    console.log('Details:', details);

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    if (attempt.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record violation for completed attempt'
      });
    }

    // Add violation
    attempt.violations.push({
      type,
      details,
      severity: type === 'tab_switch' ? 'high' : 'medium'
    });

    console.log(`📊 Violation added. Total violations: ${attempt.violations.length}`);
    console.log('All violations:', attempt.violations.map(v => `${v.type}: ${v.details}`));

    // Auto-submit if too many violations
    if (attempt.violations.length >= 3) {
      console.log('🔴 TRIGGERING AUTO-SUBMISSION - 3+ violations detected');
      attempt.status = 'submitted';
      attempt.submissionMethod = 'auto_violation';
      attempt.submittedAt = new Date();
      attempt.timeSpent = Math.floor((new Date() - attempt.startedAt) / 1000);
      attempt.terminatedDueToViolation = true;
      attempt.terminationReason = `Exam terminated due to ${attempt.violations.length} violations: ${attempt.violations.map(v => v.type).join(', ')}`;

      // Calculate score with current answers
      let totalScore = 0;
      for (let answer of attempt.answers || []) {
        totalScore += answer.points || 0;
      }
      attempt.totalScore = totalScore;

      // Set grading status - auto-submitted exams typically need manual review
      attempt.gradingStatus = 'partially_graded';

      // Create notification for course creator about violation submission
      const exam = await Exam.findById(attempt.exam).populate('course');
      if (exam && exam.course) {
        const student = await User.findById(studentId);
        const Notification = require('../models/Notification');

        // Create violation-specific notification
        const violationNotification = new Notification({
          recipient: exam.course.teacher,
          type: 'exam_violation_submission',
          title: 'Exam Auto-Submitted Due to Violations',
          message: `${student.name} had their exam "${exam.title}" auto-submitted due to ${attempt.violations.length} violations`,
          data: {
            attemptId: attempt._id,
            studentName: student.name,
            examTitle: exam.title,
            violationCount: attempt.violations.length,
            violations: attempt.violations.map(v => v.type)
          }
        });

        await violationNotification.save();
        console.log('✅ Violation submission notification sent to course creator');

        // Also send standard review notification so it appears in review dashboard
        // We need to populate the exam field for the notification function
        const populatedAttempt = await ExamAttempt.findById(attempt._id).populate('exam');
        await notifyCourseCreatorForReview(populatedAttempt, student);
        console.log('✅ Standard review notification also sent for auto-submitted exam');
      }
    }

    await attempt.save();
    console.log('✅ Attempt saved successfully');

    res.json({
      success: true,
      data: {
        violationCount: attempt.violations.length,
        autoSubmitted: attempt.status === 'submitted' && attempt.terminatedDueToViolation,
        terminated: attempt.terminatedDueToViolation,
        terminationReason: attempt.terminationReason,
        attemptId: attempt._id
      },
      message: attempt.terminatedDueToViolation
        ? 'Exam terminated due to violations and auto-submitted'
        : 'Violation recorded'
    });

    console.log('✅ Response sent:', {
      violationCount: attempt.violations.length,
      terminated: attempt.terminatedDueToViolation,
      status: attempt.status
    });

  } catch (error) {
    console.error('Record violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording violation'
    });
  }
};

// Helper function to update exam statistics
const updateExamStatistics = async (examId) => {
  try {
    const attempts = await ExamAttempt.find({
      exam: examId,
      status: { $in: ['submitted', 'auto_submitted'] }
    });

    if (attempts.length === 0) return;

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0);
    const averageScore = totalScore / totalAttempts;
    const passedAttempts = attempts.filter(attempt => attempt.passed).length;
    const passRate = (passedAttempts / totalAttempts) * 100;

    await Exam.findByIdAndUpdate(examId, {
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100
    });

  } catch (error) {
    console.error('Update exam statistics error:', error);
  }
};

// @desc    Get exams for a specific course
// @route   GET /api/exams/course/:courseId
// @access  Private (Student/Teacher/Admin)
const getCourseExams = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const course = await Course.findById(courseId).populate('teacher', '_id name');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let query = { course: courseId };

    console.log('Get course exams - User role:', user.role, 'Course ID:', courseId);

    // Students can only see published exams (simplified for testing)
    if (user.role === 'Student') {
      query.status = 'approved';
      query.isPublished = true;
      console.log('Student query (simplified):', query);
    }
    // Teachers and Admins can see all exams (simplified for testing)
    else if (user.role === 'Teacher' || user.role === 'Admin') {
      console.log('Teacher/Admin - full access to all exams');
      // Show all exams for teachers and admins
    }

    const exams = await Exam.find(query)
      .populate('course', 'title')
      .populate('teacher', 'name role')
      .sort({ createdAt: -1 });

    // Add attempt information for students
    let examsWithAttempts = exams;
    if (user.role === 'Student') {
      examsWithAttempts = await Promise.all(
        exams.map(async (exam) => {
          const attempts = await ExamAttempt.find({
            exam: exam._id,
            student: userId
          }).select('totalScore finalScore percentage finalPercentage passed finalPassed submittedAt status attemptNumber scorePublished publishedAt')
            .sort({ createdAt: -1 });

          // Get re-attempt requests for this exam
          const reAttemptRequests = await ExamReAttemptRequest.find({
            exam: exam._id,
            student: userId
          }).sort({ createdAt: -1 });

          const attemptCount = attempts.length;
          const lastAttempt = attempts[0];
          const bestScore = attempts.length > 0
            ? Math.max(...attempts.map(a => a.totalScore || 0))
            : null;

          // Check if student can attempt
          let canAttempt = attemptCount === 0; // First time attempt
          let isRetake = false;

          // If already attempted, check for approved re-attempt requests
          if (attemptCount > 0) {
            const approvedRequest = reAttemptRequests.find(req =>
              req.status === 'approved' &&
              req.newAttemptGranted &&
              !req.newAttemptUsed
            );

            if (approvedRequest) {
              canAttempt = true;
              isRetake = true;
            }
          }

          // Get latest re-attempt request for display
          const latestReAttemptRequest = reAttemptRequests[0];

          return {
            ...exam.toObject(),
            attemptCount,
            canAttempt,
            isRetake,
            lastAttempt: lastAttempt ? {
              _id: lastAttempt._id,
              attemptId: lastAttempt._id,
              score: lastAttempt.finalScore !== undefined ? lastAttempt.finalScore : lastAttempt.totalScore,
              totalScore: lastAttempt.finalScore !== undefined ? lastAttempt.finalScore : lastAttempt.totalScore,
              percentage: lastAttempt.finalPercentage !== undefined ? lastAttempt.finalPercentage : lastAttempt.percentage,
              passed: lastAttempt.finalPassed !== undefined ? lastAttempt.finalPassed : lastAttempt.passed,
              submittedAt: lastAttempt.submittedAt,
              status: lastAttempt.status,
              scorePublished: lastAttempt.scorePublished,
              publishedAt: lastAttempt.publishedAt
            } : null,
            bestScore,
            reAttemptRequest: latestReAttemptRequest ? {
              status: latestReAttemptRequest.status,
              creatorResponse: latestReAttemptRequest.creatorResponse,
              reviewedAt: latestReAttemptRequest.reviewedAt,
              violationType: latestReAttemptRequest.violationType,
              studentMessage: latestReAttemptRequest.studentMessage,
              newAttemptGranted: latestReAttemptRequest.newAttemptGranted,
              newAttemptUsed: latestReAttemptRequest.newAttemptUsed
            } : null
          };
        })
      );
    }

    res.json({
      success: true,
      data: { exams: examsWithAttempts }
    });

  } catch (error) {
    console.error('Get course exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course exams'
    });
  }
};

// Helper function to notify course creator about exam submission for review
const notifyCourseCreatorForReview = async (examAttempt, student) => {
  try {
    console.log('=== SENDING NOTIFICATION TO COURSE CREATOR ===');
    console.log('Exam Attempt ID:', examAttempt._id);
    console.log('Student:', student ? student.name : 'STUDENT NOT FOUND');

    const Notification = require('../models/Notification');
    const Exam = require('../models/Exam');

    // Get the exam with course details directly
    const exam = await Exam.findById(examAttempt.exam)
      .populate('course', 'title teacher');

    if (!exam || !exam.course) {
      console.error('❌ Could not find exam or course for notification');
      console.error('Exam ID:', examAttempt.exam);
      return;
    }

    console.log('Exam found:', exam.title);
    console.log('Course found:', exam.course.title);
    console.log('Course creator ID:', exam.course.teacher);

    // Create notification for course creator
    const notification = await Notification.create({
      recipient: exam.course.teacher,
      type: 'exam_submission_review',
      title: 'New Exam Submission for Review',
      message: `${student.name} has submitted "${exam.title}" exam. Please review and publish the grades.`,
      data: {
        examId: exam._id,
        attemptId: examAttempt._id,
        studentId: student._id,
        studentName: student.name,
        examTitle: exam.title,
        courseTitle: exam.course.title,
        submittedAt: examAttempt.submittedAt || new Date()
      }
    });

    console.log('✅ Notification created successfully!');
    console.log('Notification ID:', notification._id);
    console.log('Recipient (Course Creator):', exam.course.teacher);
    console.log('Student who submitted:', student.name);
    console.log('Exam title:', exam.title);

  } catch (error) {
    console.error('❌ Error sending review notification:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// @desc    Get exam attempts pending review for course creator
// @route   GET /api/exams/attempts/pending-review
// @access  Private (Teacher/Admin)
const getPendingReviewAttempts = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || !['Teacher', 'Admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can review exam attempts'
      });
    }

    console.log('=== GET PENDING REVIEW ATTEMPTS DEBUG ===');
    console.log('Admin/Teacher ID:', userId);

    // Find courses created by this user (admin or teacher)
    const courses = await Course.find({ teacher: userId });
    const courseIds = courses.map(course => course._id);
    console.log('Course IDs for this teacher/admin:', courseIds);

    // First get all exams for these courses
    const exams = await Exam.find({ course: { $in: courseIds } });
    const examIds = exams.map(exam => exam._id);
    console.log('Exam IDs for these courses:', examIds);

    // Debug: Check all submitted attempts for these exams
    const allSubmittedAttempts = await ExamAttempt.find({
      exam: { $in: examIds },
      status: 'submitted'
    })
    .populate('student', 'name email')
    .populate({
      path: 'exam',
      populate: {
        path: 'course',
        select: 'title teacher'
      }
    })
    .sort({ submittedAt: -1 });

    console.log('All submitted attempts for these courses:', allSubmittedAttempts.length);
    allSubmittedAttempts.forEach((attempt, index) => {
      console.log(`All Submitted ${index + 1}:`, {
        id: attempt._id,
        student: attempt.student.name,
        exam: attempt.exam.title,
        submissionMethod: attempt.submissionMethod,
        terminatedDueToViolation: attempt.terminatedDueToViolation,
        scorePublished: attempt.scorePublished,
        gradingStatus: attempt.gradingStatus
      });
    });

    // Find exam attempts that need review (submitted but not yet published)
    const pendingAttempts = await ExamAttempt.find({
      exam: { $in: examIds },
      status: 'submitted',
      scorePublished: { $ne: true } // Not yet published by teacher
    })
    .populate('student', 'name email')
    .populate({
      path: 'exam',
      populate: {
        path: 'course',
        select: 'title teacher'
      }
    })
    .sort({ submittedAt: -1 });

    console.log('Found pending attempts:', pendingAttempts.length);

    // Debug: Log details about each pending attempt
    pendingAttempts.forEach((attempt, index) => {
      console.log(`Attempt ${index + 1}:`, {
        id: attempt._id,
        student: attempt.student.name,
        exam: attempt.exam.title,
        status: attempt.status,
        submissionMethod: attempt.submissionMethod,
        terminatedDueToViolation: attempt.terminatedDueToViolation,
        scorePublished: attempt.scorePublished,
        gradingStatus: attempt.gradingStatus,
        submittedAt: attempt.submittedAt
      });
    });

    res.json({
      success: true,
      data: { attempts: pendingAttempts }
    });

  } catch (error) {
    console.error('Get pending review attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending reviews'
    });
  }
};

// Helper function to update student's learning progress
const updateStudentLearningProgress = async (studentId, courseId, examAttempt) => {
  try {
    const User = require('../models/User');

    // Find the student
    const student = await User.findById(studentId);
    if (!student || !student.dashboardData) return;

    // Find the enrolled course
    const enrolledCourse = student.dashboardData.enrolledCourses.find(
      enrollment => enrollment.course.toString() === courseId.toString()
    );

    if (enrolledCourse) {
      // Add exam result to progress
      if (!enrolledCourse.progress) {
        enrolledCourse.progress = {
          completedLectures: [],
          completedAssignments: [],
          completedExams: [],
          overallProgress: 0
        };
      }

      if (!enrolledCourse.progress.completedExams) {
        enrolledCourse.progress.completedExams = [];
      }

      // Add exam attempt to completed exams
      enrolledCourse.progress.completedExams.push({
        exam: examAttempt.exam._id,
        attemptId: examAttempt._id,
        score: examAttempt.totalScore,
        percentage: examAttempt.percentage,
        passed: examAttempt.passed,
        completedAt: examAttempt.submittedAt,
        gradingStatus: examAttempt.gradingStatus
      });

      // Update overall progress (this is a simple calculation, you can make it more sophisticated)
      const totalActivities = enrolledCourse.progress.completedLectures.length +
                             enrolledCourse.progress.completedAssignments.length +
                             enrolledCourse.progress.completedExams.length;
      enrolledCourse.progress.overallProgress = Math.min(100, totalActivities * 10); // Simple calculation

      await student.save();
      console.log(`Updated learning progress for student ${studentId}`);
    }
  } catch (error) {
    console.error('Error updating student learning progress:', error);
  }
};

// @desc    Get exam results with correct answers (for student review)
// @route   GET /api/exams/attempts/:attemptId/results
// @access  Private (Student who took the exam)
const getExamResults = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.userId;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate({
        path: 'exam',
        populate: {
          path: 'course',
          select: 'title'
        }
      })
      .populate('student', 'name email');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    // Check if user is the student who took the exam
    if (attempt.student._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own exam results'
      });
    }

    // Check if results are published (grades must be published to see correct answers)
    if (!attempt.scorePublished) {
      return res.status(403).json({
        success: false,
        message: 'Results are not yet published by your instructor. Please wait for the instructor to review and publish your grades.'
      });
    }

    // Use final published scores if available, otherwise use original scores
    const displayScore = attempt.finalScore !== undefined ? attempt.finalScore : attempt.totalScore;
    const displayPercentage = attempt.finalPercentage !== undefined ? attempt.finalPercentage : attempt.percentage;
    const displayPassed = attempt.finalPassed !== undefined ? attempt.finalPassed : attempt.passed;

    console.log('Score display logic:', {
      originalScore: attempt.totalScore,
      finalScore: attempt.finalScore,
      displayScore,
      originalPercentage: attempt.percentage,
      finalPercentage: attempt.finalPercentage,
      displayPercentage,
      originalPassed: attempt.passed,
      finalPassed: attempt.finalPassed,
      displayPassed,
      scorePublished: attempt.scorePublished
    });

    // Return detailed results with correct answers
    const detailedResults = {
      // Main exam info
      examTitle: attempt.exam.title,
      examId: attempt.exam._id,
      courseTitle: attempt.exam.course ? attempt.exam.course.title : 'Unknown Course',
      courseId: attempt.exam.course ? attempt.exam.course._id : null,
      totalScore: displayScore,
      totalPoints: attempt.exam.totalPoints,
      percentage: displayPercentage,
      passed: displayPassed,
      passingScore: attempt.exam.passingScore,
      timeSpent: attempt.timeSpent,
      submittedAt: attempt.submittedAt,
      instructorFeedback: attempt.instructorFeedback,
      scorePublished: attempt.scorePublished,
      publishedAt: attempt.publishedAt,

      // Violations if any
      violations: attempt.violations || [],

      // Questions and answers
      answers: attempt.exam.questions.map((question, index) => {
        const studentAnswer = attempt.answers.find(
          answer => answer.questionId.toString() === question._id.toString()
        );

        return {
          questionText: question.questionText,
          type: question.type,
          maxPoints: question.points,
          points: studentAnswer ? (studentAnswer.manualScore || studentAnswer.score || 0) : 0,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          correctOptions: question.options ?
            question.options.filter(opt => opt.isCorrect).map(opt => opt.text) : [],
          selectedOption: studentAnswer ? studentAnswer.selectedOption : null,
          textAnswer: studentAnswer ? studentAnswer.textAnswer : null,
          isCorrect: studentAnswer ? studentAnswer.isCorrect : false,
          needsGrading: studentAnswer ? (studentAnswer.manualScore === undefined && question.type !== 'mcq') : false,
          feedback: studentAnswer ? studentAnswer.feedback : null,
          explanation: question.explanation
        };
      })
    };

    res.json({
      success: true,
      data: detailedResults,
      message: 'Exam results retrieved successfully'
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam results'
    });
  }
};

// @desc    Publish exam score to student
// @route   PUT /api/exams/attempts/:attemptId/publish-score
// @access  Private (Teacher/Admin)
const publishExamScore = async (req, res) => {
  try {
    console.log('=== PUBLISHING EXAM SCORE ===');
    const { attemptId } = req.params;
    const { finalScore, feedback } = req.body;
    const userId = req.userId;

    console.log('Attempt ID:', attemptId);
    console.log('Publisher ID:', userId);
    console.log('Final Score:', finalScore);
    console.log('Feedback:', feedback);

    // Get the exam attempt with full details
    const attempt = await ExamAttempt.findById(attemptId)
      .populate({
        path: 'exam',
        populate: {
          path: 'course',
          select: 'title teacher'
        }
      })
      .populate('student', 'name email');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    console.log('Attempt found:', {
      student: attempt.student.name,
      exam: attempt.exam.title,
      course: attempt.exam.course.title,
      courseTeacher: attempt.exam.course.teacher
    });

    // Check if user is the course creator
    if (attempt.exam.course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only publish scores for exams in your own courses'
      });
    }

    // Calculate final percentage and passed status
    const publishedScore = finalScore !== undefined ? finalScore : attempt.totalScore;
    const calculatedPercentage = Math.round((publishedScore / attempt.exam.totalPoints) * 100);
    const calculatedPassed = calculatedPercentage >= (attempt.exam.passingScore || 60);

    console.log('=== PUBLISHING SCORE CALCULATIONS ===');
    console.log('Input finalScore:', finalScore);
    console.log('Attempt totalScore:', attempt.totalScore);
    console.log('Published score (final):', publishedScore);
    console.log('Total points:', attempt.exam.totalPoints);
    console.log('Calculated percentage:', calculatedPercentage);
    console.log('Passing score:', attempt.exam.passingScore || 60);
    console.log('Calculated passed:', calculatedPassed);

    // Update the attempt with published score
    const updateData = {
      finalScore: publishedScore,
      finalPercentage: calculatedPercentage,
      finalPassed: calculatedPassed,
      instructorFeedback: feedback || '',
      scorePublished: true,
      publishedAt: new Date(),
      publishedBy: userId,
      gradingStatus: 'fully_graded'
    };

    console.log('Update data:', updateData);

    const updatedAttempt = await ExamAttempt.findByIdAndUpdate(
      attemptId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Updated attempt final fields:', {
      finalScore: updatedAttempt.finalScore,
      finalPercentage: updatedAttempt.finalPercentage,
      finalPassed: updatedAttempt.finalPassed,
      scorePublished: updatedAttempt.scorePublished
    });

    // Send notification to student
    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      recipient: attempt.student._id,
      type: 'exam_score_published',
      title: 'Exam Results Published',
      message: `Your results for "${attempt.exam.title}" have been published. You can now view your score and correct answers.`,
      data: {
        examId: attempt.exam._id,
        attemptId: attempt._id,
        examTitle: attempt.exam.title,
        courseTitle: attempt.exam.course.title,
        finalScore: publishedScore,
        finalPercentage: calculatedPercentage,
        passed: calculatedPassed
      }
    });

    console.log('✅ Score published and notification sent to student:', attempt.student.name);

    res.json({
      success: true,
      message: 'Score published successfully. Student has been notified.',
      data: {
        finalScore: publishedScore,
        finalPercentage: calculatedPercentage,
        finalPassed: calculatedPassed,
        published: true,
        notificationId: notification._id
      }
    });

  } catch (error) {
    console.error('❌ Error publishing exam score:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing score'
    });
  }
};

// @desc    Test notification system
// @route   POST /api/exams/test-notification
// @access  Private
const testNotification = async (req, res) => {
  try {
    console.log('=== TESTING NOTIFICATION SYSTEM ===');
    const Notification = require('../models/Notification');
    const userId = req.userId;

    // Create a test notification
    const notification = await Notification.create({
      recipient: userId,
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      data: {
        testData: 'Hello World',
        timestamp: new Date()
      }
    });

    console.log('✅ Test notification created:', notification._id);

    res.json({
      success: true,
      message: 'Test notification created successfully',
      notificationId: notification._id
    });

  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
};

// @desc    Get specific exam attempt for review
// @route   GET /api/exams/attempts/:attemptId/review
// @access  Private (Teacher/Admin)
const getAttemptForReview = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.userId;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate('student', 'name email')
      .populate({
        path: 'exam',
        populate: {
          path: 'course',
          select: 'title teacher'
        }
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    // Check if user is the course creator
    if (attempt.exam.course.teacher.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review attempts for your own courses'
      });
    }

    res.json({
      success: true,
      data: attempt
    });

  } catch (error) {
    console.error('Get attempt for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attempt for review'
    });
  }
};

// @desc    Contact exam creator for re-attempt request
// @route   POST /api/exams/contact-creator
// @access  Private (Student)
const contactCreator = async (req, res) => {
  try {
    console.log('=== CONTACT CREATOR DEBUG ===');
    const studentId = req.userId;
    const { examId, reason, message } = req.body;

    console.log('Student ID:', studentId);
    console.log('Exam ID:', examId);
    console.log('Reason:', reason);

    // Find the exam and populate course with teacher
    const exam = await Exam.findById(examId).populate({
      path: 'course',
      populate: {
        path: 'teacher',
        select: 'name email'
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get student info
    const student = await User.findById(studentId).select('name email');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student already has a pending contact creator request for this exam
    // Students can contact creators multiple times, but only one pending request at a time per exam
    const existingPendingRequest = await ExamReAttemptRequest.findOne({
      student: studentId,
      exam: examId,
      violationType: 'contact_creator',
      status: 'pending'
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending re-attempt request for this exam. Please wait for the instructor to respond before submitting another request.'
      });
    }

    // Create re-attempt request record

    console.log('Creating re-attempt request with data:', {
      student: studentId,
      exam: examId,
      course: exam.course._id,
      examCreator: exam.course.teacher._id,
      violationType: 'contact_creator',
      violationDetails: `Student contacted creator: ${reason}`,
      studentMessage: message,
      status: 'pending'
    });

    const reAttemptRequest = new ExamReAttemptRequest({
      student: studentId,
      exam: examId,
      course: exam.course._id,
      examCreator: exam.course.teacher._id,
      violationType: 'contact_creator',
      violationDetails: `Student contacted creator: ${reason}`,
      studentMessage: message,
      status: 'pending'
    });

    try {
      await reAttemptRequest.save();
      console.log('✅ Re-attempt request record created successfully');
    } catch (saveError) {
      console.error('❌ Error saving re-attempt request:', saveError);
      throw saveError;
    }

    // Create notification for exam creator
    const Notification = require('../models/Notification');
    const notification = new Notification({
      recipient: exam.course.teacher._id,
      type: 'exam_reattempt_request',
      title: 'Student Requests Exam Re-attempt',
      message: `${student.name} has requested permission to take the exam "${exam.title}" again`,
      data: {
        studentName: student.name,
        examTitle: exam.title,
        examId: exam._id,
        courseId: exam.course._id,
        reason: reason,
        studentMessage: message,
        requestId: reAttemptRequest._id
      }
    });

    try {
      await notification.save();
      console.log('✅ Contact creator notification sent successfully');
    } catch (notificationError) {
      console.error('❌ Error saving notification:', notificationError);
      // Don't throw here - the re-attempt request was created successfully
      console.log('⚠️ Continuing despite notification error...');
    }

    res.json({
      success: true,
      message: 'Your request has been sent to the exam creator. You will be notified of their decision.',
      data: {
        requestId: reAttemptRequest._id,
        notificationId: notification._id
      }
    });

  } catch (error) {
    console.error('❌ Contact creator error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Provide more specific error messages
    let errorMessage = 'Server error while sending request to exam creator';

    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data provided. Please check your input and try again.';
      console.error('Validation errors:', error.errors);
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid exam or user ID provided.';
    } else if (error.code === 11000) {
      errorMessage = 'You have already submitted a request for this exam.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

// @desc    Debug admin submissions
// @route   GET /api/exams/debug/admin-submissions
// @access  Private (Admin)
const debugAdminSubmissions = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access debug information'
      });
    }

    // Find courses created by this admin
    const courses = await Course.find({ teacher: userId });
    const courseIds = courses.map(course => course._id);

    // Find exams for these courses
    const exams = await Exam.find({ course: { $in: courseIds } });
    const examIds = exams.map(exam => exam._id);

    // Find all submitted attempts
    const allSubmitted = await ExamAttempt.find({
      exam: { $in: examIds },
      status: 'submitted'
    })
    .populate('student', 'name email')
    .populate('exam', 'title')
    .sort({ submittedAt: -1 });

    // Find pending review attempts
    const pendingReview = await ExamAttempt.find({
      exam: { $in: examIds },
      status: 'submitted',
      scorePublished: { $ne: true }
    })
    .populate('student', 'name email')
    .populate('exam', 'title')
    .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        adminId: userId,
        adminName: user.name,
        coursesCount: courses.length,
        examsCount: exams.length,
        allSubmittedCount: allSubmitted.length,
        pendingReviewCount: pendingReview.length,
        allSubmitted: allSubmitted.map(a => ({
          id: a._id,
          student: a.student.name,
          exam: a.exam.title,
          submissionMethod: a.submissionMethod,
          terminatedDueToViolation: a.terminatedDueToViolation,
          scorePublished: a.scorePublished,
          gradingStatus: a.gradingStatus,
          submittedAt: a.submittedAt
        })),
        pendingReview: pendingReview.map(a => ({
          id: a._id,
          student: a.student.name,
          exam: a.exam.title,
          submissionMethod: a.submissionMethod,
          terminatedDueToViolation: a.terminatedDueToViolation,
          scorePublished: a.scorePublished,
          gradingStatus: a.gradingStatus,
          submittedAt: a.submittedAt
        }))
      }
    });

  } catch (error) {
    console.error('Debug admin submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while debugging admin submissions'
    });
  }
};

// @desc    Debug all exams status
// @route   GET /api/exams/debug/all-exams
// @access  Private (Admin)
const debugAllExams = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access debug information'
      });
    }

    // Get ALL exams with their status
    const allExams = await Exam.find({})
      .populate('teacher', 'name role email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    const examsByStatus = {};
    const examsByTeacher = {};

    allExams.forEach(exam => {
      // Group by status
      if (!examsByStatus[exam.status]) {
        examsByStatus[exam.status] = [];
      }
      examsByStatus[exam.status].push(exam);

      // Group by teacher
      const teacherKey = `${exam.teacher.name} (${exam.teacher.role})`;
      if (!examsByTeacher[teacherKey]) {
        examsByTeacher[teacherKey] = [];
      }
      examsByTeacher[teacherKey].push(exam);
    });

    res.json({
      success: true,
      data: {
        totalExams: allExams.length,
        examsByStatus: Object.keys(examsByStatus).reduce((acc, status) => {
          acc[status] = {
            count: examsByStatus[status].length,
            exams: examsByStatus[status].map(exam => ({
              id: exam._id,
              title: exam.title,
              teacher: exam.teacher.name,
              teacherRole: exam.teacher.role,
              course: exam.course.title,
              createdAt: exam.createdAt,
              submittedForReviewAt: exam.submittedForReviewAt
            }))
          };
          return acc;
        }, {}),
        examsByTeacher: Object.keys(examsByTeacher).reduce((acc, teacher) => {
          acc[teacher] = examsByTeacher[teacher].map(exam => ({
            id: exam._id,
            title: exam.title,
            status: exam.status,
            course: exam.course.title,
            createdAt: exam.createdAt
          }));
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Debug all exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while debugging all exams'
    });
  }
};

// @desc    Debug exam review workflow
// @route   GET /api/exams/debug/exam-review
// @access  Private (Admin)
const debugExamReview = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access debug information'
      });
    }

    // 1. Check all admins
    const admins = await User.find({ role: 'Admin' }).select('_id name email');

    // 2. Check all teachers
    const teachers = await User.find({ role: 'Teacher' }).select('_id name email');

    // 3. Check all exams and their statuses
    const allExams = await Exam.find({})
      .populate('teacher', 'name role')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    const examsByStatus = {};
    allExams.forEach(exam => {
      if (!examsByStatus[exam.status]) {
        examsByStatus[exam.status] = [];
      }
      examsByStatus[exam.status].push({
        id: exam._id,
        title: exam.title,
        teacher: exam.teacher.name,
        teacherRole: exam.teacher.role,
        teacherId: exam.teacher._id,
        course: exam.course.title,
        createdAt: exam.createdAt,
        submittedForReviewAt: exam.submittedForReviewAt
      });
    });

    // 4. Check pending review exams specifically
    const pendingExams = await Exam.find({ status: 'pending_review' })
      .populate('teacher', 'name role')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    // 5. Check exam review notifications
    const examReviewNotifications = await Notification.find({
      type: 'exam_review_request'
    })
    .populate('recipient', 'name role')
    .populate('sender', 'name role')
    .sort({ createdAt: -1 })
    .limit(20);

    // 6. What this admin should see
    const examsToReview = await Exam.find({
      status: 'pending_review',
      teacher: { $ne: userId }
    })
    .populate('teacher', 'name role')
    .populate('course', 'title');

    const adminNotifications = await Notification.find({
      recipient: userId,
      type: 'exam_review_request'
    })
    .populate('sender', 'name role')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        currentAdmin: {
          id: userId,
          name: user.name
        },
        systemStats: {
          adminsCount: admins.length,
          teachersCount: teachers.length,
          totalExams: allExams.length
        },
        examsByStatus,
        pendingReviewExams: pendingExams.map(exam => ({
          id: exam._id,
          title: exam.title,
          teacher: exam.teacher.name,
          teacherRole: exam.teacher.role,
          teacherId: exam.teacher._id,
          course: exam.course.title,
          createdAt: exam.createdAt
        })),
        examReviewNotifications: examReviewNotifications.map(n => ({
          id: n._id,
          to: n.recipient.name,
          from: n.sender.name,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
          actionUrl: n.actionUrl
        })),
        currentAdminShouldSee: {
          examsToReview: examsToReview.map(exam => ({
            id: exam._id,
            title: exam.title,
            teacher: exam.teacher.name,
            course: exam.course.title
          })),
          notifications: adminNotifications.map(n => ({
            id: n._id,
            from: n.sender.name,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt
          }))
        }
      }
    });

  } catch (error) {
    console.error('Debug exam review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while debugging exam review'
    });
  }
};

module.exports = {
  createExam,
  submitForReview,
  getTeacherExams,
  getPendingReviewExams,
  reviewExam,
  publishExam,
  getAvailableExams,
  getCourseExams,
  startExamAttempt,
  submitExamAttempt,
  recordViolation,
  getPendingReviewAttempts,
  getAttemptForReview,
  getExamResults,
  publishExamScore,
  testNotification,
  contactCreator,
  debugAdminSubmissions,
  debugExamReview,
  debugAllExams
};
