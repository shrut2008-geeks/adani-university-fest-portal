const express = require('express');
const { query } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET feedback for an event
router.get('/event/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const listRes = await query(
      `SELECT f.id, f.event_id, f.user_id, f.rating, f.comment, u.email
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.event_id = $1
       ORDER BY f.id DESC`,
      [eventId]
    );

    const statsRes = await query(
      `SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*)::int AS count
       FROM feedback
       WHERE event_id = $1`,
      [eventId]
    );

    return res.json({
      feedback: listRes.rows,
      averageRating: statsRes.rows[0]?.avg_rating || null,
      totalCount: statsRes.rows[0]?.count || 0
    });
  } catch (err) {
    next(err);
  }
});

// POST submit feedback (Students rate 1-5 and comment on events they attended)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { event_id, rating, comment } = req.body;
    const user_id = req.user.id;

    if (!event_id || rating === undefined || rating === null) {
      return res.status(400).json({ message: 'event_id and rating (1-5) are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    // Business Rule Check: Verify user attended the event
    // Admin can test/override, but for students & others enforce attended check
    if (req.user.role === 'student') {
      const attendanceCheck = await query(
        `SELECT attended FROM registrations WHERE event_id = $1 AND user_id = $2`,
        [event_id, user_id]
      );

      if (attendanceCheck.rows.length === 0) {
        return res.status(403).json({
          message: 'Feedback is only open to students who attended this event. You are not registered.'
        });
      }

      if (!attendanceCheck.rows[0].attended) {
        return res.status(403).json({
          message: 'Feedback is only open to students who attended this event. Your attendance has not been verified yet.'
        });
      }
    }

    // Insert feedback
    const result = await query(
      `INSERT INTO feedback (event_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [event_id, user_id, numRating, comment ? comment.trim() : null]
    );

    return res.status(201).json({
      message: 'Thank you for your feedback! It helps make AU Fest even better.',
      feedback: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// DELETE feedback (Admin only)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const fbRes = await query(`SELECT user_id FROM feedback WHERE id = $1`, [id]);
    if (fbRes.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found.' });
    }

    if (req.user.role !== 'admin' && fbRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this feedback.' });
    }

    await query(`DELETE FROM feedback WHERE id = $1`, [id]);
    return res.json({ message: 'Feedback removed successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
