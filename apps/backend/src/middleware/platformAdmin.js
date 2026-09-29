const { isPlatformAdmin } = require('../utils/platformAdmin')
const { logAudit } = require('../utils/auditLogger')

// Gate for /api/platform/admin routes (issue #57). Must run after requireAuth.
async function requirePlatformAdmin(req, res, next) {
  try {
    if (!isPlatformAdmin(req.user)) {
      logAudit({
        action: 'platform.admin_access_denied',
        req,
        actorId: req.user?.id || null,
        actorEmail: req.user?.email || null,
        entityType: 'platform',
        entityId: req.originalUrl,
      }).catch(() => {})
      return res.status(403).json({ detail: 'Platform administrator access required.' })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = { requirePlatformAdmin }
