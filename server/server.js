const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: "../.env" });

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

const app = express();

// Handle OPTIONS requests immediately (before any other middleware)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('Early OPTIONS request received:', req.url);
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }
  next();
});

// Connect to MongoDB
connectDB();

// Security middleware with CORS-friendly configuration
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false
}));

// --- CORS origin helper (supports http/https localhost in dev) ---
const devAllowed = ["https://localhost:5173", "http://localhost:5173"];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // non-browser clients
    if (process.env.NODE_ENV === "production") {
      return cb(null, origin === process.env.FRONTEND_URL);
    }
    return cb(null, devAllowed.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", require("express").static(path.join(__dirname, "uploads")));

// Health check
app.use("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SkillWise API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// JWT Test Route
app.get("/api/test-jwt", (req, res) => {
  const { generateToken } = require("./config/auth");
  const jwt = require("jsonwebtoken");
  const token = generateToken("testuserid123");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ token, decoded });
  } catch (err) {
    res
      .status(401)
      .json({ error: "JWT verification failed", details: err.message });
  }
});

// Google Client Test Route
app.get("/api/test-google-client", (req, res) => {
  try {
    const { OAuth2Client } = require("google-auth-library");
    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    res.json({
      success: true,
      message: "Google client initialized successfully",
      clientId: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Google client initialization failed",
      details: error.message,
    });
  }
});

// CORS Test Route
app.get("/api/test-cors", (req, res) => {
  res.json({
    success: true,
    message: "CORS test successful",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Add debugging middleware for CORS issues
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received:', req.url);
    console.log('Origin:', req.headers.origin);
    console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
    console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
  }
  next();
});

// ---- API Routes (core) ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/parent", require("./routes/parent"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/learning", require("./routes/learning"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/friends", require("./routes/friends"));
app.use("/api/exams", require("./routes/exams"));
app.use("/api/payments", require("./routes/payments"));
// app.use('/api/modules', require('./routes/modules'));

// ---- Username routes (public availability + set username) ----
app.use("/api", require("./routes/username"));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

// SSL certificate paths - try multiple possible locations
const possibleCertPaths = [
  path.join(__dirname, '..', 'localhost+2.pem'),
  path.join(__dirname, '..', 'localhost+1.pem'),
  path.join(__dirname, '..', 'localhost.pem'),
  path.join(__dirname, 'localhost+2.pem'),
  path.join(__dirname, 'localhost+1.pem'),
  path.join(__dirname, 'localhost.pem')
];

const possibleKeyPaths = [
  path.join(__dirname, '..', 'localhost+2-key.pem'),
  path.join(__dirname, '..', 'localhost+1-key.pem'),
  path.join(__dirname, '..', 'localhost-key.pem'),
  path.join(__dirname, 'localhost+2-key.pem'),
  path.join(__dirname, 'localhost+1-key.pem'),
  path.join(__dirname, 'localhost-key.pem')
];

// Find the first existing certificate pair
let certPath = null;
let keyPath = null;

for (let i = 0; i < possibleCertPaths.length; i++) {
  if (fs.existsSync(possibleCertPaths[i]) && fs.existsSync(possibleKeyPaths[i])) {
    certPath = possibleCertPaths[i];
    keyPath = possibleKeyPaths[i];
    break;
  }
}

// Check if SSL certificates exist
if (certPath && keyPath) {
  console.log(`🔐 Using SSL certificates: ${certPath} and ${keyPath}`);
  
  try {
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`🚀 SkillWise Server running on HTTPS port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Health check: https://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://localhost:5173'}`);
      console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}`);
      console.log(`🔐 SSL: Enabled with certificates`);
    });
  } catch (error) {
    console.error(`❌ Failed to start HTTPS server: ${error.message}`);
    console.log(`🔄 Falling back to HTTP server...`);
    startHttpServer();
  }
} else {
  console.log(`⚠️  No SSL certificates found. Available paths checked:`);
  possibleCertPaths.forEach((path, index) => {
    console.log(`   ${index + 1}. ${path} - ${fs.existsSync(path) ? '✅ Exists' : '❌ Not found'}`);
  });
  console.log(`🔄 Starting HTTP server...`);
  startHttpServer();
}

function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`🚀 SkillWise Server running on HTTP port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://localhost:5173'}`);
    console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}`);
    console.log(`⚠️  SSL: Disabled - running on HTTP`);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
