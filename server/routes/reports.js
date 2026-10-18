const express = require('express');
const { query } = require('../db');

const { verifyToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

// GET all analytical reports (Admin only)
router.get('/', verifyToken, requireRoles('admin'), async (req, res, next) => {
  try {
    // 1. Members per club (GROUP BY c.id, c.name, c.category)
    const membersPerClubRes = await query(`
      SELECT 
        c.id AS club_id,
        c.name AS club_name,
        c.category,
        COUNT(m.id)::int AS member_count,
        COUNT(CASE WHEN m.position = 'President' THEN 1 END)::int AS presidents_count,
        COUNT(CASE WHEN m.position = 'Vice-President' THEN 1 END)::int AS vps_count,
        COUNT(CASE WHEN m.position = 'Member' THEN 1 END)::int AS general_members_count
      FROM clubs c
      LEFT JOIN members m ON c.id = m.club_id
      GROUP BY c.id, c.name, c.category
      ORDER BY member_count DESC, c.name ASC
    `);

    // 2. Total budget per club (GROUP BY c.id, c.name - Sum of Approved payments)
    const totalBudgetPerClubRes = await query(`
      SELECT 
        c.id AS club_id,
        c.name AS club_name,
        c.category,
        COUNT(DISTINCT e.id)::int AS events_count,
        COALESCE(SUM(p.amount), 0)::numeric AS total_budget,
        COALESCE(SUM(CASE WHEN p.status = 'Approved' THEN p.amount ELSE 0 END), 0)::numeric AS approved_budget,
        COALESCE(SUM(CASE WHEN p.status = 'Pending' THEN p.amount ELSE 0 END), 0)::numeric AS pending_budget
      FROM clubs c
      LEFT JOIN events e ON c.id = e.club_id
      LEFT JOIN payments p ON e.id = p.event_id
      GROUP BY c.id, c.name, c.category
      ORDER BY approved_budget DESC, c.name ASC
    `);

    // 3. Registrations per event (GROUP BY e.id, e.title, c.name, v.name, v.capacity)
    const registrationsPerEventRes = await query(`
      SELECT 
        e.id AS event_id,
        e.title AS event_title,
        e.date AS event_date,
        e.status AS event_status,
        c.name AS club_name,
        COALESCE(v.name, 'TBD') AS venue_name,
        COALESCE(v.capacity, 0)::int AS venue_capacity,
        COUNT(r.id)::int AS registration_count,
        COUNT(CASE WHEN r.attended = true THEN 1 END)::int AS attended_count,
        CASE 
          WHEN COALESCE(v.capacity, 0) > 0 
          THEN ROUND((COUNT(r.id)::numeric / v.capacity) * 100, 1) 
          ELSE 0 
        END AS capacity_filled_percentage
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id, e.title, e.date, e.status, c.name, v.name, v.capacity
      ORDER BY registration_count DESC, e.date ASC
    `);

    // 4. Average rating per event (GROUP BY e.id, e.title, c.name)
    const avgRatingPerEventRes = await query(`
      SELECT 
        e.id AS event_id,
        e.title AS event_title,
        e.date AS event_date,
        c.name AS club_name,
        COUNT(f.id)::int AS feedback_count,
        COALESCE(ROUND(AVG(f.rating), 2), 0) AS average_rating,
        COUNT(CASE WHEN f.rating = 5 THEN 1 END)::int AS five_star_count
      FROM events e
      JOIN clubs c ON e.club_id = c.id
      LEFT JOIN feedback f ON e.id = f.event_id
      GROUP BY e.id, e.title, e.date, c.name
      ORDER BY average_rating DESC, feedback_count DESC, e.title ASC
    `);

    return res.json({
      membersPerClub: membersPerClubRes.rows,
      totalBudgetPerClub: totalBudgetPerClubRes.rows,
      registrationsPerEvent: registrationsPerEventRes.rows,
      avgRatingPerEvent: avgRatingPerEventRes.rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
