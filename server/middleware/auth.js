const jwt = require('jsonwebtoken');
const { query } = require('../db');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token. Please sign in again.' });
  }
};

// Require specific role(s)
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }
    next();
  };
};

// Helper: check if club_admin administers a given club
const isClubAdminForClub = async (userId, clubId) => {
  const result = await query(
    `SELECT id FROM members WHERE user_id = $1 AND club_id = $2`,
    [userId, clubId]
  );
  return result.rows.length > 0;
};

// Helper: get list of club IDs that a user manages
const getUserClubIds = async (userId) => {
  const result = await query(
    `SELECT club_id FROM members WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map(r => r.club_id);
};

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireRoles,
  isClubAdminForClub,
  getUserClubIds
};
