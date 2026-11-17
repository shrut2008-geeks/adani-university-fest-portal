const express = require('express');
const { query } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { logAuditAction } = require('../utils/auditLogger');

const router = express.Router();

let expensesTableChecked = false;
let expensesTableAvailable = false;

// GET /api/expenses - List expenses (Admin & Club Admin)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'club_admin') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }

    if (expensesTableChecked && !expensesTableAvailable) {
      return res.json([]);
    }

    const { club_id, event_id } = req.query;
    let sql = `
      SELECT 
        ex.id,
        ex.title,
        ex.category,
        ex.amount,
        ex.receipt_url,
        ex.created_at,
        ex.event_id,
        ex.club_id,
        e.title AS event_title,
        c.name AS club_name,
        u.email AS approved_by_email
      FROM expenses ex
      LEFT JOIN events e ON ex.event_id = e.id
      LEFT JOIN clubs c ON ex.club_id = c.id
      LEFT JOIN users u ON ex.approved_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (club_id) {
      params.push(club_id);
      sql += ` AND ex.club_id = $${params.length}`;
    }
    if (event_id) {
      params.push(event_id);
      sql += ` AND ex.event_id = $${params.length}`;
    }

    sql += ' ORDER BY ex.created_at DESC';

    const result = await query(sql, params);
    expensesTableChecked = true;
    expensesTableAvailable = true;
    return res.json(result.rows);
  } catch (err) {
    if (err.message && err.message.includes('relation "expenses" does not exist')) {
      expensesTableChecked = true;
      expensesTableAvailable = false;
      return res.json([]);
    }
    next(err);
  }
});

// POST /api/expenses - Record new expense
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'club_admin') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }

    const { event_id, club_id, title, category = 'Operations', amount, receipt_url } = req.body;
    if (!title || !amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Title and a valid numeric amount are required.' });
    }

    const result = await query(`
      INSERT INTO expenses (event_id, club_id, title, category, amount, receipt_url, approved_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      event_id ? parseInt(event_id, 10) : null,
      club_id ? parseInt(club_id, 10) : null,
      title,
      category,
      parseFloat(amount),
      receipt_url || null,
      req.user.id
    ]);

    await logAuditAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'EXPENSE_RECORDED',
      entityType: 'expenses',
      entityId: result.rows[0].id,
      details: { title, category, amount: parseFloat(amount) }
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/expenses/:id - Delete an expense record
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only campus admins can delete expense entries' });
    }

    const { id } = req.params;
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id, title, amount', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    await logAuditAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'EXPENSE_DELETED',
      entityType: 'expenses',
      entityId: id,
      details: result.rows[0]
    });

    return res.json({ message: 'Expense record removed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
