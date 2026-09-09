const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/experiences - Get all experiences
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM experiences ORDER BY start_date DESC'
    );
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experiences',
      error: error.message
    });
  }
});

// GET /api/experiences/:id - Get single experience
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await promisePool.execute(
      'SELECT * FROM experiences WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch experience',
      error: error.message
    });
  }
});

const formatDateForDb = (dateVal) => {
  if (!dateVal) return null;
  const str = typeof dateVal === 'string' ? dateVal.trim() : (dateVal instanceof Date ? dateVal.toISOString() : String(dateVal));
  if (!str) return null;
  const dateOnly = str.split('T')[0].trim();
  return dateOnly || null;
};

// POST /api/experiences - Create new experience (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      title, 
      company, 
      location, 
      start_date, 
      end_date, 
      current, 
      description, 
      technologies, 
      type 
    } = req.body;
    
    const cleanStartDate = formatDateForDb(start_date);
    const cleanEndDate = formatDateForDb(end_date);
    const isCurrent = current ? 1 : 0;

    if (!title || !company || !cleanStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, company, and start_date are required'
      });
    }

    // Deduplication check: if identical record already exists, update and return it
    const [existing] = await promisePool.execute(
      'SELECT * FROM experiences WHERE company = ? AND title = ? AND start_date = ?',
      [company, title, cleanStartDate]
    );

    if (existing.length > 0) {
      await promisePool.execute(
        'UPDATE experiences SET location = ?, end_date = ?, current = ?, description = ?, technologies = ?, type = ? WHERE id = ?',
        [location || null, cleanEndDate, isCurrent, description || null, technologies || null, type || 'Internship', existing[0].id]
      );
      return res.status(200).json({
        success: true,
        message: 'Experience updated successfully',
        data: { id: existing[0].id, ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
      });
    }
    
    try {
      const [result] = await promisePool.execute(
        'INSERT INTO experiences (title, company, location, start_date, end_date, current, description, technologies, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, company, location || null, cleanStartDate, cleanEndDate, isCurrent, description || null, technologies || null, type || 'Internship']
      );
      
      return res.status(201).json({
        success: true,
        message: 'Experience created successfully',
        data: { id: result.insertId, ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
      });
    } catch (insertErr) {
      if (insertErr.code === 'ER_DUP_ENTRY') {
        const [dup] = await promisePool.execute(
          'SELECT * FROM experiences WHERE company = ? AND title = ? AND start_date = ?',
          [company, title, cleanStartDate]
        );
        return res.status(200).json({
          success: true,
          message: 'Experience already exists',
          data: dup[0] || { ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
        });
      }
      throw insertErr;
    }
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create experience',
      error: error.message
    });
  }
});

// PUT /api/experiences/:id - Update experience (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      company, 
      location, 
      start_date, 
      end_date, 
      current, 
      description, 
      technologies, 
      type 
    } = req.body;

    const cleanStartDate = formatDateForDb(start_date);
    const cleanEndDate = formatDateForDb(end_date);
    const isCurrent = current ? 1 : 0;
    
    const [result] = await promisePool.execute(
      'UPDATE experiences SET title = ?, company = ?, location = ?, start_date = ?, end_date = ?, current = ?, description = ?, technologies = ?, type = ? WHERE id = ?',
      [title, company, location || null, cleanStartDate, cleanEndDate, isCurrent, description || null, technologies || null, type || 'Internship', id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: { id: Number(id), ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update experience',
      error: error.message
    });
  }
});

// DELETE /api/experiences/:id - Delete experience (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await promisePool.execute(
      'DELETE FROM experiences WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete experience',
      error: error.message
    });
  }
});

module.exports = router;
