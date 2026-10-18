const express = require('express');
const { query } = require('../db');
const { verifyToken, isClubAdminForClub } = require('../middleware/auth');

const router = express.Router();

const VALID_POSITIONS = ['President', 'Vice-President', 'Member'];

// GET members (filtered by club_id or all)
router.get('/', async (req, res, next) => {
  try {
    const { club_id } = req.query;
    let sql = `
      SELECT 
        m.id, 
        m.user_id, 
        m.club_id, 
        m.position, 
        u.email, 
        u.role AS user_role,
        c.name AS club_name
      FROM members m
      JOIN users u ON m.user_id = u.id
      JOIN clubs c ON m.club_id = c.id
    `;
    const params = [];

    if (club_id) {
      params.push(club_id);
      sql += ` WHERE m.club_id = $1`;
    }

    sql += ` ORDER BY m.club_id ASC, 
      CASE m.position 
        WHEN 'President' THEN 1 
        WHEN 'Vice-President' THEN 2 
        ELSE 3 
      END, u.email ASC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST add member to club
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { user_id, club_id, position } = req.body;

    if (!user_id || !club_id || !position) {
      return res.status(400).json({ message: 'user_id, club_id, and position are required.' });
    }

    if (!VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        message: `Position must be one of: ${VALID_POSITIONS.join(', ')}`
      });
    }

    // Role verification: admin can do for any club, club_admin can only do for their club
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage members for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Check if user exists
    const userCheck = await query(`SELECT id FROM users WHERE id = $1`, [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if club exists
    const clubCheck = await query(`SELECT id FROM clubs WHERE id = $1`, [club_id]);
    if (clubCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Club not found.' });
    }

    // Check if already a member of this club
    const existing = await query(
      `SELECT id FROM members WHERE user_id = $1 AND club_id = $2`,
      [user_id, club_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User is already a member of this club.' });
    }

    const result = await query(
      `INSERT INTO members (user_id, club_id, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, club_id, position]
    );

    // Fetch details for client response
    const memberDetails = await query(
      `SELECT m.id, m.user_id, m.club_id, m.position, u.email, c.name AS club_name
       FROM members m
       JOIN users u ON m.user_id = u.id
       JOIN clubs c ON m.club_id = c.id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );

    return res.status(201).json(memberDetails.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT update member position
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (!position || !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        message: `Valid position is required: ${VALID_POSITIONS.join(', ')}`
      });
    }

    const memberRes = await query(`SELECT id, club_id FROM members WHERE id = $1`, [id]);
    if (memberRes.rows.length === 0) {
      return res.status(404).json({ message: 'Member record not found.' });
    }

    const member = memberRes.rows[0];

    // Authorization
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, member.club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage members for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const updated = await query(
      `UPDATE members SET position = $1 WHERE id = $2 RETURNING *`,
      [position, id]
    );

    return res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE member
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const memberRes = await query(`SELECT id, club_id FROM members WHERE id = $1`, [id]);
    if (memberRes.rows.length === 0) {
      return res.status(404).json({ message: 'Member record not found.' });
    }

    const member = memberRes.rows[0];

    // Authorization
    if (req.user.role === 'club_admin') {
      const allowed = await isClubAdminForClub(req.user.id, member.club_id);
      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden. You can only manage members for your own club.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await query(`DELETE FROM members WHERE id = $1`, [id]);
    return res.json({ message: 'Member removed from club successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
