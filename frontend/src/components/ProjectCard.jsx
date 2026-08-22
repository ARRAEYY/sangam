import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock } from 'lucide-react'

const STATUS_STYLES = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  COMPLETED: 'bg-slate-100 text-slate-500',
}

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-slate-900">{project.title}</h3>
        <span className={`pill shrink-0 ${STATUS_STYLES[project.status]}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      <p className="line-clamp-3 text-sm text-slate-600">{project.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {project.required_skills.slice(0, 5).map((s) => (
          <span key={s.id} className="pill bg-slate-100 text-slate-600">
            {s.name}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={13} /> {project.team_size_needed} needed
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} /> {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  )
}
