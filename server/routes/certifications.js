const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

// GET all certifications
router.get('/', async (req, res) => {
    try {
        const [rows] = await promisePool.execute(
          'SELECT id, cert_name AS name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, image_url, created_at, updated_at FROM certifications ORDER BY issue_date DESC'
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error('Error fetching certifications:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch certifications',
            error: err.message 
        });
    }
});

// POST a new certification (Admin only)
router.post('/', auth, async (req, res) => {
    const { name, issuing_organization, issue_date, credential_id } = req.body;

    if (!name || !issuing_organization) {
        return res.status(400).json({ success: false, message: 'Name and issuing_organization are required' });
    }

    try {
        const [result] = await promisePool.execute(
            'INSERT INTO certifications (cert_name, issuing_organization, issue_date, credential_id) VALUES (?, ?, ?, ?)',
            [name, issuing_organization, issue_date || null, credential_id || null]
        );
        res.status(201).json({
            success: true,
            message: 'Certification created successfully',
            data: { id: result.insertId, name, issuing_organization, issue_date, credential_id }
        });
    } catch (err) {
        console.error('Error creating certification:', err);
        res.status(500).json({ success: false, message: 'Failed to create certification', error: err.message });
    }
});

// PUT /api/certifications/:id - Update certification (Admin only)
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { name, issuing_organization, issue_date, credential_id } = req.body;

    try {
        const [result] = await promisePool.execute(
            'UPDATE certifications SET cert_name = ?, issuing_organization = ?, issue_date = ?, credential_id = ? WHERE id = ?',
            [name, issuing_organization, issue_date || null, credential_id || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Certification not found' });
        }

        res.json({
            success: true,
            message: 'Certification updated successfully',
            data: { id, name, issuing_organization, issue_date, credential_id }
        });
    } catch (err) {
        console.error('Error updating certification:', err);
        res.status(500).json({ success: false, message: 'Failed to update certification', error: err.message });
    }
});

// DELETE /api/certifications/:id - Delete certification (Admin only)
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await promisePool.execute('DELETE FROM certifications WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Certification not found' });
        }

        res.json({ success: true, message: 'Certification deleted successfully' });
    } catch (err) {
        console.error('Error deleting certification:', err);
        res.status(500).json({ success: false, message: 'Failed to delete certification', error: err.message });
    }
});

module.exports = router;