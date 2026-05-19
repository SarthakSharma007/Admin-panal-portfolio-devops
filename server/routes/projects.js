const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');

// Helper: parse JSON fields safely
const parseProject = (row) => {
  try { row.tech_stack_json = row.tech_stack_json ? JSON.parse(row.tech_stack_json) : []; } catch { row.tech_stack_json = []; }
  try { row.timeline_json  = row.timeline_json  ? JSON.parse(row.timeline_json)  : []; } catch { row.timeline_json  = []; }
  try { row.learnings_json = row.learnings_json ? JSON.parse(row.learnings_json) : []; } catch { row.learnings_json = []; }
  return row;
};

// GET /api/projects — public, featured only
router.get('/', async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM projects WHERE featured = 1 ORDER BY created_at ASC'
    );
    res.json({ success: true, data: rows.map(parseProject), count: rows.length });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message });
  }
});

// GET /api/projects/admin/all — admin, all projects
router.get('/admin/all', auth, async (req, res) => {
  try {
    const [rows] = await promisePool.execute('SELECT * FROM projects ORDER BY created_at ASC');
    res.json({ success: true, data: rows.map(parseProject), count: rows.length });
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message });
  }
});

// GET /api/projects/slug/:slug — public, by slug for detail page
router.get('/slug/:slug', async (req, res) => {
  try {
    const [rows] = await promisePool.execute('SELECT * FROM projects WHERE slug = ?', [req.params.slug]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: parseProject(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await promisePool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: parseProject(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
  }
});

// POST /api/projects — create
router.post('/', auth, async (req, res) => {
  try {
    const {
      title, description, tech_stack, github_link, demo_link, image_url, featured,
      slug, num, label, short_desc, gradient, accent_a, accent_b, hero,
      overview, problem, solution, tech_stack_json, timeline_json, learnings_json
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const normalizedFeatured = featured === true || featured === 1 || featured === '1' ? 1 : 0;
    const normalizedHero     = hero     === true || hero     === 1 || hero     === '1' ? 1 : 0;

    const [result] = await promisePool.execute(
      `INSERT INTO projects
        (title, description, tech_stack, github_link, demo_link, image_url, featured,
         slug, num, label, short_desc, gradient, accent_a, accent_b, hero,
         overview, problem, solution, tech_stack_json, timeline_json, learnings_json)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title, description || null, tech_stack || null, github_link || null, demo_link || null, image_url || null, normalizedFeatured,
        slug || null, num || null, label || null, short_desc || null, gradient || null, accent_a || null, accent_b || null, normalizedHero,
        overview || null, problem || null, solution || null,
        tech_stack_json ? JSON.stringify(tech_stack_json) : null,
        timeline_json   ? JSON.stringify(timeline_json)   : null,
        learnings_json  ? JSON.stringify(learnings_json)  : null,
      ]
    );

    res.status(201).json({ success: true, message: 'Project created', data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project', error: error.message });
  }
});

// PUT /api/projects/:id — update
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, tech_stack, github_link, demo_link, image_url, featured,
      slug, num, label, short_desc, gradient, accent_a, accent_b, hero,
      overview, problem, solution, tech_stack_json, timeline_json, learnings_json
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const normalizedFeatured = featured === true || featured === 1 || featured === '1' ? 1 : 0;
    const normalizedHero     = hero     === true || hero     === 1 || hero     === '1' ? 1 : 0;

    const [result] = await promisePool.execute(
      `UPDATE projects SET
        title=?, description=?, tech_stack=?, github_link=?, demo_link=?, image_url=?, featured=?,
        slug=?, num=?, label=?, short_desc=?, gradient=?, accent_a=?, accent_b=?, hero=?,
        overview=?, problem=?, solution=?, tech_stack_json=?, timeline_json=?, learnings_json=?
       WHERE id=?`,
      [
        title, description || null, tech_stack || null, github_link || null, demo_link || null, image_url || null, normalizedFeatured,
        slug || null, num || null, label || null, short_desc || null, gradient || null, accent_a || null, accent_b || null, normalizedHero,
        overview || null, problem || null, solution || null,
        tech_stack_json ? JSON.stringify(tech_stack_json) : null,
        timeline_json   ? JSON.stringify(timeline_json)   : null,
        learnings_json  ? JSON.stringify(learnings_json)  : null,
        id,
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project updated' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await promisePool.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
  }
});

module.exports = router;