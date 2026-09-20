import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function FounderHub() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true)
        const data = await api.getFounderProjects()
        setProjects(data)
      } catch (err) {
        console.error('Failed to fetch founder projects:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Loading your project empire...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack max-w-[1200px] mx-auto w-full px-4 md:px-0 mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-8 border-b border-slate-100 mb-8 reveal-in">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Link to="/dashboard" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" title="Back to Dashboard">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold tracking-widest uppercase rounded-full">
              Founder Hub
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-2">
            Your Builds.
          </h1>
          <p className="text-lg text-slate-600">
            Manage your builds and track overall project health.
          </p>
        </div>
        <Link to="/create" className="flex-shrink-0 inline-flex items-center justify-center px-6 py-2.5 bg-maroon text-white font-semibold text-sm rounded-lg hover:bg-maroon/90 transition-colors whitespace-nowrap h-fit shadow-sm">
           Start a Build
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center bg-[#faf9f5] rounded-[24px] border-2 border-dashed border-slate-200 reveal-in delay-1">
          <div className="text-slate-300">
            <TrendingUp size={48} />
          </div>
          <div>
            <p className="text-slate-900 text-lg font-bold font-display mb-2">
              No projects found
            </p>
            <p className="text-slate-500 mb-6">
              You haven't created any builds yet.
            </p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2">
              Start Your First Build <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:gap-6 reveal-in delay-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col"
            >
              {/* Top Right Status Badge */}
              <div className="absolute top-5 right-6">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wide shadow-sm">
                  {project.status || 'OPEN'}
                </span>
              </div>

              {/* Gold accent for high-priority alerts */}
              {project.has_alerts && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                  <div className="absolute top-2 -right-2 bg-amber-400 text-amber-900 text-[9px] font-bold tracking-wider uppercase py-1 px-8 rotate-45 shadow-sm text-center z-10">
                     Alert
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2 mb-2">
                <div className="flex-1 min-w-0 pr-0 md:pr-24">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight break-words mb-3 flex items-center gap-3">
                    {project.logo_url && (
                      <img src={project.logo_url} alt="Logo" className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                    )}
                    {project.title}
                  </h3>

                  <div className="flex flex-col gap-2 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Project Lead:</span>
                      <span className="font-medium text-slate-900">
                        {project.owner?.full_name || user?.full_name || 'Meher Khan'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Decision Queue:</span>
                      <span className="font-medium text-slate-900">
                        {project.applicant_count || 0} pending
                      </span>
                    </div>
                  </div>
                  
                </div>

                {/* Attention Center Button Bottom Right */}
                <div className="flex-shrink-0 flex items-center justify-end pl-0 pt-4 md:pt-0">
                  <Link
                    to={`/founder/projects/${project.id}/overview`}
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-maroon text-white font-semibold text-sm rounded-lg hover:bg-maroon/90 transition-colors whitespace-nowrap shadow-sm"
                  >
                    Attention Center <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
