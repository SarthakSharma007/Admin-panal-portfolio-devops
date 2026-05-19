const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

router.get('/:section', async (req, res) => {
  const { section } = req.params;
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM section_settings WHERE section_name = ?',
      [section]
    );
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Section settings not found' });
    }
  } catch (err) {
    console.error('Error fetching section settings:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.put('/:section', auth, async (req, res) => {
  const { section } = req.params;
  const { subtitle, title, title_highlight, title_gradient, description } = req.body;
  try {
    const [result] = await promisePool.execute(
      `UPDATE section_settings 
       SET subtitle=?, title=?, title_highlight=?, title_gradient=?, description=? 
       WHERE section_name=?`,
      [subtitle, title, title_highlight, title_gradient, description, section]
    );
    
    if (result.affectedRows === 0) {
      await promisePool.execute(
        `INSERT INTO section_settings (section_name, subtitle, title, title_highlight, title_gradient, description)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         subtitle=VALUES(subtitle), title=VALUES(title), title_highlight=VALUES(title_highlight), title_gradient=VALUES(title_gradient), description=VALUES(description)`,
        [section, subtitle, title, title_highlight, title_gradient, description]
      );
    }
    
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    console.error('Error updating section settings:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
