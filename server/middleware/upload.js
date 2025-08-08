const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_').slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ok = ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Only JPG/PNG/WebP allowed'), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 },
});
