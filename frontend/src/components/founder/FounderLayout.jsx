import React, { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Flag,
  Briefcase,
  FileText,
  Settings,
  BarChart3,
  Search,
  ChevronLeft,
  ExternalLink,
  Menu,
  X,
  ShieldAlert,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'

export default function FounderLayout({ children }) {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [attention, setAttention] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function loadProjectInfo() {
      try {
        setLoading(true)
        const [projData, attData] = await Promise.all([
          api.getProject(id).catch(() => null),
          api.getProjectAttention(id).catch(() => null),
        ])
        setProject(projData)
        setAttention(attData)
      } catch (err) {
        console.error('Failed to fetch project info in layout:', err)
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      loadProjectInfo()
    }
  }, [id])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const pendingAppsCount = attention?.pendingApplicants?.length || 0
  const pendingReviewCount = attention?.tasksAwaitingReview?.length || 0
  const totalDecisions = pendingAppsCount + pendingReviewCount

  const navItems = [
    { label: 'Overview', path: `/founder/projects/${id}/overview`, icon: LayoutDashboard },
    { 
      label: 'Tasks', 
      path: `/founder/projects/${id}/tasks`, 
      icon: CheckSquare,
      badge: pendingReviewCount > 0 ? pendingReviewCount : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { 
      label: 'Applications', 
      path: `/founder/projects/${id}/applications`, 
      icon: FileText,
      badge: pendingAppsCount > 0 ? pendingAppsCount : null,
      badgeColor: 'bg-[#7f1d3b]/10 text-[#7f1d3b]'
    },
    { label: 'Milestones', path: `/founder/projects/${id}/milestones`, icon: Flag },
    { label: 'Team', path: `/founder/projects/${id}/team`, icon: Users },
    { label: 'Hiring', path: `/founder/projects/${id}/hiring`, icon: Briefcase },
    { label: 'Analytics', path: `/founder/projects/${id}/analytics`, icon: BarChart3 },
    { label: 'Settings', path: `/founder/projects/${id}/settings`, icon: Settings },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[#fbfaf8] text-slate-900 -mx-5 -my-4 sm:-mx-6 sm:-my-6 font-sans">
      {/* ── Mobile Backdrop ────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Left Sidebar Navigation Rail ──────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200/80 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Project Branding Strip */}
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/founder"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#7f1d3b] transition-colors"
            >
              <ChevronLeft size={14} /> Back to Hub
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7f1d3b] flex items-center justify-center text-white font-display font-bold text-base shadow-sm">
              {project?.title ? project.title.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-bold text-sm text-slate-900 truncate" title={project?.title}>
                {project?.title || 'Loading Project...'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Build
                </span>
                {totalDecisions > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800" title={`${totalDecisions} items need attention`}>
                    <ShieldAlert size={10} /> {totalDecisions}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Admin Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-[#7f1d3b] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && !isActive && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center gap-3">
          <img
            src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Atharv'}
            alt="User avatar"
            className="w-8 h-8 rounded-full bg-stone-200 object-cover border border-stone-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Project Lead'}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <Sparkles size={10} className="text-[#7f1d3b]" /> Project Admin
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 bg-white/90 backdrop-blur border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-stone-100 rounded-lg lg:hidden"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <Link to="/explore" className="text-slate-400 hover:text-slate-600 hidden sm:inline">Projects</Link>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[240px]">
                {project?.title || 'Admin'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-bold">
                Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={`/projects/${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7f1d3b] bg-[#7f1d3b]/10 hover:bg-[#7f1d3b]/15 rounded-lg transition-colors border border-[#7f1d3b]/20"
            >
              <span>Public View</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
