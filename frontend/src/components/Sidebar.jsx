import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users2, PlusCircle, User, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/explore', label: 'Explore projects', icon: LayoutGrid },
  { to: '/talent', label: 'Find talent', icon: Users2 },
  { to: '/create', label: 'Post a project', icon: PlusCircle, requiresAuth: true },
  { to: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true },
  { to: '/dashboard', label: 'Your dashboard', icon: User, requiresAuth: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const items = NAV_ITEMS.filter((item) => !item.requiresAuth || user)

  return (
    <aside className="sticky top-24 hidden h-fit w-[72px] lg:w-[240px] shrink-0 md:block">
      <div className="card flex w-[72px] lg:w-[240px] flex-col items-center lg:items-stretch gap-1 py-4 px-2 lg:px-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link 
              key={to} 
              to={to} 
              title={label} 
              className={`group relative flex h-11 items-center justify-center lg:justify-start rounded-xl px-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              <span className="hidden lg:block ml-3 text-sm font-semibold whitespace-nowrap">
                {label}
              </span>
            </Link>
          )
        })}

        {user && (
          <>
            <div className="my-2 h-px w-8 lg:w-full bg-slate-100 mx-auto" />
            <button 
              onClick={logout} 
              title="Log out" 
              className="group relative flex h-11 items-center justify-center lg:justify-start rounded-xl px-3 text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut size={19} strokeWidth={2} className="shrink-0" />
              <span className="hidden lg:block ml-3 text-sm font-semibold whitespace-nowrap">
                Log out
              </span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
