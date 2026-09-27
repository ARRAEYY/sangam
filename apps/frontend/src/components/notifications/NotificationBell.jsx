import React from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import useUnreadCount from '../../hooks/useUnreadCount.js'

export default function NotificationBell() {
  const { user } = useAuth()
  const count = useUnreadCount(user)

  if (!user) return null

  return (
    <Link
      to="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <Bell size={16} strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
