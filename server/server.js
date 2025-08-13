const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env' });

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// --- CORS origin helper (supports http/https localhost in dev) ---
const devAllowed = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  'https://localhost:5174'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // non-browser clients
    if (process.env.NODE_ENV === 'production') {
      return cb(null, origin === process.env.FRONTEND_URL);
    }
    return cb(null, devAllowed.includes(origin));
  },
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const path = require('path');
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

// Health check
app.use('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SkillWise API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// JWT Test Route
app.get('/api/test-jwt', (req, res) => {
  const { generateToken } = require('./config/auth');
  const jwt = require('jsonwebtoken');
  const token = generateToken('testuserid123');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ token, decoded });
  } catch (err) {
    res.status(401).json({ error: 'JWT verification failed', details: err.message });
  }
});

// Google Client Test Route
app.get('/api/test-google-client', (req, res) => {
  try {
    const { OAuth2Client } = require('google-auth-library');
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    res.json({
      success: true,
      message: 'Google client initialized successfully',
      clientId: process.env.GOOGLE_CLIENT_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Google client initialization failed',
      details: error.message
    });
  }
});

// ---- API Routes (core) ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/parent', require('./routes/parent'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/exams', require('./routes/exams'));
// app.use('/api/modules', require('./routes/modules'));

// ---- Username routes (public availability + set username) ----
app.use('/api', require('./routes/username'));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 SkillWise Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
