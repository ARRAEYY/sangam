import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock } from 'lucide-react'

const STATUS_STYLES = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  COMPLETED: 'bg-slate-100 text-slate-500',
}

function formatDate(dateString) {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString()
}

function OwnerAvatar({ owner }) {
  if (!owner) return null
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
      {owner.avatar_url ? (
        <img
          src={owner.avatar_url}
          alt=""
          className="h-4 w-4 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
          {(owner.full_name || '?')[0].toUpperCase()}
        </span>
      )}
      <span className="truncate">by {owner.full_name}</span>
    </span>
  )
}

export default function ProjectCard({ project }) {
  const memberCount = project.member_count || 0

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="font-display font-semibold text-slate-900 truncate">{project.title}</h3>
          {memberCount > 0 && (
            <span className="flex items-center gap-1.5 shrink-0 text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full">
              <Users size={12} className="text-slate-400" /> {memberCount}
            </span>
          )}
        </div>
        <span className={`pill shrink-0 ${STATUS_STYLES[project.status] || 'bg-slate-100 text-slate-600'}`}>
          {(project.status || 'OPEN').replace('_', ' ')}
        </span>
      </div>

      <p className="line-clamp-3 text-sm text-slate-600">{project.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {(project.required_skills || []).slice(0, 5).map((s) => (
          <span key={s.id || s.name} className="pill bg-slate-100 text-slate-600">
            {s.name}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <OwnerAvatar owner={project.owner} />
        <span className="flex items-center gap-1 shrink-0">
          <Clock size={13} /> {formatDate(project.created_at)}
        </span>
      </div>
    </Link>
  )
}
