import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users2, PlusCircle, User, LogOut, Bell, LayoutDashboard, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'

import ExploreIcon from './ExploreIcon.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { to: '/explore', label: 'Explore projects', icon: ExploreIcon },
  { to: '/talent', label: 'Find talent', icon: Users2 },
  { to: '/applications', label: 'Applications', icon: ClipboardCheck, requiresAuth: true },
  { to: '/create', label: 'Post a project', icon: PlusCircle, requiresAuth: true },
  { to: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true },
  { to: '/profile', label: 'Your profile', icon: User, requiresAuth: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  React.useEffect(() => {
    if (user) {
      api.unreadNotificationCount()
        .then(data => setUnreadCount(data.count || data || 0))
        .catch(console.error)
    }
  }, [user])

  const items = NAV_ITEMS.filter((item) => !item.requiresAuth || user)

  return (
    <aside className="app-rail group hidden md:block bg-paper">
      <div className="flex h-full w-full flex-col items-start gap-[11px] pt-[110px] pb-6 px-4 overflow-hidden">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className="flex w-full items-center focus-visible:outline-none"
            >
              <div className={`icon-nav-btn shrink-0 ${active ? 'active' : ''}`}>
                <Icon size={18} strokeWidth={1.75} />
                {to === '/notifications' && unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-paper" />
                )}
                <span className="sr-only">{label}</span>
              </div>
              <span className={`opacity-0 w-0 -translate-x-3 group-hover:w-auto group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out ml-[15px] text-[15px] font-semibold whitespace-nowrap overflow-hidden pointer-events-none group-hover:pointer-events-auto ${active ? 'text-maroon' : 'text-ink-soft group-hover:text-ink'}`}>
                {label}
              </span>
            </Link>
          )
        })}

        {user && (
          <div className="mt-auto w-full pb-2">
            <button
              onClick={logout}
              className="flex w-full items-center focus-visible:outline-none text-ink-soft hover:text-red-600 transition"
            >
              <div className="icon-nav-btn shrink-0 hover:!bg-red-50 hover:!text-red-600">
                <LogOut size={18} strokeWidth={1.75} />
                <span className="sr-only">Log out</span>
              </div>
              <span className="opacity-0 w-0 -translate-x-3 group-hover:w-auto group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out ml-[15px] text-[15px] font-medium whitespace-nowrap overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                Log out
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
