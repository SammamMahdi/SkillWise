const TeacherApplication = require('../models/TeacherApplication');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Helper function to delete uploaded files
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Submit teacher application
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has a pending or approved application
    const existingApplication = await TeacherApplication.findOne({
      applicant: userId,
      applicationStatus: { $in: ['pending', 'approved'] }
    });
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: existingApplication.applicationStatus === 'approved' 
          ? 'You are already a teacher' 
          : 'You already have a pending application'
      });
    }
    
    // Parse the application data - handle both JSON and form-data
    let parsedData;
    try {
      // Helper function to safely parse JSON strings
      const safeJSONParse = (data, defaultValue = {}) => {
        if (!data) return defaultValue;
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            return parsed || defaultValue;
          } catch (e) {
            console.log(`Failed to parse JSON for:`, data, 'using default:', defaultValue);
            return defaultValue;
          }
        }
        return data || defaultValue;
      };

      // If data is sent as JSON strings in form-data, parse them
      parsedData = {
        personalDetails: safeJSONParse(req.body.personalDetails, {}),
        qualifications: safeJSONParse(req.body.qualifications, {}),
        experience: safeJSONParse(req.body.experience, {}),
        specializations: safeJSONParse(req.body.specializations, []),
        motivation: safeJSONParse(req.body.motivation, {}),
        portfolioLinks: safeJSONParse(req.body.portfolioLinks, [])
      };

      console.log('Parsed portfolioLinks:', parsedData.portfolioLinks, 'Type:', typeof parsedData.portfolioLinks);
    } catch (parseError) {
      console.error('Error parsing application data:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid application data format. Please check your form data.',
        error: 'Data parsing failed'
      });
    }

    // Note: Fields are now optional, so we only validate data structure
    console.log('Raw portfolioLinks from body:', req.body.portfolioLinks);
    console.log('Parsed portfolioLinks:', parsedData.portfolioLinks, 'Type:', typeof parsedData.portfolioLinks, 'IsArray:', Array.isArray(parsedData.portfolioLinks));
    
    const applicationData = {
      applicant: userId,
      personalDetails: parsedData.personalDetails || {},
      qualifications: parsedData.qualifications || {},
      experience: parsedData.experience || {},
      specializations: Array.isArray(parsedData.specializations) ? parsedData.specializations : [],
      motivation: parsedData.motivation || {},
      documents: {
        portfolioLinks: Array.isArray(parsedData.portfolioLinks) ? parsedData.portfolioLinks : []
      }
    };
    
    console.log('Final applicationData.documents.portfolioLinks:', applicationData.documents.portfolioLinks, 'Type:', typeof applicationData.documents.portfolioLinks);
    
    // Handle file uploads
    if (req.files) {
      if (req.files.resume) {
        applicationData.documents.resume = {
          filename: req.files.resume[0].filename,
          originalName: req.files.resume[0].originalname,
          path: req.files.resume[0].path,
          uploadedAt: new Date()
        };
      }
      
      if (req.files.certificates) {
        applicationData.documents.certificates = req.files.certificates.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          certificateType: req.body.certificateTypes ? req.body.certificateTypes[req.files.certificates.indexOf(file)] : 'General',
          uploadedAt: new Date()
        }));
      }
      
      if (req.files.identityDocument) {
        applicationData.documents.identityDocument = {
          filename: req.files.identityDocument[0].filename,
          originalName: req.files.identityDocument[0].originalname,
          path: req.files.identityDocument[0].path,
          uploadedAt: new Date()
        };
      }
    }
    
    // Handle portfolio links (don't double-process them)
    // portfolioLinks are already handled in applicationData.documents.portfolioLinks
    
    // Create and save the application
    const application = new TeacherApplication(applicationData);
    await application.save();
    
    res.status(201).json({
      success: true,
      message: 'Teacher application submitted successfully',
      data: {
        applicationId: application._id,
        status: application.applicationStatus
      }
    });
    
  } catch (error) {
    console.error('Error submitting teacher application:', error);
    
    // Provide specific error messages based on error type
    let userMessage = 'Error submitting application';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      const validationErrors = Object.keys(error.errors).map(key => {
        const err = error.errors[key];
        return `${key}: ${err.message}`;
      });
      userMessage = `Validation failed: ${validationErrors.join(', ')}`;
    } else if (error.name === 'CastError') {
      statusCode = 400;
      userMessage = `Invalid data format for field: ${error.path}. Expected ${error.kind} but received ${typeof error.value}`;
    } else if (error.code === 11000) {
      statusCode = 400;
      userMessage = 'Duplicate application detected. You may already have an application pending.';
    }
    
    res.status(statusCode).json({
      success: false,
      message: userMessage,
      error: error.message,
      details: error.name === 'ValidationError' ? error.errors : undefined
    });
  }
};

// Get user's application status
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const application = await TeacherApplication.findOne({ applicant: userId })
      .populate('applicant', 'name email')
      .populate('adminReview.reviewedBy', 'name email')
      .sort({ submittedAt: -1 });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found'
      });
    }
    
    res.json({
      success: true,
      data: application
    });
    
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// Get all applications (Admin only)
exports.getAllApplications = async (req, res) => {
  try {
    // Check if user has admin permissions
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'Admin' && !user.isSuperUser)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin permissions required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;
    
    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.applicationStatus = status;
    }
    
    // Build aggregation pipeline
    const pipeline = [];
    
    // Match stage
    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query });
    }
    
    // Lookup user details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'applicant',
        foreignField: '_id',
        as: 'applicantDetails'
      }
    });
    
    pipeline.push({
      $unwind: '$applicantDetails'
    });
    
    // Search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'personalDetails.fullName': { $regex: search, $options: 'i' } },
            { 'personalDetails.email': { $regex: search, $options: 'i' } },
            { 'applicantDetails.name': { $regex: search, $options: 'i' } },
            { 'qualifications.fieldOfStudy': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }
    
    // Sort by submission date (newest first)
    pipeline.push({ $sort: { submittedAt: -1 } });
    
    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // Execute aggregation
    const applications = await TeacherApplication.aggregate(pipeline);
    
    // Get total count for pagination
    const totalPipeline = [...pipeline.slice(0, -2)]; // Remove skip and limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await TeacherApplication.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    
    // Get statistics
    const stats = await TeacherApplication.getStats();
    
    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Review application (Admin only)
exports.reviewApplication = async (req, res) => {
  try {
    // Check if user has admin permissions
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'Admin' && !user.isSuperUser)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin permissions required.'
      });
    }

    const { applicationId } = req.params;
    const { action, reviewNotes, rating } = req.body;
    const adminId = req.user.id;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }
    
    const application = await TeacherApplication.findById(applicationId)
      .populate('applicant');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    if (application.applicationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been reviewed'
      });
    }
    
    // Update application status
    application.applicationStatus = action === 'approve' ? 'approved' : 'rejected';
    application.adminReview = {
      reviewedBy: adminId,
      reviewDate: new Date(),
      reviewNotes: reviewNotes || '',
      rating: rating || null
    };
    
    await application.save();
    
    // If approved, update user role to Teacher
    if (action === 'approve') {
      await User.findByIdAndUpdate(application.applicant._id, {
        role: 'Teacher'
      });
    }
    
    res.json({
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: {
        applicationId: application._id,
        status: application.applicationStatus,
        applicantName: application.applicant.name
      }
    });
    
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing application',
      error: error.message
    });
  }
};

// Get application by ID (Admin only)
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await TeacherApplication.findById(applicationId)
      .populate('applicant', 'name email profilePhoto createdAt')
      .populate('adminReview.reviewedBy', 'name email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: application
    });
    
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// Delete application (Admin only - for cleanup)
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await TeacherApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Delete associated files
    const deleteFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };
    
    if (application.documents.resume?.path) {
      deleteFile(application.documents.resume.path);
    }
    
    if (application.documents.certificates) {
      application.documents.certificates.forEach(cert => {
        deleteFile(cert.path);
      });
    }
    
    if (application.documents.identityDocument?.path) {
      deleteFile(application.documents.identityDocument.path);
    }
    
    await TeacherApplication.findByIdAndDelete(applicationId);
    
    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
};
