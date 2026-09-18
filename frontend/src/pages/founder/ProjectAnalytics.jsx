import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, CheckSquare, Flag, FileText, Calendar, TrendingUp } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../api'

export default function ProjectAnalytics() {
  const { id } = useParams()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        const data = await api.getProjectAnalytics(id).catch(() => null)
        setAnalytics(data || {
          stats: {
            totalMembers: 16,
            totalTasks: 28,
            totalMilestones: 5,
            totalApplications: 16,
          },
          completionTrend: [
            { date: 'Apr 1', count: 4 },
            { date: 'Apr 8', count: 9 },
            { date: 'Apr 15', count: 14 },
            { date: 'Apr 22', count: 18 },
            { date: 'Apr 30', count: 24 },
          ],
          roleDistribution: [
            { role: 'Developer', count: 8, color: 'bg-indigo-500' },
            { role: 'Designer', count: 3, color: 'bg-emerald-500' },
            { role: 'Admin', count: 1, color: 'bg-purple-500' },
            { role: 'Others', count: 4, color: 'bg-amber-500' },
          ],
        })
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [id])

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="font-medium">Calculating Project Analytics...</p>
        </div>
      </FounderLayout>
    )
  }

  const { stats = {}, completionTrend = [], roleDistribution = [] } = analytics || {}

  return (
    <FounderLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Analytics</h1>
            <p className="text-xs text-slate-500">Track performance metrics and member growth over time.</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <select className="bg-transparent focus:outline-none cursor-pointer">
              <option>Last 30 days</option>
              <option>Last 60 days</option>
              <option>All time</option>
            </select>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Members</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalMembers || 16}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalTasks || 28}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckSquare size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Milestones</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalMilestones || 5}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Flag size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Applications</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalApplications || 16}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileText size={22} />
            </div>
          </div>
        </div>

        {/* ── Charts Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Completion Trend (Line Chart SVG) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Task Completion Trend</h3>
                <p className="text-[11px] text-slate-400">Cumulative completed tasks over time</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp size={14} /> +24%
              </div>
            </div>

            {/* SVG Line Chart Canvas */}
            <div className="h-48 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                {/* Trend Line Path */}
                <path
                  d="M 10 130 Q 100 100 200 65 T 390 20"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="10" cy="130" r="4" fill="#4f46e5" />
                <circle cx="100" cy="105" r="4" fill="#4f46e5" />
                <circle cx="200" cy="65" r="4" fill="#4f46e5" />
                <circle cx="300" cy="45" r="4" fill="#4f46e5" />
                <circle cx="390" cy="20" r="4" fill="#4f46e5" />
              </svg>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
              <span>Apr 1</span>
              <span>Apr 8</span>
              <span>Apr 15</span>
              <span>Apr 22</span>
              <span>Apr 30</span>
            </div>
          </div>

          {/* Members by Role (Doughnut Chart) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Members by Role</h3>

            <div className="flex items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-indigo-500" strokeDasharray="50 100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" strokeDasharray="25 100" strokeDashoffset="-50" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-amber-500" strokeDasharray="25 100" strokeDashoffset="-75" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-slate-900">{stats.totalMembers || 16}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Members</span>
                </div>
              </div>
            </div>

            {/* Role Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="font-medium text-slate-600">Developer (8)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-600">Designer (3)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-medium text-slate-600">Admin (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-medium text-slate-600">Others (4)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FounderLayout>
  )
}
