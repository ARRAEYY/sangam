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
  if (isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Strip basic markdown so it doesn't show as raw symbols in the card preview */
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s+/g, '')          // headings
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')  // bold / italic
    .replace(/__([^_]+)__/g, '$1')       // bold underscores
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // code
    .replace(/^\s*[-*+]\s+/gm, '')      // list bullets
    .replace(/\n{2,}/g, ' ')            // collapse blank lines
    .trim()
}

function OwnerAvatar({ owner }) {
  if (!owner) return null
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500 truncate min-w-0">
      {owner.avatar_url ? (
        <img src={owner.avatar_url} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
          {(owner.full_name || '?')[0].toUpperCase()}
        </span>
      )}
      <span className="truncate">by {owner.full_name}</span>
    </span>
  )
}

export default function ProjectCard({ project, onClick }) {
  const memberCount = project.member_count || 0
  const statusLabel = (project.status || 'OPEN').replace('_', ' ')
  const description = stripMarkdown(project.description)

  const Wrapper = onClick ? 'button' : Link
  const wrapperProps = onClick ? { onClick: () => onClick(project), type: 'button' } : { to: `/projects/${project.id}` }

  return (
    <Wrapper
      {...wrapperProps}
      className="card min-w-0 flex flex-col gap-3 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:shadow-card text-left w-full"
    >
      {/* Header row: title + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display font-semibold text-slate-900 leading-snug line-clamp-2 text-sm sm:text-base">
              {project.title}
            </h3>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className={`pill shrink-0 text-[11px] py-0.5 ${STATUS_STYLES[project.status] || 'bg-slate-100 text-slate-600'}`}>
              {statusLabel}
            </span>
            {memberCount > 0 && (
              <span className="flex items-center gap-1 shrink-0 text-xs text-slate-500 font-medium">
                <Users size={12} className="text-slate-400" /> {memberCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description — strip markdown, clamp to 2 lines on mobile */}
      {description && (
        <p className="line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      )}

      {/* Skill pills */}
      {(project.required_skills || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(project.required_skills || []).slice(0, 4).map((s) => (
            <span key={s.id || s.name} className="pill bg-slate-100 text-slate-600 text-[11px] py-0.5">
              {s.name}
            </span>
          ))}
          {(project.required_skills || []).length > 4 && (
            <span className="pill bg-slate-50 text-slate-400 text-[11px] py-0.5">
              +{(project.required_skills || []).length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer: owner + date */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <OwnerAvatar owner={project.owner} />
        <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
          <Clock size={12} /> {formatDate(project.created_at)}
        </span>
      </div>
    </Wrapper>
  )
}

