const express = require('express');
const { query } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { logAuditAction } = require('../utils/auditLogger');

const router = express.Router();

const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'RoboWars Challenge Venue',
    message: 'RoboWars challenge venue moved to Tech Lab Alpha (Block B) due to lab testing. Schedule starts at 2:00 PM.',
    priority: 'urgent',
    active: true,
    link: '/events',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'National Hackathon Round 1',
    message: 'Problem statements for National Collegiate Hackathon 2026 are live! Review team track assignments.',
    priority: 'info',
    active: true,
    link: '/events',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'QR Gate Check-In Active',
    message: 'Present your digital QR pass from "My Event Passes" for mobile scanner check-in at venue doors.',
    priority: 'notice',
    active: true,
    link: '/registrations',
    created_at: new Date().toISOString()
  }
];

// GET /api/announcements - Fetch all active announcements
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, title, message, priority, active, link, created_at
      FROM announcements
      WHERE active = TRUE
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'info' THEN 3 
          ELSE 4 
        END,
        created_at DESC
    `);
    return res.json(result.rows);
  } catch (err) {
    // If table does not exist yet before migration, return fallback announcements safely
    return res.json(FALLBACK_ANNOUNCEMENTS);
  }
});

// POST /api/announcements - Post a campus alert (Admin / Club Admin)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'club_admin') {
      return res.status(403).json({ message: 'Only campus administrators can publish announcements' });
    }

    const { title, message, priority = 'info', link = '/events' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const result = await query(`
      INSERT INTO announcements (title, message, priority, active, link, created_by)
      VALUES ($1, $2, $3, TRUE, $4, $5)
      RETURNING *
    `, [title, message, priority, link, req.user.id]);

    await logAuditAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'announcements',
      entityId: result.rows[0].id,
      details: { title, priority }
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/announcements/:id - Remove announcement
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only campus admins can remove announcements' });
    }

    const { id } = req.params;
    const result = await query('DELETE FROM announcements WHERE id = $1 RETURNING id, title', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await logAuditAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'ANNOUNCEMENT_DELETED',
      entityType: 'announcements',
      entityId: id,
      details: { title: result.rows[0]?.title }
    });

    return res.json({ message: 'Announcement removed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
