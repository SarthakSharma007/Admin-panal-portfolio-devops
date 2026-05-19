const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

// ---------------------------
// ✅ GET all skill categories
// ---------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT id, category_id, label, gradient, glow, textColor, span FROM skill_categories ORDER BY id ASC'
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('Error fetching skill categories:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------
// ✅ POST a new skill category
// ---------------------------
router.post('/', auth, async (req, res) => {
  const { category_id, label, gradient, glow, textColor, span } = req.body;

  if (!category_id || !label) {
    return res.status(400).json({ error: 'category_id and label are required' });
  }

  try {
    const [result] = await promisePool.execute(
      'INSERT INTO skill_categories (category_id, label, gradient, glow, textColor, span) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, label, gradient || null, glow || null, textColor || null, span || 'half']
    );
    res.status(201).json({ success: true, data: { id: result.insertId, category_id, label, gradient, glow, textColor, span } });
  } catch (err) {
    console.error('Error adding skill category:', err);
    res.status(500).json({ error: 'Server error (category_id must be unique)' });
  }
});

// ---------------------------
// ✅ PUT (Update a skill category)
// ---------------------------
router.put('/:id', auth, async (req, res) => {
  const { category_id, label, gradient, glow, textColor, span } = req.body;
  const { id } = req.params;

  if (!category_id || !label) {
    return res.status(400).json({ error: 'category_id and label are required' });
  }

  try {
    const [result] = await promisePool.execute(
      'UPDATE skill_categories SET category_id=?, label=?, gradient=?, glow=?, textColor=?, span=? WHERE id=?',
      [category_id, label, gradient || null, glow || null, textColor || null, span || 'half', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, data: { id, category_id, label, gradient, glow, textColor, span } });
  } catch (err) {
    console.error('Error updating skill category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------
// ✅ DELETE a skill category
// ---------------------------
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    // Optional: Also delete skills associated with this category.
    // For now, we will just delete the category.
    const [cat] = await promisePool.execute('SELECT category_id FROM skill_categories WHERE id=?', [id]);
    if (cat.length > 0) {
      await promisePool.execute('DELETE FROM skills WHERE category=?', [cat[0].category_id]);
    }
    
    const [result] = await promisePool.execute('DELETE FROM skill_categories WHERE id=?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, message: 'Category and associated skills deleted successfully' });
  } catch (err) {
    console.error('Error deleting skill category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
