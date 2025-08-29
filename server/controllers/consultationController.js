// controllers/consultationController.js
const ConsultationRequest = require('../models/ConsultationRequest');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification'); // For notifying students on status changes

// Create a new consultation request
const createConsultationRequest = async (req, res) => {
  try {
    // When using multipart/form-data, body values arrive as strings; files are in req.file
    const { courseId, topic, description, proposedDateTime, meetingLink } = req.body;
    const studentId = req.userId;

    const course = await Course.findById(courseId).populate('teacher');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const attachments = [];
    if (req.file) {
      // Store uploaded file path to attachments (single file for now)
      attachments.push(`/uploads/${req.file.filename}`);
    }

    const request = new ConsultationRequest({
      student: studentId,
      teacher: course.teacher._id,
      course: courseId,
      topic,
      description,
      // Ensure proposedDateTime is a Date
      proposedDateTime: proposedDateTime ? new Date(proposedDateTime) : undefined,
      meetingLink,
      attachments
    });

    await request.save();
    res.json({ success: true, message: 'Consultation request sent', data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating consultation request' });
  }
};

// Get requests for a student (their own submissions)
const getStudentConsultationRequests = async (req, res) => {
  try {
    const studentId = req.userId;
    const requests = await ConsultationRequest.find({ student: studentId })
      .populate('teacher', 'name email')
      .populate('course', 'title');

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching student requests' });
  }
};

// Get requests for a teacher
const getTeacherConsultationRequests = async (req, res) => {
  try {
    const teacherId = req.userId;
    const requests = await ConsultationRequest.find({ teacher: teacherId })
      .populate('student', 'name email')
      .populate('course', 'title');

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching requests' });
  }
};

// Update request status (approve/reject)
const updateConsultationRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const request = await ConsultationRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    request.updatedAt = new Date();
    await request.save();

    // Notify student upon status change (approved/rejected)
    try {
      if (status === 'approved' || status === 'rejected') {
        await Notification.create({
          recipient: request.student,
          type: status === 'approved' ? 'consultation_approved' : 'consultation_rejected',
          title: status === 'approved' ? 'Consultation Approved' : 'Consultation Rejected',
          message: `Your consultation request "${request.topic}" has been ${status}.`,
          data: {
            courseId: request.course,
            requestId: String(request._id),
            action: status
          },
          isActionRequired: false
        });
      }
    } catch (notifyErr) {
      // Log but do not fail the main request
      console.error('Failed to create consultation notification:', notifyErr.message);
    }

    res.json({ success: true, message: 'Request updated', data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating request' });
  }
};

module.exports = {
  createConsultationRequest,
  getStudentConsultationRequests,
  getTeacherConsultationRequests,
  updateConsultationRequestStatus
};
