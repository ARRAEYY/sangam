import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Rocket,
  ChevronDown,
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  LayoutGrid,
  Users2,
  Bell,
  LogIn,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'
import NotificationBell from './NotificationBell.jsx'

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const profileMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Fetch unread count for mobile drawer
  useEffect(() => {
    if (!user || !token) {
      setUnreadCount(0)
      return
    }

    let cancelled = false
    const fetchCount = async () => {
      try {
        const { count } = await api.unreadNotificationCount(token)
        if (!cancelled) setUnreadCount(count || 0)
      } catch {}
    }

    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, token])

  // Close menus on click outside
  useEffect(() => {
    const onClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Auto-close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  const initials = user
    ? user.full_name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  const navLinks = [
    { to: '/explore', label: 'Explore projects', icon: LayoutGrid },
    { to: '/talent', label: 'Find talent', icon: Users2 },
    { to: '/create', label: 'Post a project', icon: PlusCircle, requiresAuth: true, highlight: true },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      requiresAuth: true,
      badge: unreadCount,
    },
    { to: '/dashboard', label: 'Your dashboard', icon: User, requiresAuth: true },
  ]

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-3 sm:px-6">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm sm:h-9 sm:w-9">
            <Rocket size={17} strokeWidth={2.25} />
          </span>
          <span className="font-display text-base font-semibold leading-tight tracking-tight text-slate-900 sm:text-[17px]">
            Campus Launchpad
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2.5 md:flex">
          {user && (
            <Link to="/create" className="btn-secondary">
              <PlusCircle size={15} /> Post a project
            </Link>
          )}

          {!user && (
            <Link to="/auth" className="btn-primary">
              <LogIn size={15} /> Sign in
            </Link>
          )}

          {user && <NotificationBell />}

          {user && (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                  {initials}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-card">
                  <div className="px-4 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-slate-100" />
                  <Link
                    to="/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <User size={15} /> Your dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
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

        {/* Mobile Header Toggle */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-lg md:hidden"
        >
          {user ? (
            <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-sm">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
              >
                Profile
              </Link>
            </div>
          ) : (
            <div className="mb-3">
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-center text-sm"
              >
                <LogIn size={16} /> Sign in / Join
              </Link>
            </div>
          )}

          <div className="space-y-1">
            {navLinks
              .filter((item) => !item.requiresAuth || user)
              .map(({ to, label, icon: Icon, highlight, badge }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      highlight && !active
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : active
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{label}</span>
                    </div>
                    {Boolean(badge && badge > 0) && (
                      <span
                        className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                          active ? 'bg-white text-brand-700' : 'bg-red-500 text-white'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
          </div>

          {user && (
            <div className="mt-3 border-t border-slate-100 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                  navigate('/')
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
