import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api'

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

function getStatusColor(status) {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'WITHDRAWN':
      return 'bg-slate-50 text-slate-700 border-slate-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'ACCEPTED':
      return 'Selected'
    case 'REJECTED':
      return 'Rejected'
    case 'PENDING':
      return 'Pending'
    case 'WITHDRAWN':
      return 'Withdrawn'
    default:
      return status
  }
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

export default function Applications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  if (!user) {
    return null
  }

  useEffect(() => {
    // Fetch applications regardless of auth state (backend handles it)
    api
      .myApplications()
      .then(data => {
        setApplications(data || [])
      })
      .catch(err => {
        console.error('Fetch applications error:', err)
        setError('Failed to load your applications.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const allApplications = applications || []

  const filteredApplications = allApplications.filter(app => {
    if (filter === 'ALL') return true
    if (filter === 'PENDING') return app.status === 'PENDING'
    if (filter === 'ACCEPTED') return app.status === 'ACCEPTED'
    if (filter === 'REJECTED') return app.status === 'REJECTED'
    return true
  })

  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Selected', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div className="page-stack applications-page mx-auto w-full max-w-[1200px] px-4 md:px-0 mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-8 border-b border-slate-100 mb-8">
        <div>
          <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold tracking-widest uppercase rounded-full mb-3">
            Applications
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-2">
            Your Applications.
          </h1>
          <p className="text-lg text-slate-600">
            Track your project applications and see where each opportunity stands.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-slate-100">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              filter === f.value
                ? 'bg-maroon text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading your applications...
        </div>
      ) : allApplications.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4 text-center">
          <ClipboardCheck size={40} className="text-slate-300" />
          <div>
            <p className="text-slate-600 text-lg font-medium mb-2">
              You haven't applied to any projects yet.
            </p>
            <p className="text-slate-500 mb-6">
              Explore projects and submit your first application.
            </p>
            <Link to="/explore" className="btn-primary inline-flex items-center gap-2">
              Explore Projects <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <ClipboardCheck size={40} className="text-slate-300" />
          <p className="text-slate-500">
            No applications found in this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {filteredApplications.map(app => (
            <div
              key={app.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 mb-3">
                    {/* Project Title */}
                    <h3 className="text-xl font-bold text-slate-900 leading-tight break-words">
                      {app.project?.title || 'Unknown Project'}
                    </h3>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {getStatusLabel(app.status)}
                    </span>
                  </div>

                  {/* Description */}
                  {app.project?.short_description && (
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {stripMarkdown(app.project.short_description)}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-col gap-2 text-sm text-slate-600">
                    {app.project?.owner && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Project Lead:</span>
                        <span className="font-medium text-slate-900">
                          {app.project.owner.full_name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Applied on:</span>
                      <span className="font-medium text-slate-900">
                        {new Date(app.applied_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        ({timeAgo(app.applied_at)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {app.project && (
                  <Link
                    to={`/projects/${app.project.id}`}
                    className="flex-shrink-0 inline-flex items-center justify-center px-6 py-2 bg-maroon text-white font-semibold text-sm rounded-lg hover:bg-maroon/90 transition-colors whitespace-nowrap h-fit"
                  >
                    View Project <ArrowRight size={16} className="ml-2" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
