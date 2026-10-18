const express = require('express');
const { query } = require('../db');
const { verifyToken, requireRoles, isClubAdminForClub } = require('../middleware/auth');

const router = express.Router();

// GET all clubs with member count and achievements, category filter
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT 
        c.id, 
        c.name, 
        c.category, 
        c.description, 
        COUNT(DISTINCT m.id)::int AS member_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', a.id, 'description', a.description)
          ) FILTER (WHERE a.id IS NOT NULL), 
          '[]'
        ) AS achievements
      FROM clubs c
      LEFT JOIN members m ON c.id = m.club_id
      LEFT JOIN achievements a ON c.id = a.club_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND c.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }

    sql += ` GROUP BY c.id, c.name, c.category, c.description ORDER BY c.id ASC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET single club details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const clubRes = await query(
      `SELECT c.id, c.name, c.category, c.description, COUNT(DISTINCT m.id)::int AS member_count
       FROM clubs c
       LEFT JOIN members m ON c.id = m.club_id
       WHERE c.id = $1
       GROUP BY c.id, c.name, c.category, c.description`,
      [id]
    );

    if (clubRes.rows.length === 0) {
      return res.status(404).json({ message: 'Club not found.' });
    }

    const club = clubRes.rows[0];

    // Get members
    const membersRes = await query(
      `SELECT m.id, m.user_id, m.position, u.email
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.club_id = $1
       ORDER BY 
         CASE m.position 
           WHEN 'President' THEN 1 
           WHEN 'Vice-President' THEN 2 
           ELSE 3 
         END, u.email ASC`,
      [id]
    );

    // Get achievements
    const achievementsRes = await query(
      `SELECT id, description FROM achievements WHERE club_id = $1 ORDER BY id DESC`,
      [id]
    );

    // Get events
    const eventsRes = await query(
      `SELECT e.id, e.title, e.date, e.status, v.name AS venue_name,
              COUNT(r.id)::int AS registrations_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN registrations r ON e.id = r.event_id
       WHERE e.club_id = $1
       GROUP BY e.id, e.title, e.date, e.status, v.name
       ORDER BY e.date ASC`,
      [id]
    );

    return res.json({
      ...club,
      members: membersRes.rows,
      achievements: achievementsRes.rows,
      events: eventsRes.rows
    });
  } catch (err) {
    next(err);
  }
});

// POST create club (Admin only)
router.post('/', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { name, category, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Club name is required.' });
    }

    const result = await query(
      `INSERT INTO clubs (name, category, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), category ? category.trim() : null, description ? description.trim() : null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT update club (Admin or Club Admin for this club)
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description } = req.body;

    // Check authorization: admin or club_admin of this club
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Club name is required.' });
    }

    const result = await query(
      `UPDATE clubs
       SET name = $1, category = $2, description = $3
       WHERE id = $4
       RETURNING *`,
      [name.trim(), category ? category.trim() : null, description ? description.trim() : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Club not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE club (Admin only)
router.delete('/:id', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM clubs WHERE id = $1 RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Club not found.' });
    }

    return res.json({ message: `Club "${result.rows[0].name}" successfully deleted.` });
  } catch (err) {
    next(err);
  }
});

// POST add achievement for club
router.post('/:id/achievements', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Achievement description is required.' });
    }

    // Role check
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage achievements for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const result = await query(
      `INSERT INTO achievements (club_id, description)
       VALUES ($1, $2)
       RETURNING *`,
      [id, description.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE achievement
router.delete('/:id/achievements/:achievementId', verifyToken, async (req, res, next) => {
  try {
    const { id, achievementId } = req.params;

    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage achievements for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const result = await query(
      `DELETE FROM achievements WHERE id = $1 AND club_id = $2 RETURNING id`,
      [achievementId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Achievement not found.' });
    }

    return res.json({ message: 'Achievement deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
