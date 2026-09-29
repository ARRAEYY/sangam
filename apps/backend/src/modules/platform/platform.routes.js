const express = require('express')
const { Op } = require('sequelize')
const { sequelize, User, RefreshToken } = require('../../models')
const { requireAuth } = require('../../middleware/auth')
const { requirePlatformAdmin } = require('../../middleware/platformAdmin')
const { parsePagination, paginated } = require('../../utils/pagination')
const { logAudit } = require('../../utils/auditLogger')

// Platform administration (issue #57): user listing and account suspension.
// All routes require an authenticated platform admin (PLATFORM_ADMINS env).

const router = express.Router()

router.use(requireAuth, requirePlatformAdmin)

// ─── Paginated user directory with search ────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 50 })
    const search = String(req.query.q || '').trim()

    const where = {}
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ]
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    })

    return res.json(paginated({ items: users, page, limit, total }))
  } catch (error) {
    return next(error)
  }
})

// ─── Suspend an account ──────────────────────────────────────────────
router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ detail: 'You cannot suspend your own account.' })
    }

    if (user.is_suspended) {
      return res.status(409).json({ detail: 'This account is already suspended.' })
    }

    const reason = String(req.body?.reason || '').trim() || 'No reason provided'

    await sequelize.transaction(async (t) => {
      await user.update(
        { is_suspended: true, suspended_at: new Date(), suspended_reason: reason },
        { transaction: t }
      )
      // A suspended account must lose every active session immediately
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: user.id, is_revoked: false }, transaction: t }
      )
    })

    logAudit({
      action: 'platform.user_suspended',
      req,
      actorId: req.user.id,
      actorEmail: req.user.email,
      entityType: 'user',
      entityId: user.id,
      metadata: { reason, suspended_email: user.email },
    })

    return res.json({
      id: user.id,
      email: user.email,
      is_suspended: user.is_suspended,
      suspended_at: user.suspended_at,
      suspended_reason: user.suspended_reason,
    })
  } catch (error) {
    return next(error)
  }
})

// ─── Lift a suspension ───────────────────────────────────────────────
router.post('/users/:id/unsuspend', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    if (!user.is_suspended) {
      return res.status(409).json({ detail: 'This account is not suspended.' })
    }

    await user.update({ is_suspended: false, suspended_at: null, suspended_reason: null })

    logAudit({
      action: 'platform.user_unsuspended',
      req,
      actorId: req.user.id,
      actorEmail: req.user.email,
      entityType: 'user',
      entityId: user.id,
      metadata: { unsuspended_email: user.email },
    })

    return res.json({ id: user.id, email: user.email, is_suspended: user.is_suspended })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
