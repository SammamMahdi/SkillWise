const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, hashPassword, comparePassword } = require('../config/auth');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Google OAuth client
console.log('Initializing Google OAuth client with ID:', process.env.GOOGLE_CLIENT_ID);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Password strength validation using zxcvbn
const validatePasswordStrength = (password) => {
  // Basic strength validation (you can integrate zxcvbn library)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  const isLongEnough = password.length >= 12;
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar || !isLongEnough) {
    return { isValid: false, score: 0 };
  }
  
  // Calculate basic score
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) score++;
  if (password.length >= 20) score++;
  
  return { isValid: true, score: Math.min(score, 4) };
};

// Generate email verification token
const generateEmailToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, age, dateOfBirth, requiresParentalApproval, parentEmail } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateEmailToken();

    // Calculate age from date of birth if provided
    let calculatedAge = age;
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    // Check if user is under 13 and requires parental approval (all new users are Students by default)
    const isUnder13 = calculatedAge && calculatedAge < 13;
    const needsParentalApproval = isUnder13;

    // For under-13 students, parental approval is mandatory and account is automatically blocked
    if (isUnder13) {
      console.log('Under-13 user registration, blocking account and requiring parent email');
    }    // Validate parent email for students under 13
    if (needsParentalApproval && !parentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Parent email address is required for students under 13'
      });
    }

    // Create user (role defaults to 'Student' in the model)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      age: calculatedAge,
      dateOfBirth,
      requiresParentalApproval: needsParentalApproval,
      isAccountBlocked: needsParentalApproval,
      status: isUnder13 ? 'inactive' : 'active', // Set status to inactive for under-13 users
      blockedReason: needsParentalApproval ? 'Account requires parental approval' : undefined,
      emailVerificationToken,
      emailVerified: false,
      isFirstTimeUser: true // Flag to indicate this user needs to complete setup
    });

    await user.save();

    // If student under 13, automatically send parent request
    if (needsParentalApproval && parentEmail) {
      try {
        console.log('Setting up parent request for child:', email, 'Parent email:', parentEmail);
        
        // Find or create parent account
        let parent = await User.findOne({ email: parentEmail });
        
        if (!parent) {
          console.log('Creating placeholder parent account for:', parentEmail);
          // Create a placeholder parent account (they'll need to register)
          parent = new User({
            name: 'Parent of ' + name,
            email: parentEmail,
            role: 'Parent',
            roleConfirmed: true,
            emailVerified: false,
            isAccountBlocked: false
          });
          await parent.save();
          console.log('Created parent account:', parent._id);
        } else {
          console.log('Found existing parent account:', parent._id);
        }

        // Send parent request
        if (parent.role === 'Parent') {
          console.log('Adding child to parent pending requests');
          // Add to pending requests
          parent.pendingChildRequests.push(user._id);
          user.pendingParentRequests.push(parent._id);
          await parent.save();
          await user.save();
          console.log('Parent pending requests updated:', parent.pendingChildRequests);
          console.log('Child pending requests updated:', user.pendingParentRequests);

          // Create notification for parent
          const Notification = require('../models/Notification');
          const notification = new Notification({
            recipient: parent._id,
            sender: user._id,
            type: 'parent_request',
            title: 'Student Registration Request',
            message: `${name} (${email}) has registered as a student and requires your approval to access the platform.`,
            isActionRequired: true,
            actionUrl: '/parent',
            data: {
              childId: user._id,
              requestId: `${parent._id}-${user._id}`
            }
          });
          await notification.save();
          console.log('Notification created for parent');
        }
      } catch (error) {
        console.error('Error sending parent request:', error);
        // Don't fail registration if parent request fails
      }
    }

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
    const emailSent = await sendEmail(
      email,
      'Verify Your SkillWise Account',
      `
        <h2>Welcome to SkillWise!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    );

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateToken(user._id, '7d');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          isFirstTimeUser: user.isFirstTimeUser
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', { id: user._id, role: user.role, isBlocked: user.isAccountBlocked });

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is under 13 and needs parental approval OR has inactive status
    const isUnder13 = user.age && user.age < 13;
    if ((isUnder13 && !user.parentConfirmed) || user.status === 'inactive') {
      console.log('Under-13 user or inactive status needs parental approval:', email);
      
      // Generate a temporary token for the user to submit parent email
      const tempToken = generateToken(user._id, '1h'); // 1 hour expiry
      
      return res.status(403).json({
        success: false,
        message: 'Account requires parental approval',
        requiresParentalApproval: true,
        isAccountBlocked: true,
        isUnder13: true,
        status: user.status,
        blockedReason: 'Account requires parental approval for users under 13',
        tempToken: tempToken,
        userData: {
          name: user.name,
          email: user.email,
          age: user.age
        }
      });
    }

    // Check if account is blocked for other reasons
    if (user.isAccountBlocked && !isUnder13) {
      console.log('Account blocked for user:', email, 'Reason:', user.blockedReason);
      return res.status(403).json({
        success: false,
        message: user.blockedReason || 'Account is blocked',
        requiresParentalApproval: user.requiresParentalApproval && !user.parentConfirmed,
        isAccountBlocked: true,
        blockedReason: user.blockedReason
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateToken(user._id, '7d');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleConfirmed: user.roleConfirmed,
          emailVerified: user.emailVerified,
          preferredLanguage: user.preferredLanguage,
          accessibility: user.accessibility,
          xp: user.xp,
          credits: user.credits,
          badges: user.badges,
          avatarsUnlocked: user.avatarsUnlocked,
          googleId: user.googleId,
          profilePhoto: user.profilePhoto,
          isFirstTimeUser: user.isFirstTimeUser,
          isSuperUser: user.isSuperUser
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Google OAuth authentication
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    console.log('Google auth request received:', req.body);
    const { idToken, role } = req.body;

    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('Google OAuth not configured - missing GOOGLE_CLIENT_ID');
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured. Please set up GOOGLE_CLIENT_ID in your environment variables.'
      });
    }

    if (!idToken) {
      console.log('No idToken provided in request');
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    console.log('idToken received, length:', idToken.length, 'role:', role);

    // Verify Google token
    console.log('Verifying Google token with client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('Token starts with:', idToken.substring(0, 50) + '...');
    console.log('Token ends with:', '...' + idToken.substring(idToken.length - 50));
    
    let email, name, picture, payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      console.log('Google token verification successful');
      payload = ticket.getPayload();
      console.log('Google payload received:', { email: payload.email, name: payload.name });
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      console.error('Full error:', verifyError);
      return res.status(400).json({
        success: false,
        message: 'Google token verification failed',
        error: verifyError.message
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google user with default Student role
      user = new User({
        name: name || 'Google User', // Use Google's name or fallback
        email,
        profilePhoto: picture,
        emailVerified: true,
        googleId: payload.sub,
        role: 'Student', // Default to Student role
        roleConfirmed: true,
        preferredLanguage: 'en', // Default language
        isFirstTimeUser: true, // Flag for first-time setup
        status: 'active' // Default to active for Google users (age will be collected later)
      });
      await user.save();
    } else {
      // Update existing user's Google info
      user.googleId = payload.sub;
      user.profilePhoto = picture;
      user.lastLogin = new Date();
      await user.save();
    }

    // Check if user is under 13 or has inactive status (for existing users)
    const isUnder13 = user.age && user.age < 13;
    if ((isUnder13 && !user.parentConfirmed) || user.status === 'inactive') {
      console.log('Google OAuth: Under-13 user or inactive status needs parental approval:', email);
      
      // Generate a temporary token for the user to submit parent email
      const tempToken = generateToken(user._id, '1h'); // 1 hour expiry
      
      return res.status(403).json({
        success: false,
        message: 'Account requires parental approval',
        requiresParentalApproval: true,
        isAccountBlocked: true,
        isUnder13: true,
        status: user.status,
        blockedReason: 'Account requires parental approval for users under 13',
        tempToken: tempToken,
        userData: {
          name: user.name,
          email: user.email,
          age: user.age
        }
      });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateToken(user._id, '7d');

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleConfirmed: user.roleConfirmed,
          emailVerified: user.emailVerified,
          preferredLanguage: user.preferredLanguage,
          accessibility: user.accessibility,
          xp: user.xp,
          credits: user.credits,
          badges: user.badges,
          avatarsUnlocked: user.avatarsUnlocked,
          googleId: user.googleId,
          profilePhoto: user.profilePhoto,
          isFirstTimeUser: user.isFirstTimeUser,
          isSuperUser: user.isSuperUser
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  // Handle preflight requests properly
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // This would typically handle the OAuth callback
  // For now, redirect to frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/google-callback`);
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailSent = await sendEmail(
      email,
      'Reset Your SkillWise Password',
      `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    );

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet security requirements'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateToken(user._id, '7d');

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// Validate parent invitation token
const validateInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find user with this parent invitation token
    const user = await User.findOne({
      parentInvitationToken: token,
      parentInvitationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    res.json({
      childName: user.username,
      parentName: user.parentName,
      parentEmail: user.parentEmail,
      valid: true
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Accept parent invitation and create parent account
const acceptParentInvitation = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        field: 'password',
        error: 'Password must be at least 8 characters long' 
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ 
        field: 'password',
        error: 'Password must contain uppercase, lowercase, and number' 
      });
    }

    // Find child user with this invitation token
    const childUser = await User.findOne({
      parentInvitationToken: token,
      parentInvitationExpires: { $gt: Date.now() }
    });

    if (!childUser) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    // Check if parent email is already registered
    const existingParent = await User.findOne({ 
      email: childUser.parentEmail,
      role: 'parent'
    });

    let parentUser;

    if (existingParent) {
      // Parent already exists, just link to child
      parentUser = existingParent;
      
      // Add child to parent's children array if not already there
      if (!parentUser.children.includes(childUser._id)) {
        parentUser.children.push(childUser._id);
        await parentUser.save();
      }
    } else {
      // Create new parent account
      const hashedPassword = await hashPassword(password);
      
      parentUser = new User({
        username: childUser.parentName.toLowerCase().replace(/\s+/g, '_'),
        email: childUser.parentEmail,
        password: hashedPassword,
        role: 'parent',
        parentName: childUser.parentName,
        children: [childUser._id],
        emailVerified: true // Auto-verify since they came from invitation email
      });

      await parentUser.save();
    }

    // Update child user - approve and link to parent
    childUser.parentConfirmed = true;
    childUser.requiresParentalApproval = false;
    childUser.parent = parentUser._id;
    childUser.parentInvitationToken = undefined;
    childUser.parentInvitationExpires = undefined;
    await childUser.save();

    // Generate JWT token for parent
    const accessToken = generateToken({
      userId: parentUser._id,
      role: parentUser.role
    });

    // Send notification to child that they've been approved
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: childUser.email,
        subject: 'Account Approved - Welcome to SkillWise!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10B981; text-align: center;">🎉 Your Account Has Been Approved!</h2>
            <p>Hi ${childUser.username},</p>
            <p>Great news! Your parent has approved your SkillWise account. You can now log in and start your learning journey!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/auth/login" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Login to SkillWise</a>
            </div>
            <p>Welcome to the SkillWise community! We're excited to have you on board.</p>
            <hr style="margin: 20px 0; border: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; text-align: center;">SkillWise Learning Platform</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error sending approval notification:', emailError);
      // Don't fail the whole process if email fails
    }

    res.json({
      message: 'Parent account created and child approved successfully',
      accessToken,
      user: {
        id: parentUser._id,
        username: parentUser.username,
        email: parentUser.email,
        role: parentUser.role,
        children: [
          {
            id: childUser._id,
            username: childUser.username,
            email: childUser.email
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error accepting parent invitation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Submit parent email for under-13 users
// @route   POST /api/auth/submit-parent-email
// @access  Private (under-13 users only)
const submitParentEmail = async (req, res) => {
  try {
    const { parentEmail } = req.body;
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is actually under 13
    if (!user.age || user.age >= 13) {
      return res.status(400).json({
        success: false,
        message: 'This feature is only for users under 13'
      });
    }

    // Validate parent email
    if (!parentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Parent email is required'
      });
    }

    // Check if parent email is different from child's email
    if (parentEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Parent email cannot be the same as your email'
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user with parent email and invitation details
    user.parentEmail = parentEmail;
    user.parentInvitationToken = invitationToken;
    user.parentInvitationExpires = expirationDate;
    user.requiresParentalApproval = true;
    user.isAccountBlocked = true;
    user.blockedReason = 'Account requires parental approval for users under 13';
    
    await user.save();

    // Send email to parent
    const invitationLink = `${process.env.CLIENT_URL}/auth/parent-invitation?token=${invitationToken}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SkillWise - Parental Approval Required</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">SkillWise</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Parental Approval Request</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #2563eb; margin-top: 0;">Your Child Needs Your Approval</h2>
          <p>Hello,</p>
          <p>Your child, <strong>${user.name}</strong> (${user.email}), has registered for SkillWise and needs your approval to access the platform.</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Child's Information:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Name:</strong> ${user.name}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Age:</strong> ${user.age} years old</li>
              <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          
          <p>SkillWise is an educational platform designed to help children learn and develop new skills safely. We require parental approval for users under 13 to ensure a safe learning environment.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Approve Your Child's Account</a>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
          <h3 style="color: #92400e; margin-top: 0;">Important Notes:</h3>
          <ul style="color: #92400e;">
            <li>This approval link will expire in 7 days</li>
            <li>You will be able to monitor your child's activity on the platform</li>
            <li>You can revoke access at any time</li>
            <li>If you didn't expect this request, please contact us immediately</li>
          </ul>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>If you have any questions or concerns, please contact our support team.</p>
          <p>This email was sent automatically by SkillWise. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: parentEmail,
      subject: 'SkillWise - Approve Your Child\'s Account',
      html: emailHtml
    });

    res.json({
      success: true,
      message: 'Parent approval request sent successfully',
      parentEmail: parentEmail
    });

  } catch (error) {
    console.error('Error submitting parent email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

// @desc    Update user age and check if under 13
// @route   PUT /api/auth/update-age
// @access  Private
const updateUserAge = async (req, res) => {
  try {
    const { age, dateOfBirth } = req.body;
    const userId = req.user._id;

    // Calculate age from date of birth if provided
    let calculatedAge = age;
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update age
    user.age = calculatedAge;
    if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
    }

    // Check if user is under 13 and update status accordingly
    const isUnder13 = calculatedAge && calculatedAge < 13;
    if (isUnder13) {
      user.status = 'inactive';
      user.isAccountBlocked = true;
      user.requiresParentalApproval = true;
      user.blockedReason = 'Account requires parental approval for users under 13';
      console.log('User is under 13, setting status to inactive:', user.email);
    } else {
      user.status = 'active';
      user.isAccountBlocked = false;
      user.requiresParentalApproval = false;
      user.blockedReason = undefined;
    }

    await user.save();

    // If user is under 13, return error response
    if (isUnder13) {
      const tempToken = generateToken(user._id, '1h');
      
      return res.status(403).json({
        success: false,
        message: 'Account requires parental approval',
        requiresParentalApproval: true,
        isAccountBlocked: true,
        isUnder13: true,
        status: user.status,
        blockedReason: 'Account requires parental approval for users under 13',
        tempToken: tempToken,
        userData: {
          name: user.name,
          email: user.email,
          age: user.age
        }
      });
    }

    res.json({
      success: true,
      message: 'Age updated successfully',
      data: {
        user: {
          _id: user._id,
          age: user.age,
          status: user.status,
          isAccountBlocked: user.isAccountBlocked
        }
      }
    });

  } catch (error) {
    console.error('Update age error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update age',
      error: error.message
    });
  }
};

// @desc    Request parent role (for users 25+)
// @route   POST /api/auth/request-parent-role
// @access  Private
const requestParentRole = async (req, res) => {
  try {
    console.log('Parent role request received:', {
      body: req.body,
      userId: req.userId,
      userObj: req.user
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phoneNumber } = req.body;
    const userId = req.userId;

    // Validate phone number
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Basic phone number validation (enhanced)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[\+]?[1-9][\d]{4,19}$/;
    if (cleanPhone.length < 5 || cleanPhone.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (5-20 characters)'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is 25 or older
    if (!user.age || user.age < 25) {
      return res.status(400).json({
        success: false,
        message: 'You must be 25 or older to request parent role',
        currentAge: user.age
      });
    }

    // Check if user is already a parent
    if (user.role === 'Parent') {
      return res.status(400).json({
        success: false,
        message: 'You already have parent role'
      });
    }

    // Update user to parent role and add phone number
    user.role = 'Parent';
    user.phoneNumber = phoneNumber;
    user.roleConfirmed = true;
    
    await user.save();

    console.log('User promoted to parent role:', {
      email: user.email,
      age: user.age,
      phoneNumber: phoneNumber
    });

    res.json({
      success: true,
      message: 'Successfully assigned parent role',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          age: user.age,
          roleConfirmed: user.roleConfirmed
        }
      }
    });

  } catch (error) {
    console.error('Request parent role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request parent role',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  googleCallback,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  verifyEmail,
  validateInvitation,
  acceptParentInvitation,
  submitParentEmail,
  updateUserAge,
  requestParentRole
}; 