import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rocket, ChevronDown, User, LogOut, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const initials = user
    ? user.full_name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Rocket size={18} strokeWidth={2.25} />
          </span>
          <span className="font-display text-[17px] font-semibold leading-none tracking-tight text-slate-900">
            Campus Launchpad
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link to="/create" className="btn-secondary hidden sm:inline-flex">
              <PlusCircle size={15} /> Post a project
            </Link>
          )}

          {!user && (
            <Link to="/auth" className="btn-primary">
              Sign in
            </Link>
          )}

          {user && <NotificationBell />}

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition hover:border-slate-300"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                  {initials}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-card">
                  <div className="px-4 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-slate-100" />
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <User size={15} /> Your dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                      navigate('/')
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
