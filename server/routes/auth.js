const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET, verifyToken, requireRoles } = require('../middleware/auth');
const notify = require('../notify'); // ALERT

const router = express.Router();

// Register new user (students default; admin can register other roles)
router.post('/register', async (req, res, next) => {
  try {
   const { email, password } = req.body;   

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Role is always 'student' for public registration (ignore client-supplied role)
    const assignedRole = 'student';

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3) 
       RETURNING id, email, role`,
      [email.toLowerCase().trim(), password_hash, assignedRole]
    );

    const newUser = result.rows[0];

    notify(`New registration: ${newUser.email} (${newUser.role})`); // ALERT

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await query(
      `SELECT id, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      notify(`Failed login (user not found): ${email}`); // ALERT
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      notify(`Failed login (wrong password): ${user.email}`); // ALERT
      return res.status(401).json({ message: 'Invalid password. Please verify and retry.' });
    }

    notify(`Login: ${user.email} (${user.role})`); // ALERT

    // Fetch managed clubs if club_admin
    const clubsResult = await query(
      `SELECT c.id, c.name, m.position 
       FROM members m 
       JOIN clubs c ON m.club_id = c.id 
       WHERE m.user_id = $1`,
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clubs: clubsResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const userResult = await query(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userResult.rows[0];
    const clubsResult = await query(
      `SELECT c.id, c.name, m.position 
       FROM members m 
       JOIN clubs c ON m.club_id = c.id 
       WHERE m.user_id = $1`,
      [user.id]
    );

    return res.json({
      user: {
        ...user,
        clubs: clubsResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

// List users for member assignments (accessible by admin and club_admin)
router.get('/users', verifyToken, requireRoles('admin', 'club_admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, email, role FROM users ORDER BY email ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;