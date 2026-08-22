import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'

const POLL_INTERVAL_MS = 15000

export default function NotificationBell() {
  const { user, token } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user || !token) {
      setCount(0)
      return
    }

    let cancelled = false

    const fetchCount = async () => {
      try {
        const { count: unread } = await api.unreadNotificationCount(token)
        if (!cancelled) setCount(unread)
      } catch {
        // Silently ignore transient polling errors - the bell just won't
        // update this cycle rather than surfacing a disruptive error.
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, token])

  if (!user) return null

  return (
    <Link
      to="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
      title="Notifications"
    >
      <Bell size={16} strokeWidth={2} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
