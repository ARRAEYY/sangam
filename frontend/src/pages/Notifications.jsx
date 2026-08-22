import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, UserPlus, FolderKanban, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'

// Centralized icon/label mapping so notification rendering never has to be
// hardcoded per-page - add a new type here and every surface picks it up.
const TYPE_META = {
  PROJECT_APPLICATION: { icon: FolderKanban, color: 'text-brand-600 bg-brand-50' },
  APPLICATION_ACCEPTED: { icon: ThumbsUp, color: 'text-emerald-600 bg-emerald-50' },
  APPLICATION_REJECTED: { icon: ThumbsDown, color: 'text-red-500 bg-red-50' },
  CONNECTION_REQUEST: { icon: UserPlus, color: 'text-brand-600 bg-brand-50' },
  CONNECTION_ACCEPTED: { icon: Check, color: 'text-emerald-600 bg-emerald-50' },
  CONNECTION_REJECTED: { icon: ThumbsDown, color: 'text-slate-500 bg-slate-100' },
  PROJECT_UPDATE: { icon: FolderKanban, color: 'text-slate-500 bg-slate-100' },
}

function destinationFor(notification) {
  if (notification.type === 'CONNECTION_REQUEST') return '/dashboard?tab=connections'
  if (notification.project) return `/projects/${notification.project.id}`
  return null
}

export default function Notifications() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.listNotifications(token)
      setNotifications(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id, token)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch (err) {
      setError(err.message)
    }
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (id) => {
    try {
      await api.deleteNotification(id, token)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (notifications === null && !error) {
    return <p className="py-10 text-sm text-slate-500">Loading notifications…</p>
  }
  if (error && notifications === null) {
    return <p className="py-10 text-sm text-red-600">{error}</p>
  }

  const visible = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-2xl pb-16 pt-2">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary !px-3.5 !py-1.5 text-xs">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="mb-5 flex gap-2">
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {visible.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 border-dashed py-14 text-center">
          <Bell size={22} className="text-slate-300" />
          <p className="text-sm text-slate-500">
            {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.PROJECT_UPDATE
            const Icon = meta.icon
            const to = destinationFor(n)
            const content = (
              <div className="flex flex-1 items-start gap-3 min-w-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )

            return (
              <div
                key={n.id}
                className={`card flex items-start justify-between gap-3 p-4 ${!n.is_read ? 'border-brand-200 bg-brand-50/30' : ''}`}
              >
                {to ? (
                  <Link to={to} onClick={() => !n.is_read && markRead(n.id)} className="flex flex-1 min-w-0">
                    {content}
                  </Link>
                ) : (
                  content
                )}
                <div className="flex shrink-0 items-center gap-1">
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    title="Delete"
                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
