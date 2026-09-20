const { Notification, User, Project, ConnectionRequest } = require('../models')

// Centralized notification creation. Every notification in the system is
// created through this module so rendering/formatting rules stay in one
// place and new notification types are easy to add later.
async function createNotification({
  recipientId,
  actorId = null,
  type,
  message,
  projectId = null,
  connectionRequestId = null,
}) {
  if (!recipientId || !type || !message) {
    throw new Error('recipientId, type and message are required to create a notification.')
  }
  // Never notify a user about their own action.
  if (actorId && actorId === recipientId) return null

  return Notification.create({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    message,
    project_id: projectId,
    connection_request_id: connectionRequestId,
  })
}

async function notifyProjectApplication({ project, applicant }) {
  return createNotification({
    recipientId: project.owner_id,
    actorId: applicant.id,
    type: 'PROJECT_APPLICATION',
    message: `${applicant.full_name} applied to your project "${project.title}".`,
    projectId: project.id,
  })
}

async function notifyApplicationDecision({ project, applicant, status }) {
  const type = status === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED'
  const verb = status === 'ACCEPTED' ? 'accepted' : 'rejected'
  return createNotification({
    recipientId: applicant.id,
    actorId: project.owner_id,
    type,
    message: `Your application for "${project.title}" was ${verb}.`,
    projectId: project.id,
  })
}

async function notifyConnectionRequest({ connectionRequest, requester }) {
  return createNotification({
    recipientId: connectionRequest.recipient_id,
    actorId: requester.id,
    type: 'CONNECTION_REQUEST',
    message: `${requester.full_name} is interested in connecting with you.`,
    connectionRequestId: connectionRequest.id,
  })
}

async function notifyConnectionDecision({ connectionRequest, recipient, status }) {
  const type = status === 'ACCEPTED' ? 'CONNECTION_ACCEPTED' : 'CONNECTION_REJECTED'
  const verb = status === 'ACCEPTED' ? 'accepted' : 'declined'
  return createNotification({
    recipientId: connectionRequest.requester_id,
    actorId: recipient.id,
    type,
    message: `${recipient.full_name} ${verb} your connection request.`,
    connectionRequestId: connectionRequest.id,
  })
}

module.exports = {
  createNotification,
  notifyProjectApplication,
  notifyApplicationDecision,
  notifyConnectionRequest,
  notifyConnectionDecision,
}
