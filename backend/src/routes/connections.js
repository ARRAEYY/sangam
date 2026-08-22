const express = require('express')
const { Op } = require('sequelize')
const { ConnectionRequest, Connection, User } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { notifyConnectionRequest, notifyConnectionDecision } = require('../services/notificationService')
const { serializeUser, serializeConnectionRequest } = require('../utils/serializers')

const router = express.Router()

function orderedPair(idA, idB) {
  return idA < idB ? [idA, idB] : [idB, idA]
}

async function areConnected(idA, idB) {
  const [user_a_id, user_b_id] = orderedPair(idA, idB)
  const existing = await Connection.findOne({ where: { user_a_id, user_b_id } })
  return Boolean(existing)
}

// Send a connection/interest request.
router.post('/requests', requireAuth, async (req, res, next) => {
  try {
    const recipientId = String(req.body?.recipient_id || '').trim()
    const message = req.body?.message ? String(req.body.message).trim() : null

    if (!recipientId) {
      return res.status(400).json({ detail: 'recipient_id is required.' })
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({ detail: 'You cannot connect with yourself.' })
    }

    const recipient = await User.findByPk(recipientId)
    if (!recipient) {
      return res.status(404).json({ detail: 'User not found.' })
    }

    if (await areConnected(req.user.id, recipientId)) {
      return res.status(409).json({ detail: 'You are already connected with this user.' })
    }

    // Block duplicate pending requests in either direction between the pair.
    const existingPending = await ConnectionRequest.findOne({
      where: {
        status: 'PENDING',
        [Op.or]: [
          { requester_id: req.user.id, recipient_id: recipientId },
          { requester_id: recipientId, recipient_id: req.user.id },
        ],
      },
    })
    if (existingPending) {
      return res.status(409).json({ detail: 'A pending connection request already exists between you two.' })
    }

    const connectionRequest = await ConnectionRequest.create({
      requester_id: req.user.id,
      recipient_id: recipientId,
      status: 'PENDING',
      message,
    })

    await notifyConnectionRequest({ connectionRequest, requester: req.user })

    const created = await ConnectionRequest.findByPk(connectionRequest.id, {
      include: [
        { model: User, as: 'requester', attributes: { exclude: ['password_hash'] } },
        { model: User, as: 'recipient', attributes: { exclude: ['password_hash'] } },
      ],
    })

    return res.status(201).json(serializeConnectionRequest(created))
  } catch (error) {
    return next(error)
  }
})

// Requests the current user has received (default) or sent.
router.get('/requests', requireAuth, async (req, res, next) => {
  try {
    const direction = req.query.direction === 'sent' ? 'sent' : 'received'
    const where =
      direction === 'sent' ? { requester_id: req.user.id } : { recipient_id: req.user.id }

    const requests = await ConnectionRequest.findAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: { exclude: ['password_hash'] } },
        { model: User, as: 'recipient', attributes: { exclude: ['password_hash'] } },
      ],
      order: [['created_at', 'DESC']],
    })

    return res.json(requests.map(serializeConnectionRequest))
  } catch (error) {
    return next(error)
  }
})

// Accept or decline a received connection request.
router.patch('/requests/:id', requireAuth, async (req, res, next) => {
  try {
    const action = String(req.body?.status || '').trim().toUpperCase()
    if (!['ACCEPTED', 'DECLINED'].includes(action)) {
      return res.status(400).json({ detail: 'Status must be ACCEPTED or DECLINED.' })
    }

    const connectionRequest = await ConnectionRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'requester', attributes: { exclude: ['password_hash'] } },
        { model: User, as: 'recipient', attributes: { exclude: ['password_hash'] } },
      ],
    })

    if (!connectionRequest) {
      return res.status(404).json({ detail: 'Connection request not found.' })
    }
    if (connectionRequest.recipient_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the recipient can respond to this request.' })
    }
    if (connectionRequest.status !== 'PENDING') {
      return res.status(409).json({ detail: 'This request has already been resolved.' })
    }

    await connectionRequest.update({ status: action })

    if (action === 'ACCEPTED') {
      const [user_a_id, user_b_id] = orderedPair(connectionRequest.requester_id, connectionRequest.recipient_id)
      await Connection.findOrCreate({ where: { user_a_id, user_b_id } })
    }

    await notifyConnectionDecision({
      connectionRequest,
      recipient: req.user,
      status: action === 'ACCEPTED' ? 'ACCEPTED' : 'DECLINED',
    })

    return res.json(serializeConnectionRequest(connectionRequest))
  } catch (error) {
    return next(error)
  }
})

// Withdraw a request the current user sent, while still pending.
router.delete('/requests/:id', requireAuth, async (req, res, next) => {
  try {
    const connectionRequest = await ConnectionRequest.findByPk(req.params.id)
    if (!connectionRequest) {
      return res.status(404).json({ detail: 'Connection request not found.' })
    }
    if (connectionRequest.requester_id !== req.user.id) {
      return res.status(403).json({ detail: 'Only the requester can withdraw this request.' })
    }
    if (connectionRequest.status !== 'PENDING') {
      return res.status(409).json({ detail: 'This request has already been resolved.' })
    }
    await connectionRequest.destroy()
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

// The current user's established connections.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const connections = await Connection.findAll({
      where: {
        [Op.or]: [{ user_a_id: req.user.id }, { user_b_id: req.user.id }],
      },
      include: [
        { model: User, as: 'userA', attributes: { exclude: ['password_hash'] } },
        { model: User, as: 'userB', attributes: { exclude: ['password_hash'] } },
      ],
      order: [['created_at', 'DESC']],
    })

    const others = connections.map((c) => {
      const other = c.user_a_id === req.user.id ? c.userB : c.userA
      return { connection_id: c.id, connected_at: c.created_at || c.createdAt, user: serializeUser(other) }
    })

    return res.json(others)
  } catch (error) {
    return next(error)
  }
})

module.exports = router
