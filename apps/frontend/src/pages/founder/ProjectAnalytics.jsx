import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, CheckSquare, Flag, FileText, Calendar, TrendingUp } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../services/api.js'

export default function ProjectAnalytics() {
  const { id } = useParams()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        const res = await api.getProjectAnalytics(id).catch(() => null)
        setAnalytics({
          stats: res?.stats || { totalMembers: 0, totalTasks: 0, totalMilestones: 0, totalApplications: 0 },
          completionTrend: res?.completionTrend || [],
          roleDistribution: res?.roleDistribution || [],
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
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Top Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Project Analytics</h1>
            <p className="text-[15px] text-slate-500 mt-1">Track performance metrics and member growth over time.</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <select className="bg-transparent focus:outline-none cursor-pointer text-slate-700 font-semibold">
              <option>Last 30 days</option>
              <option>Last 60 days</option>
              <option>All time</option>
            </select>
          </div>
        </section>

        {/* 4 Summary Stat Cards */}
        <section className="dashboard-stats reveal-in delay-1 mb-10">
          <div className="stat-block">
            <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Users size={12} className="text-brand-500" /> Total Members</span>
            <strong className="block mb-1 text-2xl">{stats.totalMembers || 0}</strong>
          </div>

          <div className="stat-block">
            <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><CheckSquare size={12} className="text-emerald-500" /> Total Tasks</span>
            <strong className="block mb-1 text-2xl">{stats.totalTasks || 0}</strong>
          </div>

          <div className="stat-block">
            <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Flag size={12} className="text-amber-500" /> Milestones</span>
            <strong className="block mb-1 text-2xl">{stats.totalMilestones || 0}</strong>
          </div>

          <div className="stat-block">
            <span className="eyebrow block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FileText size={12} className="text-purple-500" /> Applications</span>
            <strong className="block mb-1 text-2xl">{stats.totalApplications || 0}</strong>
          </div>
        </section>

        {/* ── Charts Grid ──────────────────────────────────────────────────── */}
        <section className="dashboard-section reveal-in delay-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Completion Trend (Line Chart SVG) */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[18px] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-[16px]">Task Completion Trend</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5">Cumulative completed tasks over time</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[12px] bg-emerald-50 px-2.5 py-1 rounded-md">
                  <TrendingUp size={14} /> +24%
                </div>
              </div>

              {/* SVG Line Chart Canvas */}
              <div className="h-56 w-full relative flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Trend Line Path */}
                  <path
                    d="M 10 130 Q 100 100 200 65 T 390 20"
                    fill="none"
                    stroke="#7f1d3b"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  <circle cx="10" cy="130" r="5" fill="#7f1d3b" />
                  <circle cx="100" cy="105" r="5" fill="#7f1d3b" />
                  <circle cx="200" cy="65" r="5" fill="#7f1d3b" />
                  <circle cx="300" cy="45" r="5" fill="#7f1d3b" />
                  <circle cx="390" cy="20" r="5" fill="#7f1d3b" />
                </svg>
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[11px] font-bold text-slate-400 pt-4 border-t border-slate-100">
                <span>Apr 1</span>
                <span>Apr 8</span>
                <span>Apr 15</span>
                <span>Apr 22</span>
                <span>Apr 30</span>
              </div>
            </div>

            {/* Members by Role (Doughnut Chart) */}
            <div className="bg-white p-8 rounded-[18px] border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="font-display font-semibold text-slate-900 text-[16px] mb-6">Members by Role</h3>

              <div className="flex items-center justify-center py-6">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-brand-600" strokeDasharray="50 100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-emerald-500" strokeDasharray="25 100" strokeDashoffset="-50" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-amber-500" strokeDasharray="25 100" strokeDashoffset="-75" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-900">{stats.totalMembers || 16}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Members</span>
                  </div>
                </div>
              </div>

              {/* Role Legend */}
              <div className="grid grid-cols-2 gap-3 text-[13px] pt-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-600" />
                  <span className="font-semibold text-slate-700">Dev (8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-700">Design (3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="font-semibold text-slate-700">Admin (1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-semibold text-slate-700">Others (4)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </FounderLayout>
  )
}
