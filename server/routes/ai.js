const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { ocrCv } = require('../controllers/aiController');

// Upload CV and perform OCR
router.post('/cv/ocr', protect, upload.single('cv'), ocrCv);

module.exports = router;


