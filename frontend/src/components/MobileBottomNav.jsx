import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users2, PlusCircle, User, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function MobileBottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  const navItems = [
    { to: '/explore', label: 'Explore', icon: LayoutGrid },
    { to: '/talent', label: 'Talent', icon: Users2 },
    { to: '/create', label: 'Post', icon: PlusCircle, isAction: true },
    { to: user ? '/notifications' : '/auth', label: 'Alerts', icon: Bell },
    { to: user ? '/dashboard' : '/auth', label: user ? 'Profile' : 'Sign in', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block border-t border-slate-200/80 bg-white/95 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
      <nav className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map(({ to, label, icon: Icon, isAction }) => {
          const active = location.pathname === to

          if (isAction) {
            return (
              <Link
                key={to}
                to={user ? to : '/auth'}
                className="group relative -mt-5 flex flex-col items-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-transform duration-200 active:scale-95 group-hover:bg-brand-700">
                  <Icon size={24} strokeWidth={2.25} />
                </span>
                <span className="mt-1 text-[11px] font-semibold text-slate-700">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center py-1 transition-colors duration-150 ${
                active ? 'text-brand-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="mt-0.5 text-[10px] leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
