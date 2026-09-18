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
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-900 text-white rounded-lg">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-3xl font-bold text-indigo-900 tracking-tight">Founder Hub</h1>
        </div>
        <p className="text-slate-600 text-lg">Manage your builds and track overall project health.</p>
      </header>

      {projects.length === 0 ? (
        <div className="py-20 text-center bg-indigo-50 rounded-3xl border-2 border-dashed border-indigo-200">
          <div className="mb-4 flex justify-center text-indigo-300">
            <TrendingUp size={48} />
          </div>
          <h2 className="text-xl font-semibold text-indigo-900 mb-2">No projects found</h2>
          <p className="text-indigo-600 mb-6">You haven't created any builds yet.</p>
          <Link to="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-900 text-white font-bold rounded-xl hover:bg-indigo-800 transition-colors">
            Start Your First Build <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative p-6 bg-indigo-50 rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
            >
              {/* Gold accent for high-priority alerts */}
              {project.has_alerts && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white shadow-sm" title="Action Required" />
              )}

              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-indigo-900 group-hover:text-indigo-700 transition-colors">
                  {project.title}
                </h3>
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white text-indigo-900 border border-indigo-200 rounded-md">
                  {project.status}
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-6 line-clamp-2 min-h-[40px]">
                {project.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Applicants</span>
                  <span className="text-lg font-bold text-indigo-900">{project.applicant_count || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team Size</span>
                  <span className="text-lg font-bold text-indigo-900">{project.member_count || 0}</span>
                </div>
              </div>

              <Link
                to={`/founder/projects/${project.id}/overview`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-indigo-900 font-bold rounded-xl border border-indigo-200 group-hover:bg-indigo-900 group-hover:text-white group-hover:border-indigo-900 transition-all duration-300"
              >
                Attention Center <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
