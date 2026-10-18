const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Get Dashboard Statistics
router.get('/stats', async (req, res, next) => {
  try {
    // 1. Total clubs
    const clubsCountRes = await query(`SELECT COUNT(*) AS total FROM clubs`);
    const totalClubs = parseInt(clubsCountRes.rows[0].total, 10);

    // 2. Total members
    const membersCountRes = await query(`SELECT COUNT(*) AS total FROM members`);
    const totalMembers = parseInt(membersCountRes.rows[0].total, 10);

    // 3. Total events
    const eventsCountRes = await query(`SELECT COUNT(*) AS total FROM events`);
    const totalEvents = parseInt(eventsCountRes.rows[0].total, 10);

    // 4. Total sponsorship received (SUM of Approved payments)
    const sponsorshipRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'Approved'`
    );
    const totalSponsorship = parseFloat(sponsorshipRes.rows[0].total);

    // Total registrations
    const regCountRes = await query(`SELECT COUNT(*) AS total FROM registrations`);
    const totalRegistrations = parseInt(regCountRes.rows[0].total, 10);

    // Total attendees
    const attendedRes = await query(`SELECT COUNT(*) AS total FROM registrations WHERE attended = true`);
    const totalAttended = parseInt(attendedRes.rows[0].total, 10);

    // Upcoming Events (next 5) — only Planned or Ongoing, sorted by date ASC
    const upcomingEventsRes = await query(
      `SELECT e.id, e.title, e.date, e.status, c.name AS club_name, v.name AS venue_name, v.capacity,
              COUNT(DISTINCT r.id)::int AS registration_count,
              COUNT(DISTINCT f.id)::int AS feedback_count,
              ROUND(AVG(f.rating), 2) AS avg_rating
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN registrations r ON e.id = r.event_id
       LEFT JOIN feedback f ON e.id = f.event_id
       WHERE e.status IN ('Planned', 'Ongoing')
       GROUP BY e.id, e.title, e.date, e.status, c.name, v.name, v.capacity
       ORDER BY e.date ASC
       LIMIT 5`
    );

    // Next upcoming Planned event (for countdown card)
    const nextEventRes = await query(
      `SELECT e.id, e.title, e.date, c.name AS club_name, v.name AS venue_name
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       LEFT JOIN venues v ON e.venue_id = v.id
       WHERE e.status = 'Planned'
       ORDER BY e.date ASC
       LIMIT 1`
    );
    const nextEvent = nextEventRes.rows[0] || null;

    // Recent payments
    const recentPaymentsRes = await query(
      `SELECT p.id, p.amount, p.status, e.title AS event_title, s.name AS sponsor_name
       FROM payments p
       JOIN events e ON p.event_id = e.id
       LEFT JOIN sponsors s ON p.sponsor_id = s.id
       ORDER BY p.id DESC
       LIMIT 5`
    );

    return res.json({
      totals: {
        clubs: totalClubs,
        members: totalMembers,
        events: totalEvents,
        sponsorshipReceived: totalSponsorship,
        registrations: totalRegistrations,
        attended: totalAttended
      },
      upcomingEvents: upcomingEventsRes.rows,
      nextEvent,
      recentPayments: recentPaymentsRes.rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
