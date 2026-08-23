const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, token, params } = {}) {
  let url = `${API_BASE}${path}`
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString()
    if (query) url += `?${query}`
  }

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
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
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch {
      // ignore parse errors
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),

  getProfile: (token) => request('/api/users/profile', { token }),
  updateProfile: (payload, token) =>
    request('/api/users/profile', { method: 'PATCH', body: payload, token }),
  searchTalent: (params) => request('/api/users/talent', { params }),

  listProjects: (params) => request('/api/projects', { params }),
  getProject: (id) => request(`/api/projects/${id}`),
  createProject: (payload, token) =>
    request('/api/projects', { method: 'POST', body: payload, token }),
  updateProjectStatus: (id, status, token) =>
    request(`/api/projects/${id}/status`, { method: 'PATCH', body: { status }, token }),
  applyToProject: (id, payload, token) =>
    request(`/api/projects/${id}/apply`, { method: 'POST', body: payload, token }),
  getApplicants: (id, token) => request(`/api/projects/${id}/apps`, { token }),

  myApplications: (token) => request('/api/applications/mine', { token }),
  updateApplicationStatus: (id, status, token) =>
    request(`/api/applications/${id}`, { method: 'PATCH', body: { status }, token }),

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
}
