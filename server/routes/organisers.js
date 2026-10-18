const express = require('express');
const { query } = require('../db');
const { verifyToken, isClubAdminForClub } = require('../middleware/auth');

const router = express.Router();

// GET organisers for an event or all
router.get('/', async (req, res, next) => {
  try {
    const { event_id } = req.query;
    let sql = `
      SELECT 
        o.id, 
        o.event_id, 
        o.member_id, 
        o.role,
        m.position AS member_position,
        u.email,
        e.title AS event_title,
        c.name AS club_name
      FROM organisers o
      JOIN members m ON o.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN events e ON o.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
    `;
    const params = [];

    if (event_id) {
      params.push(event_id);
      sql += ` WHERE o.event_id = $1`;
    }

    sql += ` ORDER BY o.id ASC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST assign organiser to event (Admin or Club Admin)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { event_id, member_id, role } = req.body;

    if (!event_id || !member_id || !role) {
      return res.status(400).json({ message: 'event_id, member_id, and role are required.' });
    }

    const eventRes = await query(`SELECT club_id FROM events WHERE id = $1`, [event_id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const memberRes = await query(`SELECT club_id FROM members WHERE id = $1`, [member_id]);
    if (memberRes.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    // Role check
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, eventRes.rows[0].club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only assign organisers for your own club events.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const result = await query(
      `INSERT INTO organisers (event_id, member_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [event_id, member_id, role.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE organiser
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orgRes = await query(
      `SELECT o.id, e.club_id 
       FROM organisers o 
       JOIN events e ON o.event_id = e.id 
       WHERE o.id = $1`,
      [id]
    );

    if (orgRes.rows.length === 0) {
      return res.status(404).json({ message: 'Organiser record not found.' });
    }

    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, orgRes.rows[0].club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage organisers for your own club events.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await query(`DELETE FROM organisers WHERE id = $1`, [id]);
    return res.json({ message: 'Organiser role removed successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
