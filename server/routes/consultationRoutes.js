const express = require('express');
const { createConsultationRequest, getTeacherConsultationRequests, updateConsultationRequestStatus } = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createConsultationRequest);
router.get('/teacher', protect, getTeacherConsultationRequests);
router.put('/:requestId/status', protect, updateConsultationRequestStatus);

module.exports = router;
