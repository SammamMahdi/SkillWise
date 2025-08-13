const ExamReAttemptRequest = require('../models/ExamReAttemptRequest');
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// @desc    Submit re-attempt request after violation
// @route   POST /api/exams/re-attempt-request
// @access  Private (Student)
const submitReAttemptRequest = async (req, res) => {
  try {
    console.log('=== SUBMIT RE-ATTEMPT REQUEST ===');
    const studentId = req.userId;
    const { attemptId, violationType, violationDetails, studentMessage } = req.body;

    console.log('Student ID:', studentId);
    console.log('Attempt ID:', attemptId);
    console.log('Violation Type:', violationType);

    // Validate input
    if (!attemptId || !violationType || !violationDetails || !studentMessage) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (studentMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message must be less than 500 characters'
      });
    }

    // Find the original attempt
    const originalAttempt = await ExamAttempt.findById(attemptId)
      .populate('exam')
      .populate('student', 'name email');

    if (!originalAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    // Verify the student owns this attempt
    if (originalAttempt.student._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this attempt'
      });
    }

    // Check if request already exists
    const existingRequest = await ExamReAttemptRequest.findOne({
      student: studentId,
      originalAttempt: attemptId
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Re-attempt request already submitted for this exam'
      });
    }

    // Get exam creator
    const exam = await Exam.findById(originalAttempt.exam._id).populate('course');
    const examCreator = exam.course.teacher;

    // Create re-attempt request
    const reAttemptRequest = new ExamReAttemptRequest({
      student: studentId,
      exam: originalAttempt.exam._id,
      course: exam.course._id,
      examCreator: examCreator,
      originalAttempt: attemptId,
      violationType,
      violationDetails,
      studentMessage: studentMessage.trim()
    });

    await reAttemptRequest.save();

    // Create notification for exam creator
    const notification = new Notification({
      recipient: examCreator,
      type: 'exam_reattempt_request',
      title: 'New Re-attempt Request',
      message: `${originalAttempt.student.name} has requested to re-attempt the exam "${originalAttempt.exam.title}" due to violation: ${violationType}`,
      data: {
        requestId: reAttemptRequest._id,
        studentName: originalAttempt.student.name,
        examTitle: originalAttempt.exam.title,
        violationType,
        studentMessage
      }
    });

    await notification.save();

    console.log('✅ Re-attempt request created and notification sent');

    res.json({
      success: true,
      message: 'Re-attempt request submitted successfully. The exam creator will review your request.',
      data: {
        requestId: reAttemptRequest._id,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Submit re-attempt request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting re-attempt request'
    });
  }
};

// @desc    Get re-attempt requests for exam creator
// @route   GET /api/exams/re-attempt-requests
// @access  Private (Teacher/Admin)
const getReAttemptRequests = async (req, res) => {
  try {
    console.log('=== GET RE-ATTEMPT REQUESTS ===');
    const creatorId = req.userId;
    const { status = 'all' } = req.query;

    console.log('Creator ID:', creatorId);
    console.log('Status filter:', status);

    // Build query
    const query = { examCreator: creatorId };
    if (status !== 'all') {
      query.status = status;
    }

    // Get requests
    const requests = await ExamReAttemptRequest.find(query)
      .populate('student', 'name email')
      .populate('exam', 'title')
      .populate('course', 'title')
      .populate('originalAttempt', 'submittedAt violationCount terminatedDueToViolation')
      .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} re-attempt requests`);

    res.json({
      success: true,
      data: {
        requests: requests
      }
    });

  } catch (error) {
    console.error('Get re-attempt requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching re-attempt requests'
    });
  }
};

// @desc    Review re-attempt request (approve/reject)
// @route   PUT /api/exams/re-attempt-requests/:requestId
// @access  Private (Teacher/Admin)
const reviewReAttemptRequest = async (req, res) => {
  try {
    console.log('=== REVIEW RE-ATTEMPT REQUEST ===');
    const creatorId = req.userId;
    const { requestId } = req.params;
    const { action, response } = req.body; // action: 'approve' or 'reject'

    console.log('Creator ID:', creatorId);
    console.log('Request ID:', requestId);
    console.log('Action:', action);

    // Validate input
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    // Find the request
    const request = await ExamReAttemptRequest.findById(requestId)
      .populate('student', 'name email')
      .populate('exam', 'title maxAttempts')
      .populate('course', 'title');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Re-attempt request not found'
      });
    }

    // Verify the creator owns this request
    if (request.examCreator.toString() !== creatorId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to review this request'
      });
    }

    // Check if already reviewed
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed'
      });
    }

    // Update request
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.creatorResponse = response || '';
    request.reviewedAt = new Date();
    request.reviewedBy = creatorId;

    if (action === 'approve') {
      request.newAttemptGranted = true;
    }

    await request.save();

    // Create notification for student
    const notificationTitle = action === 'approve' 
      ? 'Re-attempt Request Approved' 
      : 'Re-attempt Request Rejected';
    
    const notificationMessage = action === 'approve'
      ? `Your request to re-attempt "${request.exam.title}" has been approved. You can now take the exam again.`
      : `Your request to re-attempt "${request.exam.title}" has been rejected. ${response || ''}`;

    const notification = new Notification({
      recipient: request.student._id,
      type: action === 'approve' ? 'exam_reattempt_approved' : 'exam_reattempt_rejected',
      title: notificationTitle,
      message: notificationMessage,
      data: {
        requestId: request._id,
        examTitle: request.exam.title,
        action,
        response
      }
    });

    await notification.save();

    console.log(`✅ Re-attempt request ${action}d and notification sent to student`);

    res.json({
      success: true,
      message: `Re-attempt request ${action}d successfully`,
      data: {
        requestId: request._id,
        status: request.status,
        newAttemptGranted: request.newAttemptGranted
      }
    });

  } catch (error) {
    console.error('Review re-attempt request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing re-attempt request'
    });
  }
};

module.exports = {
  submitReAttemptRequest,
  getReAttemptRequests,
  reviewReAttemptRequest
};
