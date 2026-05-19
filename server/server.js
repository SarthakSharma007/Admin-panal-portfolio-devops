// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { promisePool, testConnection } = require('./config/db');

// Routes
const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');
const skillCategoryRoutes = require('./routes/skillCategories');
const sectionSettingsRoutes = require('./routes/sectionSettings');
const certificationRoutes = require('./routes/certifications');
const experienceRoutes = require('./routes/experiences');
const educationRoutes = require('./routes/education');
const messageRoutes = require('./routes/messages');
const personalInfoRoutes = require('./routes/personalInfo');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.ADMIN_PORT || 5001;

// ---------------------------
// ✅ Security & Middleware
// Configure helmet to allow cross-origin resource loading for uploaded images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ✅ Fix for express-rate-limit local issue
app.set('trust proxy', 1);

// ✅ Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ✅ CORS setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// ✅ Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Static files (uploads)
app.use('/uploads', express.static('uploads'));

// ---------------------------
// ✅ API Routes
// ---------------------------
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/skillCategories', skillCategoryRoutes);
app.use('/api/sectionSettings', sectionSettingsRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/personal-info', personalInfoRoutes);
app.use('/api/auth', authRoutes);

// ---------------------------
// ✅ API Health Check Route
// ---------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Admin API is running',
    timestamp: new Date().toISOString()
  });
});

// ---------------------------
// ✅ Liveness & Readiness Endpoints
// - /health  -> quick liveness check (no DB call)
// - /ready   -> readiness check (verifies DB connectivity)
// ---------------------------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', async (req, res) => {
  try {
    // simple DB query to verify connectivity; adapt if you use a different client
    await promisePool.query('SELECT 1');
    return res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('Readiness check failed:', err && err.message ? err.message : err);
    return res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

// ---------------------------
// ✅ 404 Handler
// ---------------------------
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ---------------------------
// Global Error Handler
// ---------------------------
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ---------------------------
// Start Server (after DB test)
// ---------------------------
(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Admin Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server due to database connection error:', err.message);
    process.exit(1);
  }
})();
