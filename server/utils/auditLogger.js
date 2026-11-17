const { query } = require('../db');

/**
 * Logs an administrative action to the audit_logs table.
 * If the table does not exist or an error occurs, it silently logs to console
 * so that business operations are never blocked.
 */
async function logAuditAction({
  userId = null,
  userEmail = null,
  action,
  entityType,
  entityId = null,
  details = {},
  ipAddress = null
}) {
  try {
    const sql = `
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await query(sql, [
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
      ipAddress
    ]);
  } catch (err) {
    // Non-blocking: catch relation "audit_logs" does not exist if migration has not run yet
    console.warn(`[AuditLogger] Warning: Could not log action ${action}: ${err.message}`);
  }
}

module.exports = { logAuditAction };
