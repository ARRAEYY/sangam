import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock } from 'lucide-react'

// Helpers
function formatDate(dateString) {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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

function getAccent(idStr) {
  if (!idStr) return 'maroon';
  const accents = ['maroon', 'blue', 'sand'];
  // simple deterministic hash based on string length and first char code
  const hash = idStr.length + (idStr.charCodeAt(0) || 0);
  return accents[hash % accents.length];
}

export default function ProjectCard({ project, onClick, featured }) {
  // Extract values from raw API object to match the preview UI structure
  const memberCount = project.member_count || 0;
  const statusRaw = project.status || 'OPEN';
  const statusFormatted = statusRaw === 'OPEN' ? 'Open' : statusRaw === 'IN_PROGRESS' ? 'In progress' : 'Completed';
  
  const summary = stripMarkdown(project.description || project.short_description || '');
  const skills = (project.required_skills || []).map(s => s.name || s);
  
  const creator = project.owner?.full_name || 'Anonymous';
  const initials = getInitials(creator);
  const time = timeAgo(project.created_at);
  
  const team = memberCount > 0 ? `${memberCount} member${memberCount > 1 ? 's' : ''}` : 'Seeking members';
  const accent = getAccent(project.id);
  
  const statusPillClass = statusRaw === 'OPEN' 
    ? 'bg-emerald-50 text-emerald-700' 
    : statusRaw === 'IN_PROGRESS' 
      ? 'bg-[#eef3f5] text-[#30536d]' 
      : 'bg-[#fdf5ea] text-[#8f5b36]';
      
  const statusDotClass = statusRaw === 'OPEN' 
    ? 'bg-emerald-500' 
    : statusRaw === 'IN_PROGRESS' 
      ? 'bg-[#30536d]' 
      : 'bg-[#8f5b36]';

  return (
    <Link
      to={`/projects/${project.id}`}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(project);
        }
      }}
      className={`project-card text-left accent-${accent} ${featured ? 'featured' : ''} block`}
    >
      <div className="project-card-topline">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          {featured ? 'FEATURED BUILD' : (project.category && project.category !== 'Other' ? project.category.toUpperCase() : 'PROJECT')}
          {project.matchCount > 0 && (
            <span className="bg-[#7f1d3b]/10 text-[#7f1d3b] px-1.5 py-0.5 rounded-sm lowercase text-[9px] font-semibold">
              {project.matchCount} skill match{project.matchCount > 1 ? 'es' : ''}
            </span>
          )}
        </span>
        <div className={`status-pill ${statusPillClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
          {statusFormatted}
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

        <p className="line-clamp-2">{summary}</p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {skills.map(s => (
            <span key={s} className="px-2.5 py-1 rounded-md bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="project-card-footer mt-auto">
        <div className="flex items-center gap-3">
          <span className={`avatar avatar-${accent}`}>
            {project.owner?.avatar_url ? (
              <img src={project.owner.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              initials
            )}
          </span>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-800">{creator}</span>
            <span className="text-[10px] text-slate-400">{time}</span>
          </div>
        </div>
        <span className="text-[10px] font-medium text-slate-500">{team}</span>
      </div>
    </Link>
  )
}
