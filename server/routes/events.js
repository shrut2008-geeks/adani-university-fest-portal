const express = require('express');
const { query } = require('../db');
const { verifyToken, isClubAdminForClub } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['Planned', 'Ongoing', 'Completed'];

// GET all events with JOINs for club name, venue name, and capacity
router.get('/', async (req, res, next) => {
  try {
    const { status, date, club_id, search } = req.query;

    let sql = `
      SELECT 
        e.id, 
        e.club_id, 
        e.venue_id, 
        e.title, 
        e.date, 
        e.status,
        c.name AS club_name,
        c.category AS club_category,
        v.name AS venue_name,
        v.capacity AS venue_capacity,
        COUNT(DISTINCT r.id)::int AS registrations_count,
        COUNT(DISTINCT CASE WHEN r.attended = true THEN r.id END)::int AS attended_count,
        ROUND(AVG(f.rating), 2) AS avg_rating,
        COUNT(DISTINCT f.id)::int AS feedback_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN registrations r ON e.id = r.event_id
      LEFT JOIN feedback f ON e.id = f.event_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND e.status = $${params.length}`;
    }

    if (club_id && club_id !== 'All') {
      params.push(club_id);
      sql += ` AND e.club_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND DATE(e.date) = DATE($${params.length})`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (e.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    sql += `
      GROUP BY e.id, e.club_id, e.venue_id, e.title, e.date, e.status, c.name, c.category, v.name, v.capacity
      ORDER BY e.date ASC
    `;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET single event detail (Registrations, organisers, payments, average feedback rating)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Event base info
    const eventRes = await query(
      `SELECT 
        e.id, 
        e.club_id, 
        e.venue_id, 
        e.title, 
        e.date, 
        e.status,
        c.name AS club_name,
        c.category AS club_category,
        v.name AS venue_name,
        v.capacity AS venue_capacity,
        COUNT(DISTINCT r.id)::int AS registrations_count,
        COUNT(DISTINCT CASE WHEN r.attended = true THEN r.id END)::int AS attended_count,
        ROUND(AVG(f.rating), 2) AS avg_rating,
        COUNT(DISTINCT f.id)::int AS feedback_count
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN registrations r ON e.id = r.event_id
       LEFT JOIN feedback f ON e.id = f.event_id
       WHERE e.id = $1
       GROUP BY e.id, e.club_id, e.venue_id, e.title, e.date, e.status, c.name, c.category, v.name, v.capacity`,
      [id]
    );

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = eventRes.rows[0];

    // 2. Registrations with attended status and user info
    const registrationsRes = await query(
      `SELECT r.id, r.event_id, r.user_id, r.attended, u.email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.id ASC`,
      [id]
    );

    // 3. Organisers and roles
    const organisersRes = await query(
      `SELECT o.id, o.event_id, o.member_id, o.role, m.position, u.email
       FROM organisers o
       JOIN members m ON o.member_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE o.event_id = $1
       ORDER BY o.id ASC`,
      [id]
    );

    // 4. Payments and sponsorship breakdown
    const paymentsRes = await query(
      `SELECT p.id, p.event_id, p.sponsor_id, p.amount, p.status, s.name AS sponsor_name
       FROM payments p
       LEFT JOIN sponsors s ON p.sponsor_id = s.id
       WHERE p.event_id = $1
       ORDER BY p.id ASC`,
      [id]
    );

    const totalApprovedSponsorship = paymentsRes.rows
      .filter(p => p.status === 'Approved')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // 5. Feedback list
    const feedbackRes = await query(
      `SELECT f.id, f.event_id, f.user_id, f.rating, f.comment, u.email
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.event_id = $1
       ORDER BY f.id DESC`,
      [id]
    );

    return res.json({
      ...event,
      registrations: registrationsRes.rows,
      organisers: organisersRes.rows,
      payments: paymentsRes.rows,
      totalApprovedSponsorship,
      feedback: feedbackRes.rows
    });
  } catch (err) {
    next(err);
  }
});

// POST add new event
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { club_id, venue_id, title, date, status = 'Planned' } = req.body;

    if (!club_id || !title || !date) {
      return res.status(400).json({ message: 'club_id, title, and date are required.' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Role check
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only create events for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const result = await query(
      `INSERT INTO events (club_id, venue_id, title, date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [club_id, venue_id || null, title.trim(), date, status]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT update event
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { club_id, venue_id, title, date, status } = req.body;

    // Check existing event
    const eventRes = await query(`SELECT club_id FROM events WHERE id = $1`, [id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const currentClubId = eventRes.rows[0].club_id;

    // Role check
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, currentClubId);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only modify events for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const result = await query(
      `UPDATE events
       SET club_id = COALESCE($1, club_id),
           venue_id = $2,
           title = COALESCE($3, title),
           date = COALESCE($4, date),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING *`,
      [club_id || null, venue_id !== undefined ? venue_id : null, title ? title.trim() : null, date || null, status || null, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE event
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const eventRes = await query(`SELECT club_id, title FROM events WHERE id = $1`, [id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = eventRes.rows[0];

    // Role check
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, event.club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only delete events for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await query(`DELETE FROM events WHERE id = $1`, [id]);
    return res.json({ message: `Event "${event.title}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
