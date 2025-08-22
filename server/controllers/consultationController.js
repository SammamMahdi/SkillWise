// controllers/consultationController.js
const ConsultationRequest = require('../models/ConsultationRequest');
const User = require('../models/User');
const Course = require('../models/Course');

// Create a new consultation request
const createConsultationRequest = async (req, res) => {
  try {
    const { courseId, topic, description, proposedDateTime, meetingLink, attachments } = req.body;
    const studentId = req.userId;

    const course = await Course.findById(courseId).populate('teacher');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const request = new ConsultationRequest({
      student: studentId,
      teacher: course.teacher._id,
      course: courseId,
      topic,
      description,
      proposedDateTime,
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

    res.json({ success: true, message: 'Request updated', data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating request' });
  }
};

module.exports = {
  createConsultationRequest,
  getTeacherConsultationRequests,
  updateConsultationRequestStatus
};
