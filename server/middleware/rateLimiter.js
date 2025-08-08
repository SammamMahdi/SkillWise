const rateLimit = require('express-rate-limit');

// General rate limiter (no limit)
const generalLimiter = rateLimit({
  windowMs: 1, // 1ms window
  max: Number.MAX_SAFE_INTEGER, // effectively no limit
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (no limit)
const authLimiter = rateLimit({
  windowMs: 1,
  max: Number.MAX_SAFE_INTEGER,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiter (no limit)
const apiLimiter = rateLimit({
  windowMs: 1,
  max: Number.MAX_SAFE_INTEGER,
  message: {
    error: 'Too many API requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
};
