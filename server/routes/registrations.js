const express = require('express');
const { query } = require('../db');
const { verifyToken, isClubAdminForClub } = require('../middleware/auth');

const router = express.Router();

// GET registrations
// Students get their own registrations; Admin & Club Admin can view by event_id or all
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { event_id } = req.query;

    let sql = `
      SELECT 
        r.id, 
        r.event_id, 
        r.user_id, 
        r.attended,
        u.email,
        e.title AS event_title,
        e.date AS event_date,
        e.status AS event_status,
        c.name AS club_name,
        v.name AS venue_name,
        v.capacity AS venue_capacity
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN venues v ON e.venue_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'student') {
      // Students only view their own registrations
      params.push(req.user.id);
      sql += ` AND r.user_id = $${params.length}`;
    } else if (event_id) {
      params.push(event_id);
      sql += ` AND r.event_id = $${params.length}`;
    }

    sql += ` ORDER BY e.date ASC, r.id DESC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST register for an event (Students / Users)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { event_id } = req.body;
    const user_id = req.user.id;

    if (!event_id) {
      return res.status(400).json({ message: 'event_id is required to register.' });
    }

    // 1. Fetch event and venue capacity
    const eventCheck = await query(
       `SELECT e.id, e.title, e.status, e.venue_id, v.capacity, v.name AS venue_name
        FROM events e
        LEFT JOIN venues v ON e.venue_id = v.id
        WHERE e.id = $1`,
       [event_id]
     );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = eventCheck.rows[0];

    // Reject registration if event is already completed
    if (event.status === 'Completed') {
      return res.status(400).json({
        message: `Registration Closed: "${event.title}" has already completed.`
      });
    }

    // 2. Block duplicates
    const existingReg = await query(
      `SELECT id FROM registrations WHERE event_id = $1 AND user_id = $2`,
      [event_id, user_id]
    );

    if (existingReg.rows.length > 0) {
      return res.status(400).json({
        message: `You are already registered for "${event.title}".`
      });
    }

    // 3. Respect venue capacity
    if (event.capacity) {
      const countRes = await query(
        `SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1`,
        [event_id]
      );
      const currentCount = countRes.rows[0].count;

      if (currentCount >= event.capacity) {
        return res.status(400).json({
          message: `Registration Closed: Venue "${event.venue_name || 'Main Hall'}" capacity limit of ${event.capacity} seats has been reached.`
        });
      }
    }

    // 4. Create registration
    const result = await query(
      `INSERT INTO registrations (event_id, user_id, attended)
       VALUES ($1, $2, false)
       RETURNING *`,
      [event_id, user_id]
    );

    return res.status(201).json({
      message: `Successfully registered for "${event.title}"!`,
      registration: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// PATCH toggle attended status (Admin or Club Admin of that event's club)
router.patch('/:id/toggle-attended', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check registration and event club
    const regRes = await query(
      `SELECT r.id, r.attended, r.event_id, e.club_id
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.id = $1`,
      [id]
    );

    if (regRes.rows.length === 0) {
      return res.status(404).json({ message: 'Registration record not found.' });
    }

    const reg = regRes.rows[0];

    // Role check
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, reg.club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage registrations for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const updated = await query(
      `UPDATE registrations 
       SET attended = NOT attended 
       WHERE id = $1 
       RETURNING id, event_id, user_id, attended`,
      [id]
    );

    return res.json({
      message: `Attendance marked as ${updated.rows[0].attended ? 'Attended' : 'Absent'}`,
      registration: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// DELETE registration (Student cancels their own, or Admin)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const regRes = await query(`SELECT user_id, event_id FROM registrations WHERE id = $1`, [id]);
    if (regRes.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    if (req.user.role === 'student' && regRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You can only cancel your own registration.' });
    }

    await query(`DELETE FROM registrations WHERE id = $1`, [id]);
    return res.json({ message: 'Registration cancelled successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
