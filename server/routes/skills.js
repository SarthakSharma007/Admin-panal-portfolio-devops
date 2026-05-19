// routes/skills.js
const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

// ---------------------------
// ✅ GET all skills
// ---------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT id, skill_name AS name, proficiency_level AS level, category, icon, emoji, bg, created_at, updated_at FROM skills ORDER BY category, skill_name'
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------
// ✅ POST a new skill (protected)
// ---------------------------
router.post('/', auth, async (req, res) => {
  const { name, level, category, icon, emoji, bg } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }

  try {
    const [result] = await promisePool.execute(
      'INSERT INTO skills (skill_name, proficiency_level, category, icon, emoji, bg) VALUES (?, ?, ?, ?, ?, ?)',
      [name, level || 'Intermediate', category, icon || null, emoji || null, bg || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, name, level: level || 'Intermediate', category, icon, emoji, bg } });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------
// ✅ PUT (Update a skill)
// ---------------------------
router.put('/:id', auth, async (req, res) => {
  const { name, level, category, icon, emoji, bg } = req.body;
  const { id } = req.params;

  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }

  try {
    const [result] = await promisePool.execute(
      'UPDATE skills SET skill_name=?, proficiency_level=?, category=?, icon=?, emoji=?, bg=? WHERE id=?',
      [name, level || 'Intermediate', category, icon || null, emoji || null, bg || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ success: true, data: { id, name, level: level || 'Intermediate', category, icon, emoji, bg } });
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------
// ✅ DELETE a skill
// ---------------------------
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await promisePool.execute('DELETE FROM skills WHERE id=?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
