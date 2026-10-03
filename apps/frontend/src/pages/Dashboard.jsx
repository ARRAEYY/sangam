import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Check, ChevronRight, CircleDashed, Clock3, Plus, Sparkles, UserPlus, UsersRound } from "lucide-react"
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal.jsx'

// Helpers
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .trim()
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function timeAgo(dateString) {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Recently'
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return 'Just now'
  let interval = seconds / 86400
  if (interval >= 1) return Math.floor(interval) + 'd ago'
  interval = seconds / 3600
  if (interval >= 1) return Math.floor(interval) + 'h ago'
  interval = seconds / 60
  if (interval >= 1) return Math.floor(interval) + 'm ago'
  return 'Just now'
}

export const SectionHeading = ({ label, title, action, large }) => (
  <div className={`section-heading ${large ? 'heading-large' : ''}`}>
    <div>
      {label && <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">{label}</span>}
      <h2>{title}</h2>
    </div>
    {action && <div>{action}</div>}
  </div>
)

export const ProjectCard = ({ project, featured }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className={`project-card text-left accent-${project.accent} ${featured ? 'featured' : ''}`}>
        <div className="project-card-topline">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
            {featured ? 'FEATURED BUILD' : 'RECOMMENDED PROJECT'}
            {project.matchCount > 0 && (
              <span className="bg-[#7f1d3b]/10 text-[#7f1d3b] px-1.5 py-0.5 rounded-sm lowercase text-[9px] font-semibold">
                {project.matchCount} skill match{project.matchCount > 1 ? 'es' : ''}
              </span>
            )}
          </span>
          <div className={`status-pill ${project.status === 'Open' ? 'bg-emerald-50 text-emerald-700' : project.status === 'Seeking co-founder' ? 'bg-[#eef3f5] text-[#30536d]' : 'bg-[#fdf5ea] text-[#8f5b36]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Open' ? 'bg-emerald-500' : project.status === 'Seeking co-founder' ? 'bg-[#30536d]' : 'bg-[#8f5b36]'}`} />
            {project.status}
          </div>
        </div>

        <div className="project-card-body">
          {project.looking_for && (
            <div className="mb-2 text-[15px] font-bold tracking-[0.1em] uppercase">
              <span className="text-black font-medium mr-1.5">LOOKING FOR:</span>
              <span className="text-[#7f1d3b] font-bold">{project.looking_for}</span>
            </div>
          )}

          <h3>{project.title}</h3>

          <p>{project.summary}</p>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {project.skills.map(s => (
              <span key={s} className="px-2.5 py-1 rounded-md bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100">{s}</span>
            ))}
          </div>
        </div>

        <div className="project-card-footer">
          <div className="flex items-center gap-3">
            <span className={`avatar avatar-${project.accent}`}>
              {project.initials}
            </span>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-800">{project.creator}</span>
              <span className="text-[10px] text-slate-400">{project.time}</span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500">{project.team}</span>
        </div>
      </button>
      <ProjectDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectPreview={project}
      />
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const [projects, setProjects] = useState([])
  const [openProjectsCount, setOpenProjectsCount] = useState(0)
  const [people, setPeople] = useState([])
  const [connectedIds, setConnectedIds] = useState(new Set())
  const [sentIds, setSentIds] = useState(new Set())
  const [receivedIds, setReceivedIds] = useState(new Set())
  const [connectState, setConnectState] = useState({})
  const [stats, setStats] = useState({ builds: 0, network: 0, profileSignal: 25 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!user) return

    let isMounted = true
    setError('')

    async function loadData() {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

        // Fetch projects globally to show on dashboard feed
        const projectsRes = await api.listProjects({})
        if (!isMounted) return;

        const projectsData = projectsRes?.data || projectsRes || []
        const openProjects = projectsData.filter(p => p.status === 'OPEN')
        setOpenProjectsCount(openProjects.length)

        // Fetch User's public profile to get accurate skills and projects
        const fullProfile = await api.getUserPublicProfile(user.id, token)

        const userSkills = (fullProfile.skills || []).map(s => typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase())

        // Score projects based on skill match
        const scoredProjects = openProjects.map(p => {
          const projectSkills = p.required_skills ? p.required_skills.map(s => s.name.toLowerCase()) : []
          const matchCount = projectSkills.filter(s => userSkills.includes(s)).length
          return { ...p, matchCount }
        }).sort((a, b) => b.matchCount - a.matchCount)

        const mappedProjects = scoredProjects.slice(0, 3).map((p, i) => ({
          id: p.id,
          title: p.title,
          summary: stripMarkdown(p.description),
          creator: p.owner?.full_name || 'Anonymous',
          initials: getInitials(p.owner?.full_name),
          status: p.status === 'OPEN' ? 'Open' : p.status === 'IN_PROGRESS' ? 'In progress' : 'Completed',
          looking_for: p.looking_for,
          team: p.member_count > 0 ? `${p.member_count} member${p.member_count > 1 ? 's' : ''}` : 'Seeking members',
          time: timeAgo(p.created_at),
          skills: (p.required_skills || []).slice(0, 3).map(s => s.name),
          accent: ['maroon', 'blue', 'sand'][i % 3],
          matchCount: p.matchCount
        }))

        setProjects(mappedProjects)

        // Calculate Profile Signal and Network Stats safely in parallel
        let buildsCount = 0
        let networkCount = 0
        let signal = 0

        try {
          const connectionsRes = await api.listConnections()
          const connections = connectionsRes?.data || connectionsRes || []

          const uniqueProjectIds = new Set();
          if (fullProfile.project_roles) {
            fullProfile.project_roles.forEach(pr => uniqueProjectIds.add(pr.project_id));
          }
          if (fullProfile.accepted_projects) {
            fullProfile.accepted_projects.forEach(p => uniqueProjectIds.add(p.id));
          }
          buildsCount = uniqueProjectIds.size;
          networkCount = Array.isArray(connections) ? connections.length : 0

          // Profile completeness (out of 100)
          if (fullProfile.full_name) signal += 10
          if (fullProfile.headline) signal += 10
          if (fullProfile.bio) signal += 15
          if (fullProfile.avatar_url) signal += 15
          if (fullProfile.skills && fullProfile.skills.length > 0) signal += 20
          if (fullProfile.educations && fullProfile.educations.length > 0) signal += 15
          if (fullProfile.experiences && fullProfile.experiences.length > 0) signal += 15

        } catch (e) {
          console.error("Failed to fetch auxiliary stats", e)
        }

        setStats({ builds: buildsCount, network: networkCount, profileSignal: Math.min(signal, 100) })

        // Fetch people to connect + connection states
        try {
          const [talentRes, connsRes, sent, received] = await Promise.all([
            api.searchTalent({ limit: 24 }),
            api.listConnections().catch(() => []),
            api.listConnectionRequests('sent').catch(() => []),
            api.listConnectionRequests('received').catch(() => [])
          ])
          const data = talentRes?.data || talentRes || []
          const conns = connsRes?.data || connsRes || []
          setConnectedIds(new Set((conns || []).map(c => c.user?.id).filter(Boolean)))
          setSentIds(new Set((sent || []).filter(r => r.status === 'PENDING').map(r => r.recipient?.id).filter(Boolean)))
          setReceivedIds(new Set((received || []).filter(r => r.status === 'PENDING').map(r => r.requester?.id).filter(Boolean)))
          setPeople(data.filter(p => p.id !== user?.id).slice(0, 3))
        } catch (e) {
          console.error('Failed to fetch people to connect', e)
        }

      } catch (err) {
        console.error("Dashboard data load error:", err)
        if (isMounted) setError("We couldn't load your dashboard right now. Please try again.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [user, reloadKey])

  // Refresh the project list when a project is deleted from its detail modal
  useEffect(() => {
    const onProjectDeleted = () => setReloadKey(k => k + 1)
    window.addEventListener('sangam:project-deleted', onProjectDeleted)
    return () => window.removeEventListener('sangam:project-deleted', onProjectDeleted)
  }, [])

  const handleConnect = async (personId) => {
    if (connectState[personId]) return
    setConnectState(prev => ({ ...prev, [personId]: 'sending' }))
    try {
      await api.sendConnectionRequest(personId, '')
      setConnectState(prev => ({ ...prev, [personId]: 'sent' }))
    } catch (err) {
      setConnectState(prev => ({ ...prev, [personId]: err.message || 'Failed to send request' }))
    }
  }

  return (
    <div className="page-stack dashboard-page max-w-[1200px] mx-auto w-full">
      {error && (
        <section className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-center" role="alert">
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            className="rounded-full bg-[#7f1d3b] px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#5c132b]"
          >
            Try again
          </button>
        </section>
      )}

      {/* 1. Hero Section */}
      <section className="dashboard-hero reveal-in">
        <div className="hero-copy">
          <h1>Less searching.<br /><em>More making.</em></h1>
          <p className="mb-6 font-bold"> Built For Better Together</p>
          <div className="hero-actions flex items-center gap-3 mt-5">
            <Link to="/explore" className="button button-primary">Explore the new <ArrowUpRight size={14} /></Link>
            <Link to="/create" className="button button-secondary">Start a build <Plus size={14} /></Link>
          </div>
        </div>
        <div className="hero-art">
          <img src="/dashboard.png" alt="Abstract maroon paths" />
        </div>
      </section>

      <div className="flex flex-col items-center gap-1.5 py-5 text-[#5f6673] font-medium text-[13px]">
        Scroll to find your people
        <ArrowDown size={20} />
      </div>

      {/* 2. Featured Open Projects */}
      <section className="dashboard-section reveal-in delay-2 mt-8">
        <SectionHeading large title="Builds worth joining" action={<Link to="/explore" className="text-[11px] font-bold text-[#7f1d3b] hover:underline flex items-center gap-1">View all projects <ArrowUpRight size={14} /></Link>} />

        {loading ? (
          <div className="py-20 text-center text-slate-400 border border-slate-100 rounded-[18px]">
            Reading campus signals...
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} featured={i === 0} />
              ))
            ) : (
              <div className="col-span-3 py-20 text-center text-slate-400 border border-slate-100 rounded-[18px]">
                No open projects found. Be the first to start a build!
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. People to Connect */}
      <section className="dashboard-section reveal-in delay-3 mt-12 mb-12">
        <SectionHeading label="Find collaborators" title="People to connect" action={<Link to="/talent" className="text-[11px] font-bold text-[#7f1d3b] hover:underline flex items-center gap-1">Browse all talent <ArrowUpRight size={14} /></Link>} />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
                <div className="mt-4 h-10 bg-slate-50 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-400 border border-slate-100 rounded-[18px]">
            No people to suggest yet — check back once more students join.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {people.map((person) => {
              const connectionAction = (() => {
                if (connectedIds.has(person.id)) {
                  return (
                    <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <Check size={13} /> Connected
                    </span>
                  )
                }
                if (sentIds.has(person.id) || connectState[person.id] === 'sent') {
                  return (
                    <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                      <Check size={13} /> Request sent
                    </span>
                  )
                }
                if (receivedIds.has(person.id)) {
                  return (
                    <span className="flex w-full items-center justify-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Pending Invitation
                    </span>
                  )
                }
                return (
                  <button
                    type="button"
                    onClick={() => handleConnect(person.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
                  >
                    <UserPlus size={13} /> Connect
                  </button>
                )
              })()

              return (
                <div key={person.id} className="card h-full min-w-0 flex flex-col p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                      {person.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{person.full_name}</p>
                      <p className="line-clamp-1 text-xs text-slate-500 mt-0.5">
                        {person.branch ? `${person.branch}${person.graduation_year ? ` · Class of ${person.graduation_year}` : ''}` : 'Student'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 mb-1 min-h-[40px]">
                    {person.bio && <p className="line-clamp-2 text-sm text-slate-600">{person.bio}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 h-[52px] overflow-hidden content-start">
                    {(person.skills || []).slice(0, 4).map(s => (
                      <span key={s.id || s.name} className="pill bg-slate-100 text-slate-600 text-[11px] py-0.5 whitespace-nowrap">{s.name}</span>
                    ))}
                    {(person.skills || []).length > 4 && (
                      <span className="pill bg-slate-50 text-slate-400 text-[11px] py-0.5">+{(person.skills || []).length - 4}</span>
                    )}
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {connectionAction}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
