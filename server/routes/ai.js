const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ocrCv, recommendCourses, recommendCoursesFromText, storeTempCv, suggestCoursesToAdd, listCourseAddRecommendations, deleteCourseAddRecommendation } = require('../controllers/aiController');

// Upload CV and perform OCR
router.post('/cv/ocr', protect, upload.single('cv'), ocrCv);
router.post('/cv/recommend', protect, recommendCourses);
router.post('/cv/recommend-from-text', protect, recommendCoursesFromText);
router.post('/cv/store-temp', protect, storeTempCv);
router.post('/cv/suggest-add', protect, suggestCoursesToAdd);

// Admin endpoints
router.get('/admin/recommendations', protect, listCourseAddRecommendations);
router.delete('/admin/recommendations/:id', protect, deleteCourseAddRecommendation);

module.exports = router;


