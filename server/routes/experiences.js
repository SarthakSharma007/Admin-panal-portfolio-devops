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
    
    if (!title || !company || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, company, and start_date are required'
      });
    }
    
    const [result] = await promisePool.execute(
      'INSERT INTO experiences (title, company, location, start_date, end_date, current, description, technologies, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, company, location || null, start_date, end_date || null, current || false, description || null, technologies || null, type || 'Internship']
    );
    
    res.status(201).json({
      success: true,
      message: 'Experience created successfully',
      data: { id: result.insertId, ...req.body }
    });
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
    
    const [result] = await promisePool.execute(
      'UPDATE experiences SET title = ?, company = ?, location = ?, start_date = ?, end_date = ?, current = ?, description = ?, technologies = ?, type = ? WHERE id = ?',
      [title, company, location, start_date, end_date, current, description, technologies, type, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Experience updated successfully'
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
