const express = require('express');
const { query } = require('../db');
const { verifyToken } = require('../middleware/auth');
const { logAuditAction } = require('../utils/auditLogger');

const router = express.Router();

// GET /api/teams - List registered teams
router.get('/', async (req, res, next) => {
  try {
    const { event_id } = req.query;
    let sql = `
      SELECT 
        t.id,
        t.event_id,
        t.name,
        t.project_title,
        t.rank_position,
        t.created_at,
        e.title AS event_title,
        u.email AS leader_email,
        COALESCE(
          json_agg(
            json_build_object(
              'id', tm.id,
              'student_email', tm.student_email,
              'role', tm.role
            )
          ) FILTER (WHERE tm.id IS NOT NULL), '[]'
        ) AS members
      FROM teams t
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN users u ON t.leader_user_id = u.id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE 1=1
    `;
    const params = [];
    if (event_id) {
      params.push(event_id);
      sql += ` AND t.event_id = $${params.length}`;
    }

    sql += ' GROUP BY t.id, e.title, u.email ORDER BY t.rank_position ASC NULLS LAST, t.created_at DESC';

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    if (err.message && err.message.includes('relation "teams" does not exist')) {
      return res.json([]);
    }
    next(err);
  }
});

// POST /api/teams - Register a multi-member hackathon team
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { event_id, name, project_title, members = [] } = req.body;
    if (!event_id || !name || !name.trim()) {
      return res.status(400).json({ message: 'Event ID and Team Name are required.' });
    }

    // Insert team
    const teamRes = await query(`
      INSERT INTO teams (event_id, name, leader_user_id, project_title)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [parseInt(event_id, 10), name.trim(), req.user.id, project_title || null]);

    const newTeam = teamRes.rows[0];

    // Insert leader into team_members
    await query(`
      INSERT INTO team_members (team_id, user_id, student_email, role)
      VALUES ($1, $2, $3, $4)
    `, [newTeam.id, req.user.id, req.user.email, 'Team Leader']);

    // Insert additional invited team members
    if (Array.isArray(members) && members.length > 0) {
      for (const m of members) {
        const email = typeof m === 'string' ? m.trim() : m.email?.trim();
        const role = typeof m === 'object' && m.role ? m.role.trim() : 'Member';
        if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
          await query(`
            INSERT INTO team_members (team_id, student_email, role)
            VALUES ($1, $2, $3)
          `, [newTeam.id, email, role]);
        }
      }
    }

    await logAuditAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'TEAM_REGISTERED',
      entityType: 'teams',
      entityId: newTeam.id,
      details: { name: newTeam.name, event_id: newTeam.event_id, memberCount: members.length + 1 }
    });

    return res.status(201).json({
      message: 'Team successfully registered with passes issued to all members.',
      team: newTeam
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teams/:id/rank - Award leaderboard rank (1st, 2nd, 3rd)
router.patch('/:id/rank', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'club_admin') {
      return res.status(403).json({ message: 'Only administrators can award winner ranks' });
    }

    const { id } = req.params;
    const { rank_position } = req.body;

    const rankVal = rank_position ? parseInt(rank_position, 10) : null;
    const result = await query(`
      UPDATE teams
      SET rank_position = $1
      WHERE id = $2
      RETURNING *
    `, [rankVal, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await logAuditAction({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'TEAM_RANK_AWARDED',
      entityType: 'teams',
      entityId: id,
      details: { rank: rankVal }
    });

    return res.json({
      message: 'Team leaderboard rank updated successfully.',
      team: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
