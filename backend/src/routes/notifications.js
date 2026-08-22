const express = require('express')
const { Notification, User, Project } = require('../models')
const { requireAuth } = require('../middleware/auth')
const { serializeNotification } = require('../utils/serializers')

const router = express.Router()

// All routes here require auth and only ever act on the current user's own
// notifications - recipient_id is always taken from req.user, never from the
// client, so a user cannot read or mutate someone else's notifications.

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.user.id },
      include: [
        { model: User, as: 'actor', attributes: ['id', 'full_name', 'avatar_url'] },
        { model: Project, as: 'project', attributes: ['id', 'title'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    })
    return res.json(notifications.map(serializeNotification))
  } catch (error) {
    return next(error)
  }
})

router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { recipient_id: req.user.id, is_read: false },
    })
    return res.json({ count })
  } catch (error) {
    return next(error)
  }
})

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { recipient_id: req.user.id, is_read: false } }
    )
    return res.json({ success: true })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification || notification.recipient_id !== req.user.id) {
      return res.status(404).json({ detail: 'Notification not found.' })
    }
    await notification.update({ is_read: true })
    return res.json(serializeNotification(notification))
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification || notification.recipient_id !== req.user.id) {
      return res.status(404).json({ detail: 'Notification not found.' })
    }
    await notification.destroy()
    return res.status(204).send()
  } catch (error) {
    return next(error)
  }
})

module.exports = router
