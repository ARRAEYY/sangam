import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronRight, CircleDashed, Clock3, Plus, Sparkles, UsersRound } from "lucide-react"
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'
import { ProjectDetailModal } from '../components/ProjectDetailModal.jsx'

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

export const SectionHeading = ({ label, title, action }) => (
  <div className="section-heading">
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
  const [activity, setActivity] = useState([])
  const [stats, setStats] = useState({ builds: 0, network: 0, profileSignal: 25 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    async function loadData() {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
        // Fetch projects globally to show on dashboard feed
        const projectsData = await api.listProjects({})
        if (!isMounted) return;
        
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
          const connections = await api.listConnections()
          
          const ownedProjects = fullProfile.project_roles?.filter(pr => pr.is_lead).length || 0;
          const acceptedProjects = fullProfile.accepted_projects?.length || 0;
          
          buildsCount = ownedProjects + acceptedProjects
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

        // Fetch Notifications for activity feed
        try {
          const notifs = await api.getNotifications(token)
          const mappedActivity = (notifs || []).slice(0, 4).map((n, i) => ({
            id: n.id,
            name: n.title || 'Signal',
            detail: n.message || '',
            time: timeAgo(n.created_at),
            tone: ['maroon', 'blue', 'sand', 'maroon'][i % 4]
          }))
          
          setActivity(mappedActivity.length ? mappedActivity : [
            { id: 1, name: "Welcome to Sangam!", detail: "Complete your profile to find collaborators.", time: "Just now", tone: "maroon" }
          ])
        } catch (e) {
          setActivity([{ id: 1, name: "Welcome to Sangam!", detail: "Complete your profile to find collaborators.", time: "Just now", tone: "maroon" }])
        }

      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [user])

  return (
    <div className="page-stack dashboard-page max-w-[1200px] mx-auto w-full">
      {/* 1. Hero Section */}
      <section className="dashboard-hero reveal-in">
        <div className="hero-copy">
          <h1>Less searching.<br /><em>More making.</em></h1>
          <p className="mb-6">Good things are already taking shape. Here's the signal worth following today.</p>
          <div className="hero-actions flex items-center gap-3 mt-5">
            <Link to="/explore" className="button button-primary">Explore the new <ArrowUpRight size={14} /></Link>
            <Link to="/create" className="button button-secondary">Start a build <Plus size={14} /></Link>
          </div>
        </div>
        <div className="hero-art">
          <img src="/manus-storage/sangam-hero-assembly_407994fd.png" alt="Abstract maroon paths" />
        </div>
        <div className="hero-note hidden md:flex">
          <span className="hero-note-mark mr-2 text-[20px] text-[#7f1d3b]">↗</span>
          <span className="text-[10px] text-slate-500 leading-tight">{openProjectsCount} open builds<br /><strong className="text-slate-800">waiting for you</strong></span>
        </div>
      </section>

      {/* 2. Horizontal Stats Strip */}
      <section className="dashboard-stats reveal-in delay-1" aria-label="Your Sangam overview">
        <div className="stat-block">
          <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your builds</span>
          <strong className="block mb-1">{stats.builds.toString().padStart(2, '0')}</strong>
          <span className="stat-caption block text-[11px] text-slate-400">Projects you are working on</span>
        </div>
        <div className="stat-block">
          <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Worker network</span>
          <strong className="block mb-1">{stats.network.toString().padStart(2, '0')}</strong>
          <span className="stat-caption block text-[11px] text-slate-400">Accepted connections</span>
        </div>
        <div className="stat-block profile-stat flex flex-col justify-center px-6">
          <div className="stat-line mb-2">
            <span className="eyebrow text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile signal</span>
            <span>{stats.profileSignal}%</span>
          </div>
          <div className="progress-track mb-2">
            <span style={{ width: `${stats.profileSignal}%` }} className={stats.profileSignal === 100 ? 'bg-emerald-500' : ''} />
          </div>
          <span className="stat-caption text-[11px] text-slate-400">Profile completeness</span>
        </div>
        <div className="dashboard-prompt bg-[#faf9f5]">
          <Sparkles size={16} />
          <span><strong>Small prompt</strong><br />What would you build with a marine biologist?</span>
          <ChevronRight size={16} />
        </div>
      </section>

      {/* 3. Featured Open Projects */}
      <section className="dashboard-section reveal-in delay-2 mt-8">
        <SectionHeading title="Builds worth joining" action={<Link to="/explore" className="text-[11px] font-bold text-[#7f1d3b] hover:underline flex items-center gap-1">View all projects <ArrowUpRight size={14} /></Link>} />
        
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

      {/* 4. Secondary Action Area */}
      <div className="grid md:grid-cols-[1fr_300px] gap-8 mt-12 mb-12 reveal-in delay-3">
        <section className="dashboard-activity">
          <SectionHeading label="Activity feed" title="Recent signals" action={<Link to="/notifications" className="text-[11px] font-bold text-slate-500 hover:text-[#7f1d3b] hover:underline transition-colors">See all</Link>} />
          
          <div className="activity-list space-y-4">
            {activity.map((act) => (
              <div key={act.id} className="activity-item flex gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                <div className={`activity-icon shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400`}>
                  <Check size={16} />
                </div>
                <div className="activity-content flex-1">
                  <h4 className="text-sm font-semibold text-slate-800">{act.name}</h4>
                  <p className="text-[13px] text-slate-500 mt-0.5 line-clamp-2">{act.detail}</p>
                </div>
                <time className="text-[10px] text-slate-400 font-medium whitespace-nowrap pt-0.5">{act.time}</time>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-sidebar">
          <div className="explore-card accent-maroon mb-6 p-6 rounded-[18px] bg-[#fffaf7] border border-[#7f1d3b]/10">
            <h3 className="text-lg font-display font-semibold text-slate-900 mb-2">Build your network</h3>
            <p className="text-sm text-slate-600 mb-4">Connect with talent across campus and start collaborating.</p>
            <Link to="/talent" className="button button-primary w-full text-center justify-center">Browse Talent</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
