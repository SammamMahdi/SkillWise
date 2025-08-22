const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ocrCv, recommendCourses, recommendCoursesFromText } = require('../controllers/aiController');

// Upload CV and perform OCR
router.post('/cv/ocr', protect, upload.single('cv'), ocrCv);
router.post('/cv/recommend', protect, recommendCourses);
router.post('/cv/recommend-from-text', protect, recommendCoursesFromText);

module.exports = router;


