const express = require('express');
// FIX: Destructure the 'promisePool' from the db object
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// --- Multer Setup for File Uploads ---
// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to server/uploads so it matches the express.static path in server.js
    const uploadPath = path.join(__dirname, '..', 'uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allow only images
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    }
});
// --- End Multer Setup ---


// GET /api/personal-info - Fetch personal information
// FIX: Using async/await and promisePool.execute
router.get('/', async (req, res) => {
  try {
    // Assuming there is only one row (or you want the first) with id = 1
    // FIX: Changed to use promisePool.execute
    const [rows] = await promisePool.execute('SELECT * FROM personal_info WHERE id = 1');
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Personal info not found' });
    }
  } catch (err) {
    console.error('Error fetching personal info:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/personal-info - Update personal information
// Use multer to handle multipart/form-data, expecting 'profile_image' and/or 'about_image'
// FIX: Using async/await and promisePool.execute
router.put('/', auth, upload.fields([{ name: 'profile_image', maxCount: 1 }, { name: 'about_image', maxCount: 1 }]), async (req, res) => {
  try {
    const {
      full_name, title, email, phone, location,
      bio, github_url, linkedin_url, resume_url
    } = req.body;

    // FIX: Helper to clean incoming form data
    // Converts "null", "undefined", or actual undefined to JS null for the database
    const cleanValue = (val) => (val === 'null' || val === 'undefined' || val === undefined) ? null : val;

    // Build array of values for the SQL query
    const updateFields = [
      cleanValue(full_name),
      cleanValue(title),
      cleanValue(bio),
      cleanValue(email),
      cleanValue(phone),
      cleanValue(location),
      cleanValue(github_url),
      cleanValue(linkedin_url),
      cleanValue(resume_url)
    ];

    // Start building the SQL query
    let sql = `
      UPDATE personal_info SET
        full_name = ?,
        title = ?,
        bio = ?,
        email = ?,
        phone = ?,
        location = ?,
        github_url = ?,
        linkedin_url = ?,
        resume_url = ?
    `;

    // Only add profile_image to the SQL query if a new file was uploaded
    if (req.files && req.files['profile_image']) {
      const profileImagePath = '/uploads/' + req.files['profile_image'][0].filename;
      sql += `, profile_image = ?`;
      updateFields.push(profileImagePath);
    }

    // Only add about_image to the SQL query if a new file was uploaded
    if (req.files && req.files['about_image']) {
      const aboutImagePath = '/uploads/' + req.files['about_image'][0].filename;
      sql += `, about_image = ?`;
      updateFields.push(aboutImagePath);
    }
    
    // Add the WHERE clause to complete the query
    sql += ` WHERE id = 1`;

    // FIX: Changed to use promisePool.execute
    const [result] = await promisePool.execute(sql, updateFields);

    if (result.affectedRows > 0) {
       // Fetch the updated data to send back to the client
       // FIX: Changed to use promisePool.execute
       const [rows] = await promisePool.execute('SELECT * FROM personal_info WHERE id = 1');
       res.json({ success: true, message: 'Personal info updated', data: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Personal info not found to update' });
    }

  } catch (err) {
    console.error('Error updating personal info:', err);
    // Send back the specific error message
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
  }
});

module.exports = router;

