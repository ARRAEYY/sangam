import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Users,
  ListTodo,
  Eye,
  ChevronRight,
  Zap
} from 'lucide-react'
import { api } from '../../api'

export default function ProjectOverview() {
  const { id } = useParams()
  const [attentionData, setAttentionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAttention() {
      try {
        setLoading(true)
        const data = await api.getProjectAttention(id)
        setAttentionData(data)
      } catch (err) {
        console.error('Failed to fetch attention data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAttention()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Analyzing project signals...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          <AlertTriangle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const { project, alerts = [] } = attentionData || {}

  return (
    <div className="page-stack max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <Link
          to="/founder"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Hub
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 tracking-tight">{project?.title || 'Project Overview'}</h1>
            <p className="text-slate-600">Attention Center • Focus on what matters most.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-900 rounded-full border border-indigo-100 font-bold text-sm">
            <Zap size={16} className="text-yellow-500 fill-yellow-500" />
            {alerts.length} Priority Alerts
          </div>
        </div>
      </header>

      {alerts.length === 0 ? (
        <div className="py-20 text-center bg-indigo-50 rounded-3xl border-2 border-indigo-100">
          <div className="mb-4 flex justify-center text-indigo-300">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-2xl font-bold text-indigo-900 mb-2">All Clear!</h2>
          <p className="text-indigo-600 mb-8 max-w-md mx-auto">
            Your project is in a quiet state. No pending actions or critical blockers are currently surfacing.
          </p>
          <div className="flex justify-center gap-4">
            <Link to={`/founder/projects/${id}/tasks`} className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors">
              Review Tasks
            </Link>
            <Link to={`/founder/projects/${id}/applications`} className="px-6 py-3 bg-indigo-900 text-white font-bold rounded-xl hover:bg-indigo-800 transition-colors">
              Check Applicants
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {alerts.map((alert, idx) => {
            const isCritical = alert.type === 'TASK' || alert.count > 10

            return (
              <div
                key={idx}
                className={`group relative p-6 bg-indigo-50 rounded-2xl border-l-8 transition-all duration-300 hover:shadow-lg ${
                  isCritical ? 'border-yellow-400' : 'border-indigo-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-5">
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      alert.type === 'APPLICATION' ? 'bg-blue-100 text-blue-600' :
                      alert.type === 'TASK' ? 'bg-amber-100 text-amber-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {alert.type === 'APPLICATION' && <Users size={24} />}
                      {alert.type === 'TASK' && <ListTodo size={24} />}
                      {alert.type === 'REVIEW' && <Eye size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-indigo-900">
                          {alert.type === 'APPLICATION' && 'Applicant Review'}
                          {alert.type === 'TASK' && 'Blocked Tasks'}
                          {alert.type === 'REVIEW' && 'Member Reviews'}
                        </h3>
                        <span className="px-2 py-0.5 bg-white text-indigo-900 text-xs font-bold rounded-full border border-indigo-200">
                          {alert.count}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium">{alert.message}</p>
                    </div>
                  </div>

                  <Link
                    to={alert.action_url || `#`}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl border border-indigo-200 group-hover:bg-indigo-900 group-hover:text-white group-hover:border-indigo-900 transition-all duration-300 whitespace-nowrap"
                  >
                    Resolve Now <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
