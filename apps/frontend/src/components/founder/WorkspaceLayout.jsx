import React, { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Flag,
  Briefcase,
  FileText,
  Settings,
  BarChart3,
  ChevronLeft,
  X,
  Menu,
  ShieldAlert
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api.js'

export default function WorkspaceLayout({ children }) {
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

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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

  const pendingAppsCount = attention?.pendingApplicants?.length || 0
  const pendingReviewCount = attention?.tasksAwaitingReview?.length || 0
  const totalDecisions = pendingAppsCount + pendingReviewCount
  
  const isLead = project?.owner?.id === user?.id

  const allNavItems = [
    { label: 'Overview', path: `/workspace/${id}/overview`, icon: LayoutDashboard },
    { 
      label: 'Tasks', 
      path: `/workspace/${id}/tasks`, 
      icon: CheckSquare,
      badge: pendingReviewCount > 0 ? pendingReviewCount : null,
    },
    { 
      label: 'Applications', 
      path: `/workspace/${id}/applications`, 
      icon: FileText,
      badge: pendingAppsCount > 0 ? pendingAppsCount : null,
      adminOnly: true,
    },
    { label: 'Milestones', path: `/workspace/${id}/milestones`, icon: Flag },
    { label: 'Team', path: `/workspace/${id}/team`, icon: Users },
    { label: 'Hiring', path: `/workspace/${id}/hiring`, icon: Briefcase, adminOnly: true },
    { label: 'Analytics', path: `/workspace/${id}/analytics`, icon: BarChart3, adminOnly: true },
    { label: 'Settings', path: `/workspace/${id}/settings`, icon: Settings, adminOnly: true },
  ]
  
  const navItems = allNavItems.filter(item => !item.adminOnly || isLead)

  const backLink = isLead ? '/founder' : '/dashboard'
  const backLabel = isLead ? 'Founder Hub' : 'Dashboard'

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col items-start gap-[11px] pt-[30px] pb-6 px-4 overflow-hidden">
      
      <Link to={backLink} className="flex w-full items-center focus-visible:outline-none mb-4">
        <div className="icon-nav-btn shrink-0 bg-brand-50 text-brand-700">
          <ChevronLeft size={18} strokeWidth={1.75} />
        </div>
        <div className="opacity-0 w-0 -translate-x-3 group-hover:w-auto group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out ml-[15px] whitespace-nowrap overflow-hidden pointer-events-none group-hover:pointer-events-auto">
          <p className="text-[13px] font-bold text-slate-900 truncate max-w-[120px]">{project?.title || 'Project'}</p>
          <p className="text-[10px] text-slate-500 font-medium">{backLabel}</p>
        </div>
      </Link>

      {navItems.map((item) => {
        const Icon = item.icon
        const active = location.pathname.startsWith(item.path)
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex w-full items-center focus-visible:outline-none relative"
          >
            <div className={`icon-nav-btn shrink-0 ${active ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.75} />
              {item.badge && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#7f1d3b] ring-2 ring-paper" />
              )}
              <span className="sr-only">{item.label}</span>
            </div>
            <div className={`opacity-0 w-0 -translate-x-3 group-hover:w-auto group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out ml-[15px] flex items-center justify-between pointer-events-none group-hover:pointer-events-auto flex-1 overflow-hidden`}>
               <span className={`text-[15px] font-semibold whitespace-nowrap ${active ? 'text-maroon' : 'text-ink-soft group-hover:text-ink'}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#7f1d3b]/10 text-[#7f1d3b] text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-1 w-full relative">
      {/* Desktop Sidebar */}
      <aside className="app-rail group hidden md:block bg-paper">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="app-canvas px-5 pb-24 pt-4 sm:px-6 sm:pb-16 sm:pt-6 w-full flex-1 min-w-0">
        
        {/* Mobile Header (Only visible on small screens to toggle menu) */}
        <div className="md:hidden flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {project?.logo_url ? (
              <img src={project.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover bg-white" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-display font-bold text-sm">
                {project?.title ? project.title.charAt(0).toUpperCase() : 'P'}
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-sm text-slate-900 truncate max-w-[150px]">
                {project?.title || 'Admin'}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Menu size={18} />
          </button>
        </div>

        {children}
      </main>

      {/* Mobile Menu Drawer */}
      {createPortal(
        <div
          className={`fixed inset-0 z-[100] flex transition-opacity duration-300 md:hidden ${
            mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div
            className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`relative flex h-[100dvh] w-[85%] max-w-[360px] flex-col bg-white px-5 pb-5 pt-4 shadow-2xl transition-transform duration-300 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="mb-6 flex shrink-0 items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <Link
                  to={backLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-4 text-sm font-medium"
                >
                  <ChevronLeft size={16} /> Back to {backLabel}
                </Link>
                <div className="flex items-center gap-3">
                  {project?.logo_url ? (
                    <img src={project.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover bg-white shadow-sm border border-slate-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-display font-bold text-lg shadow-sm border border-brand-100/50">
                      {project?.title ? project.title.charAt(0).toUpperCase() : 'P'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-slate-900 text-[15px] truncate max-w-[140px]">
                      {project?.title || 'Loading...'}
                    </h2>
                    <span className="text-[11px] font-bold tracking-widest uppercase text-brand-600">Active Build</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-4 space-y-1">
               <Link
                to={backLink}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-[15px] font-medium transition text-slate-700 hover:bg-slate-100 mb-2"
              >
                <ChevronLeft size={20} />
                <span>{backLabel}</span>
              </Link>
              
              {navItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium transition ${
                      active
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-white text-brand-700' : 'bg-[#7f1d3b]/10 text-[#7f1d3b]'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
