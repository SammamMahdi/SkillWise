const { validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// @desc    Send parent request to child
// @route   POST /api/parent/request-child
// @access  Private (Parent)
const requestChildConnection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { childEmail } = req.body;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can send child connection requests'
      });
    }

    // Find child by email
    const child = await User.findOne({ email: childEmail });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child account not found'
      });
    }

    // Check if already connected
    if (child.parent && child.parent.toString() === parentId) {
      return res.status(400).json({
        success: false,
        message: 'Already connected to this child'
      });
    }

    // Check if request already exists
    if (parent.pendingChildRequests.includes(child._id)) {
      return res.status(400).json({
        success: false,
        message: 'Request already sent to this child'
      });
    }

    // Add to pending requests
    parent.pendingChildRequests.push(child._id);
    child.pendingParentRequests.push(parentId);
    await parent.save();
    await child.save();

    // Create notification for child
    const notification = new Notification({
      recipient: child._id,
      sender: parentId,
      type: 'parent_request',
      title: 'Parent Connection Request',
      message: `${parent.name} wants to connect as your parent to monitor your learning progress.`,
      isActionRequired: true,
      actionUrl: '/parent-requests',
      data: {
        parentId: parentId,
        requestId: `${parentId}-${child._id}`
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Parent connection request sent successfully'
    });

  } catch (error) {
    console.error('Request child connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending parent request'
    });
  }
};

// @desc    Accept parent request (by child)
// @route   POST /api/parent/accept-request
// @access  Private (Child)
const acceptParentRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { parentId } = req.body;
    const childId = req.userId;

    // Check if current user is a child (Student)
    const child = await User.findById(childId);
    if (!child || child.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can accept parent requests'
      });
    }

    // Check if request exists
    if (!child.pendingParentRequests.includes(parentId)) {
      return res.status(400).json({
        success: false,
        message: 'No pending request from this parent'
      });
    }

    // Get parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Establish connection
    child.parent = parentId;
    child.parentConfirmed = true;
    child.pendingParentRequests = child.pendingParentRequests.filter(id => id.toString() !== parentId);
    parent.childAccounts.push(childId);
    parent.pendingChildRequests = parent.pendingChildRequests.filter(id => id.toString() !== childId);

    // Unblock child account if it was blocked due to parental approval requirement
    if (child.isAccountBlocked && child.requiresParentalApproval && child.parentConfirmed) {
      child.isAccountBlocked = false;
      child.blockedReason = undefined;
    }

    await child.save();
    await parent.save();

    // Create notification for parent
    const notification = new Notification({
      recipient: parentId,
      sender: childId,
      type: 'child_approval',
      title: 'Parent Request Accepted',
      message: `${child.name} has accepted your parent connection request.`,
      data: {
        childId: childId
      }
    });
    await notification.save();

    // Create notification for child about account unblocking
    if (!child.isAccountBlocked) {
      const unblockNotification = new Notification({
        recipient: childId,
        sender: parentId,
        type: 'account_unblocked',
        title: 'Account Approved',
        message: `Your account has been approved by ${parent.name} and is now active.`,
        data: {
          parentId: parentId
        }
      });
      await unblockNotification.save();
    }

    res.json({
      success: true,
      message: 'Parent connection established successfully',
      data: {
        accountUnblocked: !child.isAccountBlocked
      }
    });

  } catch (error) {
    console.error('Accept parent request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting parent request'
    });
  }
};

// @desc    Reject parent request (by child)
// @route   POST /api/parent/reject-request
// @access  Private (Child)
const rejectParentRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { parentId } = req.body;
    const childId = req.userId;

    // Check if current user is a child (Student)
    const child = await User.findById(childId);
    if (!child || child.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can reject parent requests'
      });
    }

    // Check if request exists
    if (!child.pendingParentRequests.includes(parentId)) {
      return res.status(400).json({
        success: false,
        message: 'No pending request from this parent'
      });
    }

    // Get parent
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Remove from pending requests
    child.pendingParentRequests = child.pendingParentRequests.filter(id => id.toString() !== parentId);
    parent.pendingChildRequests = parent.pendingChildRequests.filter(id => id.toString() !== childId);

    await child.save();
    await parent.save();

    // Create notification for parent
    const notification = new Notification({
      recipient: parentId,
      sender: childId,
      type: 'child_approval',
      title: 'Parent Request Rejected',
      message: `${child.name} has rejected your parent connection request.`,
      data: {
        childId: childId
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Parent request rejected successfully'
    });

  } catch (error) {
    console.error('Reject parent request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting parent request'
    });
  }
};

// @desc    Send parent request to child by email
// @route   POST /api/parent/request-child-by-email
// @access  Private (Parent)
const requestChildByEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { childEmail } = req.body;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can send child connection requests'
      });
    }

    // Find child by email
    const child = await User.findOne({ email: childEmail });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child account not found with this email address'
      });
    }

    // Check if child is already connected
    if (child.parent && child.parent.toString() === parentId) {
      return res.status(400).json({
        success: false,
        message: 'Already connected to this child'
      });
    }

    // Check if request already exists
    if (parent.pendingChildRequests.includes(child._id)) {
      return res.status(400).json({
        success: false,
        message: 'Request already sent to this child'
      });
    }

    // Add to pending requests
    parent.pendingChildRequests.push(child._id);
    child.pendingParentRequests.push(parentId);
    await parent.save();
    await child.save();

    // Create notification for child
    const notification = new Notification({
      recipient: child._id,
      sender: parentId,
      type: 'parent_request',
      title: 'Parent Connection Request',
      message: `${parent.name} wants to connect as your parent to monitor your learning progress.`,
      isActionRequired: true,
      actionUrl: '/parent-requests',
      data: {
        parentId: parentId,
        requestId: `${parentId}-${child._id}`
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Parent connection request sent successfully to child'
    });

  } catch (error) {
    console.error('Request child by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending parent request'
    });
  }
};

// @desc    Get all pending requests for parent (both child requests and parent requests)
// @route   GET /api/parent/all-pending-requests
// @access  Private (Parent)
const getAllPendingRequests = async (req, res) => {
  try {
    const parentId = req.userId;
    console.log('Getting pending requests for parent:', parentId);

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      console.log('User is not a parent:', parent?.role);
      return res.status(403).json({
        success: false,
        message: 'Only parents can view pending requests'
      });
    }

    console.log('Parent pending child requests:', parent.pendingChildRequests);
    console.log('Parent pending parent requests:', parent.pendingParentRequests);

    // Get pending child requests (children who want to connect to this parent)
    const pendingChildRequests = await User.find({
      _id: { $in: parent.pendingChildRequests }
    })
    .select('name email age dateOfBirth profilePhoto createdAt');

    // Get pending parent requests (parents who want to connect to this parent's children)
    const pendingParentRequests = await User.find({
      _id: { $in: parent.pendingParentRequests }
    })
    .select('name email profilePhoto createdAt');

    console.log('Found pending child requests:', pendingChildRequests.length);
    console.log('Found pending parent requests:', pendingParentRequests.length);

    res.json({
      success: true,
      data: { 
        pendingChildRequests,
        pendingParentRequests
      }
    });

  } catch (error) {
    console.error('Get all pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending requests'
    });
  }
};

// @desc    Accept child request (by parent)
// @route   POST /api/parent/accept-child-request
// @access  Private (Parent)
const acceptChildRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { childId } = req.body;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can accept child requests'
      });
    }

    // Check if request exists
    if (!parent.pendingChildRequests.includes(childId)) {
      return res.status(400).json({
        success: false,
        message: 'No pending request from this child'
      });
    }

    // Get child
    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Establish connection
    child.parent = parentId;
    child.parentConfirmed = true;
    child.pendingParentRequests = child.pendingParentRequests.filter(id => id.toString() !== parentId);
    parent.childAccounts.push(childId);
    parent.pendingChildRequests = parent.pendingChildRequests.filter(id => id.toString() !== childId);

    // Unblock child account if it was blocked due to parental approval requirement
    if (child.isAccountBlocked && child.requiresParentalApproval && child.parentConfirmed) {
      child.isAccountBlocked = false;
      child.blockedReason = undefined;
    }

    await child.save();
    await parent.save();

    // Create notification for child
    const notification = new Notification({
      recipient: childId,
      sender: parentId,
      type: 'parent_approval',
      title: 'Parent Request Accepted',
      message: `${parent.name} has accepted your parent connection request.`,
      data: {
        parentId: parentId
      }
    });
    await notification.save();

    // Create notification for child about account unblocking
    if (!child.isAccountBlocked) {
      const unblockNotification = new Notification({
        recipient: childId,
        sender: parentId,
        type: 'account_unblocked',
        title: 'Account Approved',
        message: `Your account has been approved by ${parent.name} and is now active.`,
        data: {
          parentId: parentId
        }
      });
      await unblockNotification.save();
    }

    res.json({
      success: true,
      message: 'Child connection established successfully',
      data: {
        accountUnblocked: !child.isAccountBlocked
      }
    });

  } catch (error) {
    console.error('Accept child request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting child request'
    });
  }
};

// @desc    Reject child request (by parent)
// @route   POST /api/parent/reject-child-request
// @access  Private (Parent)
const rejectChildRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { childId } = req.body;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can reject child requests'
      });
    }

    // Check if request exists
    if (!parent.pendingChildRequests.includes(childId)) {
      return res.status(400).json({
        success: false,
        message: 'No pending request from this child'
      });
    }

    // Get child
    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Remove from pending requests
    child.pendingParentRequests = child.pendingParentRequests.filter(id => id.toString() !== parentId);
    parent.pendingChildRequests = parent.pendingChildRequests.filter(id => id.toString() !== childId);

    await child.save();
    await parent.save();

    // Create notification for child
    const notification = new Notification({
      recipient: childId,
      sender: parentId,
      type: 'parent_approval',
      title: 'Parent Request Rejected',
      message: `${parent.name} has rejected your parent connection request.`,
      data: {
        parentId: parentId
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Child request rejected successfully'
    });

  } catch (error) {
    console.error('Reject child request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting child request'
    });
  }
};

// @desc    Get child accounts for parent
// @route   GET /api/parent/children
// @access  Private (Parent)
const getChildAccounts = async (req, res) => {
  try {
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can access child accounts'
      });
    }

    // Get child accounts with learning data
    const children = await User.find({ parent: parentId })
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken')
      .populate('dashboardData.enrolledCourses.course')
      .populate('dashboardData.certificates.course');

    res.json({
      success: true,
      data: { children }
    });

  } catch (error) {
    console.error('Get child accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching child accounts'
    });
  }
};

// @desc    Get pending parent requests for child
// @route   GET /api/parent/pending-requests
// @access  Private (Child)
const getPendingParentRequests = async (req, res) => {
  try {
    const childId = req.userId;

    // Check if current user is a child (Student)
    const child = await User.findById(childId);
    if (!child || child.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view parent requests'
      });
    }

    // Get pending parent requests
    const pendingParents = await User.find({
      _id: { $in: child.pendingParentRequests }
    })
    .select('name email profilePhoto');

    res.json({
      success: true,
      data: { pendingParents }
    });

  } catch (error) {
    console.error('Get pending parent requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending parent requests'
    });
  }
};

// @desc    Remove child connection (by parent)
// @route   DELETE /api/parent/children/:childId
// @access  Private (Parent)
const removeChildConnection = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can remove child connections'
      });
    }

    // Check if child is connected
    if (!parent.childAccounts.includes(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Child is not connected to this parent'
      });
    }

    // Get child
    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Remove connection
    parent.childAccounts = parent.childAccounts.filter(id => id.toString() !== childId);
    child.parent = undefined;
    child.parentConfirmed = false;

    await parent.save();
    await child.save();

    // Create notification for child
    const notification = new Notification({
      recipient: childId,
      sender: parentId,
      type: 'parent_approval',
      title: 'Parent Connection Removed',
      message: `${parent.name} has removed their connection to your account.`,
      data: {
        parentId: parentId
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Child connection removed successfully'
    });

  } catch (error) {
    console.error('Remove child connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing child connection'
    });
  }
};

// @desc    Get child learning progress
// @route   GET /api/parent/children/:childId/progress
// @access  Private (Parent)
const getChildProgress = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can view child progress'
      });
    }

    // Check if child is connected
    if (!parent.childAccounts.includes(childId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only view progress of your connected children'
      });
    }

    // Get child with learning data
    const child = await User.findById(childId)
      .populate('dashboardData.enrolledCourses.course')
      .populate('dashboardData.certificates.course')
      .populate('dashboardData.skillPosts')
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Calculate progress metrics
    const totalCourses = child.dashboardData.enrolledCourses.length;
    const completedCourses = child.dashboardData.certificates.length;
    const totalSkillPosts = child.dashboardData.skillPosts.length;
    const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

    const progressData = {
      child: {
        name: child.name,
        email: child.email,
        age: child.age,
        dateOfBirth: child.dateOfBirth,
        xp: child.xp,
        credits: child.credits,
        badges: child.badges
      },
      stats: {
        totalCourses,
        completedCourses,
        totalSkillPosts,
        completionRate: Math.round(completionRate * 100) / 100,
        feedbackScore: child.dashboardData.feedbackScore || 0
      },
      enrolledCourses: child.dashboardData.enrolledCourses,
      skillPosts: child.dashboardData.skillPosts,
      certificates: child.dashboardData.certificates
    };

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Get child progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching child progress'
    });
  }
};

// @desc    Approve child account (by parent)
// @route   POST /api/parent/approve-child/:childId
// @access  Private (Parent)
const approveChildAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { childId } = req.params;
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can approve child accounts'
      });
    }

    // Check if child is connected to this parent
    if (!parent.childAccounts.includes(childId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve accounts of your connected children'
      });
    }

    // Get child
    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check if child requires parental approval
    if (!child.requiresParentalApproval) {
      return res.status(400).json({
        success: false,
        message: 'This child account does not require parental approval'
      });
    }

    // Check if child is already approved
    if (!child.isAccountBlocked && child.parentConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Child account is already approved'
      });
    }

    // Approve child account
    child.isAccountBlocked = false;
    child.blockedReason = undefined;
    child.parentConfirmed = true;
    await child.save();

    // Create notification for child
    const notification = new Notification({
      recipient: childId,
      sender: parentId,
      type: 'account_unblocked',
      title: 'Account Approved',
      message: `Your account has been approved by ${parent.name} and is now active.`,
      data: {
        parentId: parentId
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Child account approved successfully',
      data: {
        child: {
          id: child._id,
          name: child.name,
          email: child.email,
          isAccountBlocked: child.isAccountBlocked,
          parentConfirmed: child.parentConfirmed
        }
      }
    });

  } catch (error) {
    console.error('Approve child account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving child account'
    });
  }
};

// @desc    Get pending child approval requests for parent
// @route   GET /api/parent/pending-approvals
// @access  Private (Parent)
const getPendingChildApprovals = async (req, res) => {
  try {
    const parentId = req.userId;

    // Check if current user is a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'Parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can view pending child approvals'
      });
    }

    // Get connected children who need approval
    const pendingChildren = await User.find({
      _id: { $in: parent.childAccounts },
      requiresParentalApproval: true,
      $or: [
        { isAccountBlocked: true },
        { parentConfirmed: false }
      ]
    })
    .select('name email age dateOfBirth isAccountBlocked blockedReason parentConfirmed createdAt');

    res.json({
      success: true,
      data: { pendingChildren }
    });

  } catch (error) {
    console.error('Get pending child approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending child approvals'
    });
  }
};

// Send parent approval request for under-13 users
const requestParentApproval = async (req, res) => {
  try {
    const { parentEmail, parentName } = req.body;
    const childUserId = req.userId;

    // Validate input
    if (!parentEmail || !parentName) {
      return res.status(400).json({ error: 'Parent email and name are required' });
    }

    // Get the child user
    const childUser = await User.findById(childUserId);
    if (!childUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if child is actually under 13
    if (childUser.age >= 13) {
      return res.status(400).json({ error: 'Parental approval not required for users 13 and older' });
    }

    // Check if parent request already sent
    if (childUser.pendingParentRequests && childUser.pendingParentRequests.length > 0) {
      return res.status(400).json({ error: 'Parent request already sent' });
    }

    // Check if parent is already confirmed
    if (childUser.parentConfirmed) {
      return res.status(400).json({ error: 'Parent already confirmed' });
    }

    // Check if parent already exists in system
    let parentUser = await User.findOne({ email: parentEmail.toLowerCase() });
    
    if (parentUser) {
      // Parent exists, add child to their pending requests
      if (!parentUser.pendingChildRequests) {
        parentUser.pendingChildRequests = [];
      }
      
      if (!parentUser.pendingChildRequests.includes(childUserId)) {
        parentUser.pendingChildRequests.push(childUserId);
        await parentUser.save();
      }

      // Add parent to child's pending requests
      childUser.pendingParentRequests = [parentUser._id];
      await childUser.save();

      // Send notification email to existing parent
      try {
        const emailContent = `
          <h2>SkillWise - Child Account Approval Request</h2>
          <p>Hello ${parentUser.name},</p>
          <p>Your child <strong>${childUser.name}</strong> (${childUser.email}) has requested to join SkillWise and needs your approval.</p>
          <p>Please log in to your SkillWise parent account to approve this request:</p>
          <p><a href="${process.env.FRONTEND_URL}/parent/dashboard" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Review Request</a></p>
          <p>Best regards,<br>SkillWise Team</p>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: parentEmail,
          subject: 'SkillWise - Child Account Approval Request',
          html: emailContent
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue without failing the request
      }

    } else {
      // Parent doesn't exist, create invitation
      const invitationToken = crypto.randomBytes(32).toString('hex');
      
      // Create placeholder parent user with invitation token
      parentUser = new User({
        name: parentName.trim(),
        email: parentEmail.toLowerCase(),
        role: 'Parent',
        password: crypto.randomBytes(20).toString('hex'), // Temporary password
        roleConfirmed: false,
        invitationToken,
        invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        pendingChildRequests: [childUserId]
      });
      
      await parentUser.save();

      // Add parent to child's pending requests
      childUser.pendingParentRequests = [parentUser._id];
      await childUser.save();

      // Send invitation email to new parent
      try {
        const invitationLink = `${process.env.FRONTEND_URL}/auth/parent-invitation?token=${invitationToken}`;
        const emailContent = `
          <h2>SkillWise - Parent Account Invitation</h2>
          <p>Hello ${parentName},</p>
          <p>Your child <strong>${childUser.name}</strong> (${childUser.email}) wants to join SkillWise, an educational platform.</p>
          <p>Since they are under 13, we need your approval and for you to create a parent account to supervise their learning.</p>
          <p>Please click the link below to create your parent account and approve your child's access:</p>
          <p><a href="${invitationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Create Parent Account & Approve</a></p>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>SkillWise Team</p>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: parentEmail,
          subject: 'SkillWise - Parent Account Invitation',
          html: emailContent
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue without failing the request
      }
    }

    res.json({ 
      success: true, 
      message: 'Parent approval request sent successfully',
      parentExists: !!parentUser.roleConfirmed
    });

  } catch (error) {
    console.error('Error sending parent request:', error);
    res.status(500).json({ error: 'Failed to send parent request' });
  }
};

// Get parent approval status for under-13 users
const getParentApprovalStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId)
      .populate('parent', 'name email')
      .populate('pendingParentRequests', 'name email');

    res.json({
      requiresParentalApproval: user.requiresParentalApproval,
      parentConfirmed: user.parentConfirmed,
      parent: user.parent,
      pendingRequests: user.pendingParentRequests || []
    });

  } catch (error) {
    console.error('Error getting parent approval status:', error);
    res.status(500).json({ error: 'Failed to get parent approval status' });
  }
};

// Get children for parent dashboard
const getChildren = async (req, res) => {
  try {
    const userId = req.userId;

    const parentUser = await User.findById(userId).populate('children', 'username email parentConfirmed requiresParentalApproval age');

    if (!parentUser) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    if (parentUser.role !== 'Parent') {
      return res.status(403).json({ error: 'Access denied - not a parent account' });
    }

    res.json({
      children: parentUser.children || []
    });
  } catch (error) {
    console.error('Error getting children:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  requestChildConnection,
  requestChildByEmail,
  acceptParentRequest,
  rejectParentRequest,
  acceptChildRequest,
  rejectChildRequest,
  getChildAccounts,
  getPendingParentRequests,
  getAllPendingRequests,
  removeChildConnection,
  getChildProgress,
  approveChildAccount,
  getPendingChildApprovals,
  // New functions for under-13 parental approval
  requestParentApproval,
  getParentApprovalStatus,
  getChildren
}; 