const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');
const User = require('../models/User');
const { verifyToken } = require('../config/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/lecture-content');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for lecture content uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 50);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter for allowed content types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'video': ['.mp4', '.webm', '.ogg', '.mov', '.avi'],
    'pdf': ['.pdf'],
    'document': ['.pdf', '.doc', '.docx', '.txt'],
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  };
  
  const extension = path.extname(file.originalname).toLowerCase();
  const isAllowed = Object.values(allowedTypes).flat().includes(extension);
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${Object.values(allowedTypes).flat().join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video files
    files: 10 // Maximum 10 files per upload
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Upload lecture content files
router.post('/upload/:courseId/:lectureIndex', 
  verifyToken, 
  upload.array('files', 10), 
  handleMulterError,
  async (req, res) => {
    try {
      const { courseId, lectureIndex } = req.params;
      const { contentType, title, description } = req.body;

      // Check if user is teacher/admin
      const user = await User.findById(req.userId).select('role');
      if (!user || !['Teacher', 'Admin'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only teachers and admins can upload lecture content'
        });
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      if (course.teacher.toString() !== req.userId && user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only upload content to your own courses'
        });
      }

      // Check if lecture exists
      const lectureIdx = parseInt(lectureIndex);
      if (lectureIdx < 0 || lectureIdx >= course.lectures.length) {
        return res.status(404).json({
          success: false,
          message: 'Lecture not found'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Process uploaded files
      const uploadedContent = [];
      for (const file of req.files) {
        const extension = path.extname(file.originalname).toLowerCase();
        let type = 'document';
        
        if (['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(extension)) {
          type = 'video';
        } else if (extension === '.pdf') {
          type = 'pdf';
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
          type = 'image';
        }

        const contentItem = {
          type: type,
          title: title || file.originalname,
          url: `/uploads/lecture-content/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        };

        // Add type-specific metadata
        if (type === 'video') {
          contentItem.videoType = 'direct';
        } else if (type === 'pdf') {
          contentItem.pdfSize = file.size;
        }

        uploadedContent.push(contentItem);
      }

      // Add content to lecture
      course.lectures[lectureIdx].content.push(...uploadedContent);
      course.updatedAt = new Date();
      await course.save();

      res.json({
        success: true,
        message: 'Content uploaded successfully',
        data: uploadedContent
      });

    } catch (error) {
      console.error('Upload lecture content error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading content'
      });
    }
  }
);

// Serve lecture content files
router.get('/file/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Security check - ensure the file is within the uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Set appropriate headers based on file type
    const extension = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };

    const mimeType = mimeTypes[extension] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    
    // For PDFs and videos, set headers for inline viewing
    if (extension === '.pdf' || extension.startsWith('.mp4') || extension.startsWith('.webm')) {
      res.setHeader('Content-Disposition', 'inline');
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Serve file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while serving file'
    });
  }
});

// Delete lecture content
router.delete('/:courseId/:lectureIndex/:contentIndex', verifyToken, async (req, res) => {
  try {
    const { courseId, lectureIndex, contentIndex } = req.params;

    // Check if user is teacher/admin
    const user = await User.findById(req.userId).select('role');
    if (!user || !['Teacher', 'Admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can delete lecture content'
      });
    }

    // Find course and verify ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== req.userId && user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete content from your own courses'
      });
    }

    // Check if lecture and content exist
    const lectureIdx = parseInt(lectureIndex);
    const contentIdx = parseInt(contentIndex);
    
    if (lectureIdx < 0 || lectureIdx >= course.lectures.length) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    const lecture = course.lectures[lectureIdx];
    if (contentIdx < 0 || contentIdx >= lecture.content.length) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Get content to delete
    const contentToDelete = lecture.content[contentIdx];
    
    // Delete file from filesystem if it's an uploaded file
    if (contentToDelete.filename) {
      const filePath = path.join(uploadsDir, contentToDelete.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove content from array
    lecture.content.splice(contentIdx, 1);
    course.updatedAt = new Date();
    await course.save();

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete lecture content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting content'
    });
  }
});

module.exports = router;
