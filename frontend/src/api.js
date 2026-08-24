const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${API_BASE}${path}`
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString()
    if (query) url += `?${query}`
  }

  const headers = { 'Content-Type': 'application/json' }

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',          // ← send/receive httpOnly cookies
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
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  resendVerification: (email) =>
    request('/api/auth/resend-verification', { method: 'POST', body: { email } }),
  getPasswordRules: () => request('/api/auth/password-rules'),

  getProfile: () => request('/api/users/profile'),
  getUserPublicProfile: (id) => request(`/api/users/${id}/public`),
  updateProfile: (payload) =>
    request('/api/users/profile', { method: 'PATCH', body: payload }),
  searchTalent: (params) => request('/api/users/talent', { params }),

  addExperience: (payload) => request('/api/users/experience', { method: 'POST', body: payload }),
  editExperience: (id, payload) => request(`/api/users/experience/${id}`, { method: 'PUT', body: payload }),
  deleteExperience: (id) => request(`/api/users/experience/${id}`, { method: 'DELETE' }),

  listProjects: (params) => request('/api/projects', { params }),
  getProject: (id) => request(`/api/projects/${id}`),
  createProject: (payload) =>
    request('/api/projects', { method: 'POST', body: payload }),
  editProject: (id, payload) =>
    request(`/api/projects/${id}`, { method: 'PUT', body: payload }),
  updateProjectStatus: (id, status) =>
    request(`/api/projects/${id}/status`, { method: 'PATCH', body: { status } }),
  applyToProject: (id, payload) =>
    request(`/api/projects/${id}/apply`, { method: 'POST', body: payload }),
  getApplicants: (id) => request(`/api/projects/${id}/apps`),

  myApplications: () => request('/api/applications/mine'),
  updateApplicationStatus: (id, status) =>
    request(`/api/applications/${id}`, { method: 'PATCH', body: { status } }),

  // Notifications
  listNotifications: () => request('/api/notifications'),
  unreadNotificationCount: () => request('/api/notifications/unread-count'),
  markNotificationRead: (id) =>
    request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/api/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) =>
    request(`/api/notifications/${id}`, { method: 'DELETE' }),

  // Connections
  sendConnectionRequest: (recipientId, message) =>
    request('/api/connections/requests', {
      method: 'POST',
      body: { recipient_id: recipientId, message },
    }),
  listConnectionRequests: (direction) =>
    request('/api/connections/requests', { params: { direction } }),
  respondToConnectionRequest: (id, status) =>
    request(`/api/connections/requests/${id}`, { method: 'PATCH', body: { status } }),
  withdrawConnectionRequest: (id) =>
    request(`/api/connections/requests/${id}`, { method: 'DELETE' }),
  listConnections: () => request('/api/connections'),
}
