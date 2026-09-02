import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Users2,
  Bell,
  LogIn,
} from 'lucide-react'
import ExploreIcon from './ExploreIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'
import NotificationBell from './NotificationBell.jsx'
import { SangamEmblem } from './SangamLogo.jsx'

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
      } catch { }
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

  // Handle drawer scroll lock and escape key
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'

      const handleEsc = (e) => {
        if (e.key === 'Escape') setMobileMenuOpen(false)
      }
      document.addEventListener('keydown', handleEsc)

      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleEsc)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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
    { to: '/explore', label: 'Explore projects', icon: ExploreIcon },
    { to: '/talent', label: 'Find talent', icon: Users2 },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      requiresAuth: true,
      badge: unreadCount,
    },
    { to: '/dashboard', label: 'Your dashboard', icon: User, requiresAuth: true },
  ]

  const renderAvatar = (sizeClasses = 'h-8 w-8 text-xs') => {
    if (user?.avatar_url) {
      return <img src={user.avatar_url} alt="" className={`rounded-full object-cover shrink-0 ${sizeClasses}`} />
    }
    return (
      <span className={`flex items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600 shrink-0 ${sizeClasses}`}>
        {initials}
      </span>
    )
  }

  return (
    <nav className="sticky top-0 z-40 h-[74px] flex items-center border-b border-[rgba(32,42,57,0.06)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-5 sm:px-6">
        {/* Brand / Logo - Sangam */}
        <Link to="/" className="flex items-center gap-2.5">
          <SangamEmblem size={28} className="text-ink" />
          <span className="font-display text-[25px] tracking-tight text-ink mt-1">
            Sangam
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2.5 md:flex">
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
                {renderAvatar('h-8 w-8 text-xs')}
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-card border border-[rgba(32,42,57,0.06)] bg-white py-2 shadow-lift menu-in">
                  <div className="px-4 py-2.5">
                    <p className="text-sm font-semibold text-ink">{user.full_name}</p>
                    <p className="truncate text-xs text-ink-soft">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-[rgba(32,42,57,0.06)]" />
                  <Link
                    to="/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <User size={15} /> Your dashboard
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Settings size={15} /> Settings
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

      {/* Mobile Dropdown Menu Drawer (Slide-in) using Portal to escape backdrop-filter context */}
      {createPortal(
        <div
          className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            ref={mobileMenuRef}
            className={`relative flex h-[100dvh] w-[85%] max-w-[360px] flex-col bg-white px-5 pb-5 pt-4 shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
          >
            {/* Drawer Header */}
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <div className="flex items-center gap-2">
                <SangamEmblem className="h-7 w-7 text-brand-600" />
                <span className="font-display text-lg font-bold text-slate-900 tracking-tight">Sangam</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto pb-4">
              {user ? (
                <div className="mb-6 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    {renderAvatar('h-10 w-10 text-sm shadow-sm')}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Profile
                  </Link>
                </div>
              ) : (
                <div className="mb-6">
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-center text-sm"
                  >
                    <LogIn size={16} /> Sign in / Join Sangam
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
                        className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium transition ${highlight && !active
                          ? 'bg-brand-600 text-white font-semibold shadow-sm'
                          : active
                            ? 'bg-brand-50 text-brand-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon size={20} />
                          <span>{label}</span>
                        </div>
                        {Boolean(badge && badge > 0) && (
                          <span
                            className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-white text-brand-700' : 'bg-red-500 text-white'
                              }`}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
              </div>
            </div>

            {/* Drawer Footer (Logout) */}
            {user && (
              <div className="mt-auto shrink-0 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logout()
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={20} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </nav>
  )
}
