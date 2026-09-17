// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

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
const PORT = process.env.PORT || process.env.ADMIN_PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---------------------------
// ✅ Security & Middleware
// Configure helmet to allow cross-origin resource loading for uploaded images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ✅ Fix for express-rate-limit behind Nginx
app.set('trust proxy', 1);

// ✅ Rate limiting middleware — stricter in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ✅ CORS setup — reads allowed origins from environment
const getAllowedOrigins = () => {
  if (NODE_ENV === 'production') {
    const envOrigins = process.env.ADMIN_CORS_ORIGINS
      ? process.env.ADMIN_CORS_ORIGINS.split(',').map(o => o.trim())
      : [];
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !envOrigins.includes(frontendUrl)) {
      envOrigins.push(frontendUrl);
    }
    return envOrigins;
  }
  return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
};

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));

// ✅ Body parsers & Cookie parser
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Static files (uploads)
const portfolioUploadsPath = process.env.PORTFOLIO_UPLOADS_PATH
  ? path.resolve(process.env.PORTFOLIO_UPLOADS_PATH)
  : path.join(__dirname, '..', '..', 'Personal-portfolio-webpage-devops', 'server', 'uploads');
app.use('/uploads', express.static(portfolioUploadsPath));
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
  } catch (err) {
    console.warn('⚠️  Server starting WITHOUT database connection.');
    console.warn('   DB-dependent routes will fail, but env-based login will work.');
    console.warn('   Fix your DB credentials in server/.env to enable full functionality.');
  }

  app.listen(PORT, () => {
    console.log(`✅ Admin Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Base URL: http://localhost:${PORT}/api`);
    console.log(`   Login: ${process.env.ADMIN_EMAIL}`);
  });
})();
