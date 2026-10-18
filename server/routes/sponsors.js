const express = require('express');
const { query } = require('../db');
const { verifyToken, requireRoles, isClubAdminForClub } = require('../middleware/auth');

const router = express.Router();

const VALID_PAYMENT_STATUSES = ['Pending', 'Approved', 'Rejected'];

// --- SPONSORS ---

// GET all sponsors with total approved sponsorship contributed
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        s.id, 
        s.name,
        COALESCE(SUM(CASE WHEN p.status = 'Approved' THEN p.amount ELSE 0 END), 0) AS total_contributed,
        COUNT(p.id)::int AS payments_count
       FROM sponsors s
       LEFT JOIN payments p ON s.id = p.sponsor_id
       GROUP BY s.id, s.name
       ORDER BY total_contributed DESC, s.name ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST create sponsor (Admin or Club Admin)
router.post('/', verifyToken, requireRoles('admin', 'club_admin'), async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sponsor name is required.' });
    }

    const result = await query(
      `INSERT INTO sponsors (name) VALUES ($1) RETURNING *`,
      [name.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE sponsor (Admin only)
router.delete('/:id', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM sponsors WHERE id = $1 RETURNING id, name`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sponsor not found.' });
    }
    return res.json({ message: `Sponsor "${result.rows[0].name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

// --- PAYMENTS ---

// GET payments (filtered by event_id, status, or sponsor_id) - Admin only
router.get('/payments', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { event_id, status, sponsor_id } = req.query;

    let sql = `
      SELECT 
        p.id, 
        p.event_id, 
        p.sponsor_id, 
        p.amount, 
        p.status,
        e.title AS event_title,
        e.club_id,
        c.name AS club_name,
        COALESCE(s.name, 'Adani University Budget Disbursement') AS sponsor_name
      FROM payments p
      JOIN events e ON p.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN sponsors s ON p.sponsor_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      params.push(event_id);
      sql += ` AND p.event_id = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND p.status = $${params.length}`;
    }

    if (sponsor_id) {
      params.push(sponsor_id);
      sql += ` AND p.sponsor_id = $${params.length}`;
    }

    sql += ` ORDER BY p.id DESC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET total sponsorship per event - Admin only
router.get('/payments/event/:eventId/total', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT 
        e.id AS event_id,
        e.title AS event_title,
        COALESCE(SUM(CASE WHEN p.status = 'Approved' THEN p.amount ELSE 0 END), 0) AS total_approved,
        COALESCE(SUM(CASE WHEN p.status = 'Pending' THEN p.amount ELSE 0 END), 0) AS total_pending,
        COUNT(p.id)::int AS payment_records_count
       FROM events e
       LEFT JOIN payments p ON e.id = p.event_id
       WHERE e.id = $1
       GROUP BY e.id, e.title`,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST record payment (Admin or Club Admin)
router.post('/payments', verifyToken, async (req, res, next) => {
  try {
    const { event_id, sponsor_id, amount, status = 'Pending' } = req.body;

    if (!event_id || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'event_id and amount are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    if (status && !VALID_PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
      });
    }

    // Check event exists & get club_id
    const eventRes = await query(`SELECT club_id, title FROM events WHERE id = $1`, [event_id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = eventRes.rows[0];

    // Authorization
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, event.club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only record payments for your own club events.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const result = await query(
      `INSERT INTO payments (event_id, sponsor_id, amount, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [event_id, sponsor_id ? parseInt(sponsor_id, 10) : null, numAmount, status]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH update payment status (Approve / Reject)
router.patch('/payments/:id/status', verifyToken, requireRoles('admin', 'club_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
      });
    }

    const paymentRes = await query(
      `SELECT p.id, e.club_id 
       FROM payments p
       JOIN events e ON p.event_id = e.id
       WHERE p.id = $1`,
      [id]
    );

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, paymentRes.rows[0].club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only update payments for your own club events.' });
      }
    }

    const result = await query(
      `UPDATE payments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE payment
router.delete('/payments/:id', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM payments WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }
    return res.json({ message: 'Payment record deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
