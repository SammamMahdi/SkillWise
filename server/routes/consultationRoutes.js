const express = require('express');
const { createConsultationRequest, getTeacherConsultationRequests, getStudentConsultationRequests, updateConsultationRequestStatus } = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // For handling optional attachment

const router = express.Router();

// Support single file attachment named "attachments" (aligns with client form)
router.post('/', protect, upload.single('attachments'), createConsultationRequest);
router.get('/teacher', protect, getTeacherConsultationRequests);
router.get('/student', protect, getStudentConsultationRequests);
router.put('/:requestId/status', protect, updateConsultationRequestStatus);

module.exports = router;
