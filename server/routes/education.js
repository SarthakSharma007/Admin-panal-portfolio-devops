const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/education - Get all education records
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM education ORDER BY start_date DESC'
    );
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education records',
      error: error.message
    });
  }
});

// GET /api/education/:id - Get single education record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await promisePool.execute(
      'SELECT * FROM education WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching education record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education record',
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

// POST /api/education - Create new education record (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      degree, 
      institution, 
      location, 
      start_date, 
      end_date, 
      current, 
      gpa, 
      description 
    } = req.body;
    
    const cleanStartDate = formatDateForDb(start_date);
    const cleanEndDate = formatDateForDb(end_date);
    const isCurrent = current ? 1 : 0;

    if (!degree || !institution || !cleanStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Degree, institution, and start_date are required'
      });
    }

    // Deduplication check
    const [existing] = await promisePool.execute(
      'SELECT * FROM education WHERE degree = ? AND institution = ? AND start_date = ?',
      [degree, institution, cleanStartDate]
    );

    if (existing.length > 0) {
      await promisePool.execute(
        'UPDATE education SET location = ?, end_date = ?, current = ?, gpa = ?, description = ? WHERE id = ?',
        [location || null, cleanEndDate, isCurrent, gpa || null, description || null, existing[0].id]
      );
      return res.status(200).json({
        success: true,
        message: 'Education record updated successfully',
        data: { id: existing[0].id, ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
      });
    }
    
    try {
      const [result] = await promisePool.execute(
        'INSERT INTO education (degree, institution, location, start_date, end_date, current, gpa, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [degree, institution, location || null, cleanStartDate, cleanEndDate, isCurrent, gpa || null, description || null]
      );
      
      return res.status(201).json({
        success: true,
        message: 'Education record created successfully',
        data: { id: result.insertId, ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
      });
    } catch (insertErr) {
      if (insertErr.code === 'ER_DUP_ENTRY') {
        const [dup] = await promisePool.execute(
          'SELECT * FROM education WHERE degree = ? AND institution = ? AND start_date = ?',
          [degree, institution, cleanStartDate]
        );
        return res.status(200).json({
          success: true,
          message: 'Education record already exists',
          data: dup[0] || { ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
        });
      }
      throw insertErr;
    }
  } catch (error) {
    console.error('Error creating education record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create education record',
      error: error.message
    });
  }
});

// PUT /api/education/:id - Update education record (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      degree, 
      institution, 
      location, 
      start_date, 
      end_date, 
      current, 
      gpa, 
      description 
    } = req.body;

    const cleanStartDate = formatDateForDb(start_date);
    const cleanEndDate = formatDateForDb(end_date);
    const isCurrent = current ? 1 : 0;
    
    const [result] = await promisePool.execute(
      'UPDATE education SET degree = ?, institution = ?, location = ?, start_date = ?, end_date = ?, current = ?, gpa = ?, description = ? WHERE id = ?',
      [degree, institution, location || null, cleanStartDate, cleanEndDate, isCurrent, gpa || null, description || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Education record updated successfully',
      data: { id: Number(id), ...req.body, start_date: cleanStartDate, end_date: cleanEndDate }
    });
  } catch (error) {
    console.error('Error updating education record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update education record',
      error: error.message
    });
  }
});

// DELETE /api/education/:id - Delete education record (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await promisePool.execute(
      'DELETE FROM education WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Education record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Education record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting education record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete education record',
      error: error.message
    });
  }
});

module.exports = router;
