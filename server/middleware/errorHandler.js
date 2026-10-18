// Centralized error handling middleware for Express and PostgreSQL

const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    table: err.table,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  // PostgreSQL Error Code 23503: Foreign Key Constraint Violation
  if (err.code === '23503') {
    let friendlyMessage = 'Cannot perform operation because this item is referenced by existing records.';
    if (err.table === 'members' || err.table === 'events') {
      friendlyMessage = 'Cannot delete or alter this record because active members or events are associated with it.';
    } else if (err.table === 'clubs') {
      friendlyMessage = 'Cannot delete a club that still has members, events, or achievements.';
    } else if (err.table === 'venues') {
      friendlyMessage = 'Cannot delete this venue because events are scheduled to take place here.';
    } else if (err.detail) {
      friendlyMessage = `Foreign key conflict: ${err.detail}`;
    }
    return res.status(409).json({ message: friendlyMessage, error: 'FOREIGN_KEY_VIOLATION' });
  }

  // PostgreSQL Error Code 23505: Unique Constraint Violation
  if (err.code === '23505') {
    let friendlyMessage = 'A duplicate record already exists.';
    if (err.constraint && err.constraint.includes('registrations')) {
      friendlyMessage = 'You are already registered for this event.';
    } else if (err.constraint && err.constraint.includes('email')) {
      friendlyMessage = 'An account with this email address already exists.';
    } else if (err.detail) {
      friendlyMessage = `Duplicate entry: ${err.detail}`;
    }
    return res.status(409).json({ message: friendlyMessage, error: 'UNIQUE_VIOLATION' });
  }

  // PostgreSQL Error Code 23514: Check Constraint Violation
  if (err.code === '23514') {
    return res.status(400).json({
      message: 'Invalid input value does not meet field criteria (e.g. valid role, position, or rating between 1 and 5).',
      error: 'CHECK_VIOLATION'
    });
  }

  // PostgreSQL Error Code 22P02: Invalid Text Representation
  if (err.code === '22P02') {
    return res.status(400).json({
      message: 'Invalid ID or data type supplied in request.',
      error: 'INVALID_DATA_TYPE'
    });
  }

  // Custom HTTP Errors
  if (err.status) {
    return res.status(err.status).json({
      message: err.message || 'An error occurred',
      details: err.details
    });
  }

  // Generic 500
  return res.status(500).json({
    message: err.message || 'Internal server error occurred on AU Fest API.',
    error: 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler;
