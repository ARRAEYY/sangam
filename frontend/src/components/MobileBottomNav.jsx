import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users2, PlusCircle, User, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'

export default function MobileBottomNav() {
  const { user, token } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user || !token) {
      setUnreadCount(0)
      return
    }

    let isMounted = true

    const fetchCount = async () => {
      try {
        const { count } = await api.unreadNotificationCount(token)
        if (isMounted) {
          setUnreadCount(typeof count === 'number' ? count : 0)
        }
      } catch {
        // Ignore transient errors
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user, token, location.pathname])

  const items = [
    { key: 'explore', to: '/explore', label: 'Explore', icon: LayoutGrid },
    { key: 'talent', to: '/talent', label: 'Talent', icon: Users2 },
    { key: 'create', to: '/create', label: 'Post', icon: PlusCircle, isAction: true },
    {
      key: 'alerts',
      to: user ? '/notifications' : '/auth',
      label: 'Alerts',
      icon: Bell,
      badge: unreadCount,
    },
    {
      key: 'profile',
      to: user ? '/dashboard' : '/auth',
      label: user ? 'Profile' : 'Sign in',
      icon: User,
    },
  ]

  return (
    <aside aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-40 block border-t border-slate-200/80 bg-white/95 px-3 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
      <nav className="mx-auto flex max-w-sm items-center justify-between">
        {items.map(({ key, to, label, icon: Icon, isAction, badge }) => {
          const active = location.pathname === to

          if (isAction) {
            return (
              <Link
                key={key}
                to={user ? to : '/auth'}
                className="group relative -mt-5 flex flex-col items-center px-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-transform duration-150 active:scale-95 group-hover:bg-brand-700">
                  <Icon size={24} strokeWidth={2.25} />
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-slate-700">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={key}
              to={to}
              className={`relative flex flex-1 flex-col items-center py-1 transition-colors duration-150 ${
                active ? 'font-semibold text-brand-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                {Boolean(badge && badge > 0) && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
