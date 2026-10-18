require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const clubsRoutes = require('./routes/clubs');
const membersRoutes = require('./routes/members');
const eventsRoutes = require('./routes/events');
const venuesRoutes = require('./routes/venues');
const registrationsRoutes = require('./routes/registrations');
const sponsorsRoutes = require('./routes/sponsors');
const organisersRoutes = require('./routes/organisers');
const feedbackRoutes = require('./routes/feedback');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes mounted under /api
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/organisers', organisersRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    fest: 'AU Fest - Adani University Annual Tech & Cultural Fest',
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AU Fest API Server running on port ${PORT}`);
  console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
});
