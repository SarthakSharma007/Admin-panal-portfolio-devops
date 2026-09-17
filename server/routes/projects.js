const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const portfolioUploadsPath = process.env.PORTFOLIO_UPLOADS_PATH
      ? path.resolve(process.env.PORTFOLIO_UPLOADS_PATH)
      : path.join(__dirname, '..', '..', '..', 'Personal-portfolio-webpage-devops', 'server', 'uploads');
    
    if (!fs.existsSync(portfolioUploadsPath)) {
      fs.mkdirSync(portfolioUploadsPath, { recursive: true });
    }
    cb(null, portfolioUploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Images only"));
  }
});
// --- End Multer Setup ---

// Helper: parse JSON fields safely
const parseProject = (row) => {
  try { row.tech_stack_json = row.tech_stack_json ? JSON.parse(row.tech_stack_json) : []; } catch { row.tech_stack_json = []; }
  try { row.timeline_json  = row.timeline_json  ? JSON.parse(row.timeline_json)  : []; } catch { row.timeline_json  = []; }
  try { row.learnings_json = row.learnings_json ? JSON.parse(row.learnings_json) : []; } catch { row.learnings_json = []; }
  try { row.images_json = row.images_json ? JSON.parse(row.images_json) : []; } catch { row.images_json = []; }
  return row;
};

// POST /api/projects/upload — Upload a project image
router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  // In production, store the full absolute URL so the portfolio frontend
  // (running on a separate service) can fetch the image from this admin backend.
  // Set ADMIN_PUBLIC_URL=https://admin-backend-zf1c.onrender.com on your Render service.
  const adminPublicUrl = process.env.ADMIN_PUBLIC_URL
    ? process.env.ADMIN_PUBLIC_URL.replace(/\/+$/, '')
    : null;
  const imageUrl = adminPublicUrl
    ? `${adminPublicUrl}/uploads/${req.file.filename}`
    : `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

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
      slug, num, label, short_desc, gradient, accent_a, accent_b, hero, card_size,
      overview, problem, solution, tech_stack_json, timeline_json, learnings_json,
      difficulty_level, images_json, show_github, show_demo, show_details
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const normalizedFeatured = featured === true || featured === 1 || featured === '1' ? 1 : 0;
    const normalizedHero     = hero     === true || hero     === 1 || hero     === '1' ? 1 : 0;

    const [result] = await promisePool.execute(
      `INSERT INTO projects
        (title, description, tech_stack, github_link, demo_link, image_url, featured,
         slug, num, label, short_desc, gradient, accent_a, accent_b, hero, card_size,
         overview, problem, solution, tech_stack_json, timeline_json, learnings_json,
         difficulty_level, images_json, show_github, show_demo, show_details)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        title, description || null, tech_stack || null, github_link || null, demo_link || null, image_url || null, normalizedFeatured,
        slug || null, num || null, label || null, short_desc || null, gradient || null, accent_a || null, accent_b || null, normalizedHero, card_size || 'Medium',
        overview || null, problem || null, solution || null,
        tech_stack_json ? JSON.stringify(tech_stack_json) : null,
        timeline_json   ? JSON.stringify(timeline_json)   : null,
        learnings_json  ? JSON.stringify(learnings_json)  : null,
        difficulty_level || 'Basic',
        images_json     ? JSON.stringify(images_json)     : null,
        show_github !== undefined ? show_github : true,
        show_demo !== undefined ? show_demo : true,
        show_details !== undefined ? show_details : true,
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
      slug, num, label, short_desc, gradient, accent_a, accent_b, hero, card_size,
      overview, problem, solution, tech_stack_json, timeline_json, learnings_json,
      difficulty_level, images_json, show_github, show_demo, show_details
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const normalizedFeatured = featured === true || featured === 1 || featured === '1' ? 1 : 0;
    const normalizedHero     = hero     === true || hero     === 1 || hero     === '1' ? 1 : 0;

    const [result] = await promisePool.execute(
      `UPDATE projects SET
        title=?, description=?, tech_stack=?, github_link=?, demo_link=?, image_url=?, featured=?,
        slug=?, num=?, label=?, short_desc=?, gradient=?, accent_a=?, accent_b=?, hero=?, card_size=?,
        overview=?, problem=?, solution=?, tech_stack_json=?, timeline_json=?, learnings_json=?,
        difficulty_level=?, images_json=?, show_github=?, show_demo=?, show_details=?
       WHERE id=?`,
      [
        title, description || null, tech_stack || null, github_link || null, demo_link || null, image_url || null, normalizedFeatured,
        slug || null, num || null, label || null, short_desc || null, gradient || null, accent_a || null, accent_b || null, normalizedHero, card_size || 'Medium',
        overview || null, problem || null, solution || null,
        tech_stack_json ? JSON.stringify(tech_stack_json) : null,
        timeline_json   ? JSON.stringify(timeline_json)   : null,
        learnings_json  ? JSON.stringify(learnings_json)  : null,
        difficulty_level || 'Basic',
        images_json     ? JSON.stringify(images_json)     : null,
        show_github !== undefined ? show_github : true,
        show_demo !== undefined ? show_demo : true,
        show_details !== undefined ? show_details : true,
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