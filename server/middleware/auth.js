// middleware/auth.js — Hardened JWT Verification Middleware
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // 1. Try x-auth-token header
  let token = req.header('x-auth-token');

  // 2. Try Authorization: Bearer <token>
  if (!token && req.header('authorization')) {
    const parts = req.header('authorization').split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  // 3. Try HttpOnly Cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        expired: true
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid or forged token.' });
  }
};

module.exports = auth;
