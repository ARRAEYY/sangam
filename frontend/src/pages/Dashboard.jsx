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
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {featured ? 'FEATURED BUILD' : 'PROJECT / 24'}
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
  const { user, token } = useAuth()
  
  const [projects, setProjects] = useState([])
  const [activity, setActivity] = useState([])
  const [stats, setStats] = useState({ builds: 0, network: 0, profileSignal: 25 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !user) return

    let isMounted = true

    async function loadData() {
      try {
        // Fetch projects globally to show on dashboard feed
        const projectsData = await api.listProjects({}, token)
        
        // We only show up to 3 projects
        const mappedProjects = (projectsData || []).slice(0, 3).map((p, i) => ({
          id: p.id,
          title: p.title,
          summary: stripMarkdown(p.description),
          creator: p.owner?.full_name || 'Anonymous',
          initials: getInitials(p.owner?.full_name),
          status: p.status === 'OPEN' ? 'Open' : p.status === 'IN_PROGRESS' ? 'In progress' : 'Completed',
          team: p.member_count > 0 ? `${p.member_count} member${p.member_count > 1 ? 's' : ''}` : 'Seeking members',
          time: timeAgo(p.created_at),
          skills: (p.required_skills || []).slice(0, 3).map(s => s.name),
          accent: ['maroon', 'blue', 'sand'][i % 3]
        }))
        if (isMounted) setProjects(mappedProjects)

        // Calculate Profile Signal and Network Stats safely in parallel
        let buildsCount = 0
        let networkCount = 0
        let signal = 25 // Base signal for having registered

        try {
          const [myProjects, connections] = await Promise.all([
            api.listProjects({ owner_id: user.id }, token),
            api.listConnections(token)
          ])
          
          buildsCount = Array.isArray(myProjects) ? myProjects.length : 0
          networkCount = Array.isArray(connections) ? connections.length : 0
          
          if (buildsCount > 0) signal += 25
          if (networkCount > 0) signal += 15
          if (user.avatar_url) signal += 15
          if (user.bio) signal += 20
          
        } catch (e) {
          console.error("Failed to fetch auxiliary stats", e)
        }
        
        if (isMounted) {
          setStats({ builds: buildsCount, network: networkCount, profileSignal: Math.min(signal, 100) })
        }

        // Fetch Notifications for activity feed
        try {
          const notifs = await api.listNotifications(token)
          const mappedActivity = (notifs || []).slice(0, 4).map((n, i) => ({
            id: n.id,
            name: n.title || 'Notification',
            detail: n.message || '',
            time: timeAgo(n.created_at),
            tone: ['maroon', 'blue', 'sand', 'maroon'][i % 4]
          }))
          
          if (isMounted) {
            setActivity(mappedActivity.length ? mappedActivity : [
              { id: 1, name: "Welcome to Sangam!", detail: "Complete your profile to find collaborators.", time: "Just now", tone: "maroon" }
            ])
          }
        } catch (e) {
          if (isMounted) {
            setActivity([{ id: 1, name: "Welcome to Sangam!", detail: "Complete your profile to find collaborators.", time: "Just now", tone: "maroon" }])
          }
        }

      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [token, user])

  return (
    <div className="page-stack dashboard-page max-w-[1200px] mx-auto w-full">
      {/* 1. Hero Section */}
      <section className="dashboard-hero reveal-in">
        <div className="hero-copy">
          <span className="eyebrow flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </span>
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
          <span className="text-[10px] text-slate-500 leading-tight">{projects.length} open builds<br /><strong className="text-slate-800">waiting for you</strong></span>
        </div>
      </section>

      {/* 2. Horizontal Stats Strip */}
      <section className="dashboard-stats reveal-in delay-1" aria-label="Your Sangam overview">
        <div className="stat-block">
          <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your builds</span>
          <strong className="block mb-1">{stats.builds.toString().padStart(2, '0')}</strong>
          <span className="stat-caption block text-[11px] text-slate-400">Your open project signals</span>
        </div>
        <div className="stat-block">
          <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Network size</span>
          <strong className="block mb-1">{stats.network.toString().padStart(2, '0')}</strong>
          <span className="stat-caption block text-[11px] text-slate-400">Accepted connections</span>
        </div>
        <div className="stat-block profile-stat flex flex-col justify-center px-6">
          <div className="stat-line mb-2">
            <span className="eyebrow text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile signal</span>
            <span>{stats.profileSignal}%</span>
          </div>
          <div className="progress-track mb-2">
            <span style={{ width: `${stats.profileSignal}%` }} />
          </div>
          <span className="stat-caption text-[11px] text-slate-400">Profile signal from your saved details</span>
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
        ) : projects.length > 0 ? (
          <div className="featured-project-grid">
            {projects[0] && <ProjectCard project={projects[0]} featured />}
            <div className="side-project-stack">
              {projects[1] && <ProjectCard project={projects[1]} />}
              {projects[2] && <ProjectCard project={projects[2]} />}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 border border-slate-100 rounded-[18px]">
            No open builds right now. Be the first to start one!
          </div>
        )}
      </section>

      {/* 4. Lower Activity & Action Panel */}
      <section className="dashboard-lower reveal-in delay-3 mt-4 mb-16">
        <div className="activity-panel">
          <SectionHeading label="Live from your network" title="Recent signals" action={<button className="icon-button subtle-button border border-slate-200" aria-label="View all recent activity"><ArrowUpRight size={14} /></button>} />
          <div className="activity-list">
            {activity.map((item, index) => (
              <div className="activity-item" key={item.id}>
                <span className={`activity-avatar avatar-${item.tone}`}>
                  {index === 2 && activity.length > 2 ? <CircleDashed size={14} /> : item.name.charAt(0)}
                </span>
                <span className="activity-copy"><strong>{item.name}</strong><span>{item.detail}</span></span>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
          <div className="activity-foot mt-6 pt-4 border-t border-slate-100">
            <span><Clock3 size={14} /> Updated moments ago</span><span className="activity-pulse" />
          </div>
        </div>

        <div className="dashboard-side-panel">
          <div className="side-panel-heading"><span className="eyebrow text-[10px] font-bold tracking-widest uppercase">Your next move</span><UsersRound size={18} /></div>
          <h3>Put a shape around the idea.</h3>
          <p>Think. Create . Connect</p>
          <Link to="/create" className="button button-secondary button-full text-[14px]">Post a project <Plus size={16} /></Link>
        </div>
      </section>
    </div>
  )
}
