const { AuditLog } = require('../models')
const logger = require('./logger')

/**
 * Append an audit-trail row for a sensitive action (issue #54 / AUD-010).
 *
 * Fire-and-forget by design: audit failures are logged but never break the
 * request path and never surface to the user. Rows are never deleted by
 * application code, so the trail survives account deletion and notification
 * cleanup.
 *
 * @param {object} entry
 * @param {string} entry.action       Machine name, e.g. 'auth.password_changed'
 * @param {object} [entry.req]        Express request — used for ip / user agent
 * @param {string} [entry.actorId]    Acting user id (null for system actions)
 * @param {string} [entry.actorEmail] Snapshot of the actor's email at action time
 * @param {string} [entry.entityType] e.g. 'user', 'project', 'application'
 * @param {string} [entry.entityId]
 * @param {object} [entry.metadata]   Small JSON context (never secrets/tokens)
 */
function logAudit({ action, req, actorId = null, actorEmail = null, entityType = null, entityId = null, metadata = null }) {
  const row = {
    actor_id: actorId,
    actor_email: actorEmail ? String(actorEmail).slice(0, 254) : null,
    action,
    entity_type: entityType,
    entity_id: entityId ? String(entityId).slice(0, 36) : null,
    metadata: metadata || null,
    ip_address: req?.ip || null,
    user_agent: req?.headers?.['user-agent'] ? String(req.headers['user-agent']).slice(0, 255) : null,
  }

  return AuditLog.create(row).catch((err) => {
    logger.error(`[AUDIT] Failed to record '${action}': ${err.message}`)
  })
}

module.exports = { logAudit }
