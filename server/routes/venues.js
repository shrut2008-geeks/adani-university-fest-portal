const express = require('express');
const { query } = require('../db');
const { verifyToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// GET all venues with upcoming events count and usage
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        v.id, 
        v.name, 
        v.capacity,
        COUNT(e.id)::int AS events_count
       FROM venues v
       LEFT JOIN events e ON v.id = e.venue_id
       GROUP BY v.id, v.name, v.capacity
       ORDER BY v.name ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST create venue (Admin only)
router.post('/', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { name, capacity } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({ message: 'Venue name and capacity are required.' });
    }

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      return res.status(400).json({ message: 'Capacity must be a positive integer.' });
    }

    const result = await query(
      `INSERT INTO venues (name, capacity) VALUES ($1, $2) RETURNING *`,
      [name.trim(), capNum]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE venue (Admin only)
router.delete('/:id', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM venues WHERE id = $1 RETURNING id, name`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Venue not found.' });
    }
    return res.json({ message: `Venue "${result.rows[0].name}" deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
