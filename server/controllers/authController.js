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

    const { name, email, password, role, age, dateOfBirth, requiresParentalApproval, parentEmail } = req.body;

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

    // Check if user is under 13 and requires parental approval
    const isUnder13 = calculatedAge && calculatedAge < 13;
    const needsParentalApproval = isUnder13 && role === 'Student' && requiresParentalApproval;
    
    // For under-13 students, parental approval is mandatory
    if (isUnder13 && role === 'Student' && !requiresParentalApproval) {
      return res.status(400).json({
        success: false,
        message: 'Parental approval is mandatory for students under 13 years old'
      });
    }

    // Validate parent email for students under 13
    if (needsParentalApproval && !parentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Parent email address is required for students under 13'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      age: calculatedAge,
      dateOfBirth,
      requiresParentalApproval: needsParentalApproval,
      isAccountBlocked: needsParentalApproval,
      blockedReason: needsParentalApproval ? 'Account requires parental approval' : undefined,
      emailVerificationToken,
      emailVerified: false
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
          emailVerified: user.emailVerified
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

    // Check if account is blocked
    if (user.isAccountBlocked) {
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
          profilePhoto: user.profilePhoto
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
      // For new users, always require role selection
      if (!role) {
        // Create user without role and return requires role selection
        user = new User({
          name: name || 'Google User', // Use Google's name or fallback
          email,
          profilePhoto: picture,
          emailVerified: true,
          googleId: payload.sub,
          role: null, // No role initially
          preferredLanguage: 'en' // Default language
        });
        await user.save();

        return res.status(200).json({
          success: false,
          message: 'Role selection is required for new users',
          requiresRoleSelection: true,
          userData: {
            name: name || 'Google User',
            email,
            profilePhoto: picture,
            googleId: payload.sub
          }
        });
      } else {
        // Create user with provided role
        user = new User({
          name: name || 'Google User', // Use Google's name or fallback
          email,
          profilePhoto: picture,
          emailVerified: true,
          googleId: payload.sub,
          role: role, // Use provided role
          roleConfirmed: true, // Mark as explicitly chosen
          preferredLanguage: 'en' // Default language
        });
        await user.save();
      }
    } else {
      // Update existing user's Google info
      user.googleId = payload.sub;
      user.profilePhoto = picture;
      user.lastLogin = new Date();
      
      // If role is provided, update it
      if (role) {
        user.role = role;
        user.roleConfirmed = true; // Mark as explicitly chosen
      }
      
      await user.save();
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
          profilePhoto: user.profilePhoto
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
  // This would typically handle the OAuth callback
  // For now, redirect to frontend
  res.redirect(`${process.env.FRONTEND_URL}/auth/google-callback`);
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
  verifyEmail
}; 