import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { api } from '../../api'

export default function FounderHub() {
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
    <div className="page-stack max-w-6xl mx-auto w-full">
      <header className="mb-10 reveal-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-900 text-white rounded-[14px] shadow-sm">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Founder Hub</h1>
        </div>
        <p className="text-slate-500 text-[15px] max-w-2xl">Manage your builds and track overall project health.</p>
      </header>

      {projects.length === 0 ? (
        <div className="py-20 text-center bg-[#faf9f5] rounded-[24px] border-2 border-dashed border-slate-200 reveal-in delay-1">
          <div className="mb-4 flex justify-center text-slate-300">
            <TrendingUp size={48} />
          </div>
          <h2 className="text-[18px] font-display font-semibold text-slate-900 mb-2">No projects found</h2>
          <p className="text-slate-500 text-[14px] mb-8">You haven't created any builds yet.</p>
          <Link to="/create" className="button button-primary">
            Start Your First Build <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 dashboard-section reveal-in delay-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative p-6 bg-white rounded-[20px] border border-slate-200 hover:border-brand-200 hover:shadow-md transition-all duration-300 shadow-sm flex flex-col h-full"
            >
              {/* Gold accent for high-priority alerts */}
              {project.has_alerts && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 rounded-full border-[3px] border-white shadow-sm" title="Action Required" />
              )}

              <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="text-[17px] font-display font-bold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 rounded-sm shrink-0">
                  {project.status}
                </span>
              </div>

              <p className="text-slate-500 text-[13px] mb-6 line-clamp-2 flex-1">
                {project.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-[14px] border border-slate-100 group-hover:bg-brand-50/50 group-hover:border-brand-100 transition-colors">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Applicants</span>
                  <span className="text-[18px] font-bold text-slate-900">{project.applicant_count || 0}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-[14px] border border-slate-100 group-hover:bg-brand-50/50 group-hover:border-brand-100 transition-colors">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Team Size</span>
                  <span className="text-[18px] font-bold text-slate-900">{project.member_count || 0}</span>
                </div>
              </div>

              <Link
                to={`/founder/projects/${project.id}/overview`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-700 font-semibold text-[13px] rounded-xl border border-slate-200 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-all duration-300 shadow-sm"
              >
                Attention Center <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
