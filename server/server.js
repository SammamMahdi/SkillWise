// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const compression = require("compression");
// const morgan = require("morgan");
// // Updated to use port 5001
// const https = require("https");
// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// const connectDB = require("./config/database");
// const errorHandler = require("./middleware/errorHandler");
// const { generalLimiter } = require("./middleware/rateLimiter");

// const app = express();

// // Handle OPTIONS requests immediately (before any other middleware)
// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     console.log('Early OPTIONS request received:', req.url);
//     res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
//     res.header('Access-Control-Allow-Credentials', 'true');
//     res.header('Access-Control-Max-Age', '86400');
//     res.status(204).end();
//     return;
//   }
//   next();
// });

// // Connect to MongoDB
// connectDB();

// // Security middleware with CORS-friendly configuration
// app.use(helmet({
//   crossOriginEmbedderPolicy: false,
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   contentSecurityPolicy: false,
//   crossOriginOpenerPolicy: false
// }));

// // --- CORS origin helper ---
// const allowedOrigins = process.env.ALLOWED_ORIGINS 
//   ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
//   : [process.env.FRONTEND_URL || 'http://localhost:5173'];

// const corsOptions = {
//   origin: (origin, cb) => {
//     if (!origin) return cb(null, true); // non-browser clients
//     if (process.env.NODE_ENV === "production") {
//       return cb(null, allowedOrigins.includes(origin));
//     }
//     return cb(null, allowedOrigins.includes(origin));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
//   exposedHeaders: ['Content-Length', 'X-Requested-With'],
//   preflightContinue: false,
//   optionsSuccessStatus: 204,
//   maxAge: 86400 // Cache preflight response for 24 hours
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
// // Compression middleware
// app.use(compression());

// // Logging middleware
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

// // Rate limiting
// app.use(generalLimiter);

// // Body parsing middleware
// app.use(express.json({ limit: process.env.MAX_FILE_SIZE || "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || "10mb" }));

// app.use("/uploads", require("express").static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads")));

// // Health check
// app.use("/api/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "SkillWise API is running",
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || "development",
//   });
// });

// // JWT Test Route
// app.get("/api/test-jwt", (req, res) => {
//   const { generateToken } = require("./config/auth");
//   const jwt = require("jsonwebtoken");
//   const token = generateToken("testuserid123");
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     res.json({ token, decoded });
//   } catch (err) {
//     res
//       .status(401)
//       .json({ error: "JWT verification failed", details: err.message });
//   }
// });

// // Google Client Test Route
// app.get("/api/test-google-client", (req, res) => {
//   try {
//     const { OAuth2Client } = require("google-auth-library");
//     const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//     res.json({
//       success: true,
//       message: "Google client initialized successfully",
//       clientId: process.env.GOOGLE_CLIENT_ID,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Google client initialization failed",
//       details: error.message,
//     });
//   }
// });

// // CORS Test Route
// app.get("/api/test-cors", (req, res) => {
//   res.json({
//     success: true,
//     message: "CORS test successful",
//     timestamp: new Date().toISOString(),
//     origin: req.headers.origin
//   });
// });

// // Add debugging middleware for CORS issues
// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     console.log('OPTIONS request received:', req.url);
//     console.log('Origin:', req.headers.origin);
//     console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
//     console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
//   }
//   next();
// });

// // ---- API Routes (core) ----
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/users", require("./routes/users"));
// app.use("/api/admin", require("./routes/admin"));
// app.use("/api/child", require("./routes/child"));
// app.use("/api/parent", require("./routes/parent"));
// app.use("/api/superuser", require("./routes/superuser"));
// app.use("/api/skills", require("./routes/skills"));
// app.use("/api/messages", require("./routes/messages"));
// app.use("/api/friend-chat", require("./routes/friendChat"));
// app.use("/api/notifications", require("./routes/notifications"));
// app.use("/api/learning", require("./routes/learning"));
// app.use("/api/courses", require("./routes/courses"));
// app.use("/api/friends", require("./routes/friends"));
// app.use("/api/exams", require("./routes/exams"));
// app.use("/api/payments", require("./routes/payments"));
// app.use("/api/teacher-applications", require("./routes/teacherApplication"));
// app.use("/api/skill-connect", require("./routes/skillConnect"));
// app.use("/api/ai", require("./routes/ai"));
// app.use("/api/community", require("./routes/community"));
// app.use("/api/notes", require("./routes/notes"));
// app.use('/api/consultations', require('./routes/consultationRoutes'));
// // app.use('/api/modules', require('./routes/modules'));

// // ---- Username routes (public availability + set username) ----
// app.use("/api", require("./routes/username"));

// // Error handling middleware
// app.use(errorHandler);

// // 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// const PORT = process.env.PORT || 5001;

// // SSL Configuration
// let certPath = null;
// let keyPath = null;

// if (process.env.ENABLE_SSL === 'true' && process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH) {
//   const certFullPath = path.resolve(__dirname, process.env.SSL_CERT_PATH);
//   const keyFullPath = path.resolve(__dirname, process.env.SSL_KEY_PATH);
  
//   if (fs.existsSync(certFullPath) && fs.existsSync(keyFullPath)) {
//     certPath = certFullPath;
//     keyPath = keyFullPath;
//   } else {
//     console.log(`⚠️  SSL certificates not found at specified paths:`);
//     console.log(`   Cert: ${certFullPath} - ${fs.existsSync(certFullPath) ? '✅ Exists' : '❌ Not found'}`);
//     console.log(`   Key: ${keyFullPath} - ${fs.existsSync(keyFullPath) ? '✅ Exists' : '❌ Not found'}`);
//   }
// }

// // Check if SSL certificates exist
// if (certPath && keyPath) {
//   console.log(`🔐 Using SSL certificates: ${certPath} and ${keyPath}`);
  
//   try {
//     const httpsOptions = {
//       cert: fs.readFileSync(certPath),
//       key: fs.readFileSync(keyPath)
//     };

//     https.createServer(httpsOptions, app).listen(PORT, () => {
//       console.log(`🚀 SkillWise Server running on HTTPS port ${PORT}`);
//       console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
//       console.log(`🔗 Health check: https://${process.env.VITE_DEV_HOST || 'localhost'}:${PORT}/api/health`);
//       console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
//       console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}`);
//       console.log(`🔐 SSL: Enabled with certificates`);
//     });
//   } catch (error) {
//     console.error(`❌ Failed to start HTTPS server: ${error.message}`);
//     console.log(`🔄 Falling back to HTTP server...`);
//     startHttpServer();
//   }
// } else {
//   console.log(`⚠️  No SSL certificates found or SSL disabled.`);
//   console.log(`🔄 Starting HTTP server...`);
//   startHttpServer();
// }

// function startHttpServer() {
//   app.listen(PORT, () => {
//     console.log(`🚀 SkillWise Server running on HTTP port ${PORT}`);
//     console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
//     console.log(`🔗 Health check: http://${process.env.VITE_DEV_HOST || 'localhost'}:${PORT}/api/health`);
//     console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
//     console.log(`🔑 Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}`);
//     console.log(`⚠️  SSL: Disabled - running on HTTP`);
//   });
// }

// // Handle unhandled promise rejections
// process.on("unhandledRejection", (err, promise) => {
//   console.log(`Error: ${err.message}`);
//   process.exit(1);
// });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

// ---- Initialize app ----
const app = express();

// Handle OPTIONS requests early
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }
  next();
});

// Connect DB
connectDB();

// Security
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [process.env.FRONTEND_URL || "http://localhost:5173"];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Utilities
app.use(compression());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.use(generalLimiter);
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || "10mb" }));
app.use(
  "/uploads",
  require("express").static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads"))
);

// Health check
app.use("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SkillWise API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ---- API Routes ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/child", require("./routes/child"));
app.use("/api/parent", require("./routes/parent"));
app.use("/api/superuser", require("./routes/superuser"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/friend-chat", require("./routes/friendChat"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/learning", require("./routes/learning"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/friends", require("./routes/friends"));
app.use("/api/exams", require("./routes/exams"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/teacher-applications", require("./routes/teacherApplication"));
app.use("/api/skill-connect", require("./routes/skillConnect"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/community", require("./routes/community"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/consultations", require("./routes/consultationRoutes"));
app.use("/api", require("./routes/username"));

// Error handling
app.use(errorHandler);
app.use("*", (req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ---- Export for Vercel ----
const serverless = require("serverless-http");
module.exports = serverless(app);

// ---- Local dev only ----
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 SkillWise API running locally on http://localhost:${PORT}`);
  });
}


