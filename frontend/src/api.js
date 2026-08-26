const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, token, params } = {}) {
  let url = `${API_BASE}${path}`
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString()
    if (query) url += `?${query}`
  }

  const authToken = token || localStorage.getItem('campus_token')
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',          // ← send/receive httpOnly cookies if available
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown network error'
    throw new Error(
      `Unable to connect to the API (${API_BASE}). Please start the backend server and verify VITE_API_URL. ${reason}`
    )
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    let extra = {}
    try {
      const data = await res.json()
      detail = data.detail || detail
      extra = data
    } catch {
      // ignore parse errors
    }
    const error = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    error.status = res.status
    error.data = extra
    throw error
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  loginWithGoogle: (credential) =>
    request('/api/auth/google', { method: 'POST', body: { credential } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  resendVerification: (email) =>
    request('/api/auth/resend-verification', { method: 'POST', body: { email } }),
  forgotPassword: (email) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, new_password) =>
    request('/api/auth/reset-password', { method: 'POST', body: { token, new_password } }),
  changePassword: (current_password, new_password, token) =>
    request('/api/auth/change-password', { method: 'POST', body: { current_password, new_password }, token }),
  getPasswordRules: () => request('/api/auth/password-rules'),

  getProfile: (token) => request('/api/users/profile', { token }),
  getUserPublicProfile: (id, token) => request(`/api/users/${id}/public`, { token }),
  updateProfile: (payload, token) =>
    request('/api/users/profile', { method: 'PATCH', body: payload, token }),
  deleteAccount: (token) =>
    request('/api/users/profile', { method: 'DELETE', token }),
  searchTalent: (params) => request('/api/users/talent', { params }),

  // Experience
  addExperience: (payload, token) => request('/api/users/experience', { method: 'POST', body: payload, token }),
  editExperience: (id, payload, token) => request(`/api/users/experience/${id}`, { method: 'PUT', body: payload, token }),
  deleteExperience: (id, token) => request(`/api/users/experience/${id}`, { method: 'DELETE', token }),

  // Education
  getEducation: (token) => request('/api/users/education', { token }),
  addEducation: (payload, token) => request('/api/users/education', { method: 'POST', body: payload, token }),
  editEducation: (id, payload, token) => request(`/api/users/education/${id}`, { method: 'PUT', body: payload, token }),
  deleteEducation: (id, token) => request(`/api/users/education/${id}`, { method: 'DELETE', token }),

  // Achievements
  getAchievements: (token) => request('/api/users/achievements', { token }),
  addAchievement: (payload, token) => request('/api/users/achievements', { method: 'POST', body: payload, token }),
  editAchievement: (id, payload, token) => request(`/api/users/achievements/${id}`, { method: 'PUT', body: payload, token }),
  deleteAchievement: (id, token) => request(`/api/users/achievements/${id}`, { method: 'DELETE', token }),

  // Projects
  getTeaserProjects: () => request('/api/projects/teaser'),
  listProjects: (params, token) => request('/api/projects', { params, token }),
  getProject: (id, token) => request(`/api/projects/${id}`, { token }),
  createProject: (payload, token) =>
    request('/api/projects', { method: 'POST', body: payload, token }),
  editProject: (id, payload, token) =>
    request(`/api/projects/${id}`, { method: 'PUT', body: payload, token }),
  deleteProject: (id, token) =>
    request(`/api/projects/${id}`, { method: 'DELETE', token }),
  updateProjectStatus: (id, status, token) =>
    request(`/api/projects/${id}/status`, { method: 'PATCH', body: { status }, token }),
  applyToProject: (id, payload, token) =>
    request(`/api/projects/${id}/apply`, { method: 'POST', body: payload, token }),
  getApplicants: (id, token) => request(`/api/projects/${id}/apps`, { token }),

  myApplications: (token) => request('/api/applications/mine', { token }),
  updateApplicationStatus: (id, status, token, { role, role_category } = {}) =>
    request(`/api/applications/${id}`, {
      method: 'PATCH',
      body: { status, ...(role ? { role } : {}), ...(role_category ? { role_category } : {}) },
      token,
    }),

  // Team Roster
  getMembers: (projectId, token) => request(`/api/projects/${projectId}/members`, { token }),
  updateMemberRole: (projectId, userId, payload, token) =>
    request(`/api/projects/${projectId}/members/${userId}`, { method: 'PATCH', body: payload, token }),
  removeMember: (projectId, userId, token) =>
    request(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE', token }),
  leaveProject: (projectId, userId, token) =>
    request(`/api/projects/${projectId}/members/${userId}/leave`, { method: 'POST', token }),

  // Milestones
  getMilestones: (projectId, token) => request(`/api/projects/${projectId}/milestones`, { token }),
  createMilestone: (projectId, payload, token) =>
    request(`/api/projects/${projectId}/milestones`, { method: 'POST', body: payload, token }),
  updateMilestone: (projectId, milestoneId, payload, token) =>
    request(`/api/projects/${projectId}/milestones/${milestoneId}`, { method: 'PATCH', body: payload, token }),
  deleteMilestone: (projectId, milestoneId, token) =>
    request(`/api/projects/${projectId}/milestones/${milestoneId}`, { method: 'DELETE', token }),

  // Notifications
  listNotifications: (token) => request('/api/notifications', { token }),
  unreadNotificationCount: (token) => request('/api/notifications/unread-count', { token }),
  markNotificationRead: (id, token) =>
    request(`/api/notifications/${id}/read`, { method: 'PATCH', token }),
  markAllNotificationsRead: (token) =>
    request('/api/notifications/read-all', { method: 'PATCH', token }),
  deleteNotification: (id, token) =>
    request(`/api/notifications/${id}`, { method: 'DELETE', token }),

  // Connections
  sendConnectionRequest: (recipientId, message, token) =>
    request('/api/connections/requests', {
      method: 'POST',
      body: { recipient_id: recipientId, message },
      token,
    }),
  listConnectionRequests: (direction, token) =>
    request('/api/connections/requests', { params: { direction }, token }),
  respondToConnectionRequest: (id, status, token) =>
    request(`/api/connections/requests/${id}`, { method: 'PATCH', body: { status }, token }),
  withdrawConnectionRequest: (id, token) =>
    request(`/api/connections/requests/${id}`, { method: 'DELETE', token }),
  listConnections: (token) => request('/api/connections', { token }),
  removeConnection: (id, token) =>
    request(`/api/connections/${id}`, { method: 'DELETE', token }),
}
