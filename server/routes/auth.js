// routes/auth.js — Hardened Admin Authentication Route
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { promisePool } = require('../config/db');
const { sendSecurityAlertEmail } = require('../config/email');
const auth = require('../middleware/auth');

const router = express.Router();

// -------------------------------------------------------------
// 🛡️ Anti-Brute-Force Rate Limiter
// Max 5 login attempts per 15 minutes per IP address
// -------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Access temporarily restricted for 15 minutes.'
  }
});

// -------------------------------------------------------------
// 🚨 In-Memory Failed Login Tracker & Security Alerting
// -------------------------------------------------------------
const failedAttempts = new Map(); // ip -> { count: number, lastAttempt: timestamp }

// Periodic cleanup of stale tracking entries older than 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [ip, data] of failedAttempts.entries()) {
    if (data.lastAttempt < cutoff) {
      failedAttempts.delete(ip);
    }
  }
}, 15 * 60 * 1000);

const recordFailedAttempt = (ip, attemptedEmail, userAgent) => {
  const current = failedAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  current.count += 1;
  current.lastAttempt = Date.now();
  failedAttempts.set(ip, current);

  // Trigger automated email alert when threshold (3 attempts) is hit
  if (current.count === 3) {
    sendSecurityAlertEmail({
      ip,
      attemptedEmail,
      timestamp: new Date().toLocaleString(),
      userAgent,
      attemptCount: current.count
    }).catch(err => console.error('[SECURITY] Alert email dispatch failed:', err.message));
  }
};

// -------------------------------------------------------------
// 🔐 Secure Constant-Time / Bcrypt Password Verification
// -------------------------------------------------------------
async function verifyPassword(inputPassword) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const plainOrHash = process.env.ADMIN_PASSWORD;

  // 1. Check bcrypt hash from ADMIN_PASSWORD_HASH
  if (hash) {
    return await bcrypt.compare(inputPassword, hash);
  }

  // 2. Check ADMIN_PASSWORD
  if (plainOrHash) {
    // If it's already a bcrypt hash string ($2a$ or $2b$)
    if (plainOrHash.startsWith('$2a$') || plainOrHash.startsWith('$2b$')) {
      return await bcrypt.compare(inputPassword, plainOrHash);
    }
    // If plain text, use constant-time SHA-256 comparison to prevent timing attacks
    const inputDigest = crypto.createHash('sha256').update(inputPassword).digest();
    const storedDigest = crypto.createHash('sha256').update(plainOrHash).digest();
    return crypto.timingSafeEqual(inputDigest, storedDigest);
  }

  return false;
}

// -------------------------------------------------------------
// 🔑 POST /api/auth/login
// -------------------------------------------------------------
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  // 1. Check against Environment Admin Credentials
  if (ADMIN_EMAIL) {
    const isEmailMatch = email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
    const isPasswordMatch = await verifyPassword(password);

    if (isEmailMatch && isPasswordMatch) {
      // Clear failed attempts counter on successful login
      failedAttempts.delete(clientIp);

      // Sign JWT with reduced 2h expiration (hardened from 8h)
      const token = jwt.sign(
        { id: 1, name: 'Admin', email: ADMIN_EMAIL },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Set httpOnly cookie for defense-in-depth against XSS
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
      });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: { id: 1, name: 'Admin', email: ADMIN_EMAIL }
      });
    }
  }

  // 2. Check DB users table fallback if configured
  try {
    const [rows] = await promisePool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        failedAttempts.delete(clientIp);

        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email },
          JWT_SECRET,
          { expiresIn: '2h' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 2 * 60 * 60 * 1000
        });

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: { id: user.id, name: user.name, email: user.email }
        });
      }
    }
  } catch (err) {
    // If table doesn't exist, proceed to record failed attempt
  }

  // Record failed attempt and trigger alert if threshold reached
  recordFailedAttempt(clientIp, email, userAgent);
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// -------------------------------------------------------------
// 🔍 GET /api/auth/verify — Verify token health
// -------------------------------------------------------------
router.get('/verify', auth, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
});

// -------------------------------------------------------------
// 🚪 POST /api/auth/logout — Invalidate cookie session
// -------------------------------------------------------------
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
