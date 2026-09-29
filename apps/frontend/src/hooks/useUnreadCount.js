import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

const POLL_INTERVAL_MS = 15000

// Single shared unread-notification poller — Navbar, MobileBottomNav, and
// NotificationBell previously each ran (or dead-coded) their own interval (#38).
export default function useUnreadCount(user) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }

    let cancelled = false

    const fetchCount = async () => {
      try {
        const res = await api.unreadNotificationCount()
        if (!cancelled && res) setCount(typeof res.count === 'number' ? res.count : 0)
      } catch {
        // Silently ignore transient polling errors
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user])

  return count
}
