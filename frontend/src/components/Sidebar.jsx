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
    <aside className="fixed left-5 top-[64px] h-[calc(100vh-64px)] z-50 group hidden md:block">
      <div className="absolute top-0 left-0 flex h-full w-[72px] flex-col items-center gap-2 pt-28 pb-6 px-3.5 transition-all duration-300 ease-out overflow-hidden bg-cream-100 group-hover:w-[240px] group-hover:items-stretch group-hover:px-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link 
              key={to} 
              to={to} 
              title={label} 
              className={`relative flex h-11 w-full items-center group-hover:justify-start rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active ? 'text-brand-700' : 'text-slate-600 hover:text-brand-600'
              }`}
            >
              <div className={`flex shrink-0 h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                active ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-brand-50'
              }`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <span className={`opacity-0 w-0 -translate-x-2 group-hover:w-auto group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out ml-3.5 text-[15px] font-semibold whitespace-nowrap overflow-hidden pointer-events-none group-hover:pointer-events-auto ${active ? 'text-brand-700' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}

        {user && (
          <div className="mt-auto w-full pb-2">
            <button 
              onClick={logout} 
              title="Log out" 
              className="relative flex w-full h-11 items-center group-hover:justify-start transition text-slate-500 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <div className="flex shrink-0 h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-red-50">
                <LogOut size={20} strokeWidth={2} />
              </div>
              <span className="opacity-0 w-0 -translate-x-2 group-hover:w-auto group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out ml-3.5 text-[15px] font-medium whitespace-nowrap overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                Log out
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
