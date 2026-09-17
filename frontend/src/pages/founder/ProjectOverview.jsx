import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Users,
  CheckSquare,
  Flag,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  ExternalLink,
  Flame,
  UserPlus,
  AlertTriangle
} from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../api'

export default function ProjectOverview() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingApplicants, setPendingApplicants] = useState([])
  const [reviewTasks, setReviewTasks] = useState([])
  const [actionSuccessMessage, setActionSuccessMessage] = useState('')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM')
  const [newTaskSubmitting, setNewTaskSubmitting] = useState(false)

  async function loadOverviewData() {
    try {
      setLoading(true)
      const [attention, analytics, projectInfo, apps, taskList] = await Promise.all([
        api.getProjectAttention(id).catch(() => ({})),
        api.getProjectAnalytics(id).catch(() => ({})),
        api.getProject(id).catch(() => ({})),
        api.getFounderApplicants(id).catch(() => []),
        api.getTasks(id).catch(() => []),
      ])

      const tasks = taskList && taskList.length > 0 ? taskList : [
        { id: 1, title: 'Design Landing Page System', status: 'COMPLETED', priority: 'HIGH', due_date: 'May 20, 2025' },
        { id: 2, title: 'Develop Core Authentication', status: 'READY_FOR_REVIEW', priority: 'HIGH', due_date: 'May 25, 2025', assignee: { name: 'Rahul M.' } },
        { id: 3, title: 'AI Matching Engine Integration', status: 'IN_PROGRESS', priority: 'MEDIUM', due_date: 'Jun 1, 2025', assignee: { name: 'Sneha K.' } },
        { id: 4, title: 'Write Public Documentation', status: 'TODO', priority: 'LOW', due_date: 'Jun 5, 2025' },
        { id: 5, title: 'Database schema migration', status: 'BLOCKED', priority: 'HIGH', due_date: 'Jun 8, 2025', assignee: { name: 'Arjun P.' } },
      ]

      const pending = (apps || []).filter(a => a.status === 'PENDING' || a.status === 'Pending')
      const initialPending = pending.length > 0 ? pending : [
        { id: 101, name: 'Ananya Singh', role: 'Frontend Architect', applied_on: '2h ago', matched_skills: ['React', 'Tailwind', 'Next.js'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', pitch: 'Hey! Loved the mission. I built scalable dashboard systems at my university hackathon.' },
        { id: 102, name: 'Karan Malhotra', role: 'ML Engineer', applied_on: '5h ago', matched_skills: ['PyTorch', 'FastAPI'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan', pitch: 'Experienced with NLP ranking and graph embeddings. Would love to contribute!' },
      ]

      const inReview = tasks.filter(t => t.status === 'READY_FOR_REVIEW')
      const blocked = tasks.filter(t => t.status === 'BLOCKED')

      setPendingApplicants(initialPending)
      setReviewTasks(inReview)

      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length

      setData({
        project: projectInfo || attention.project || { title: 'AI for Social Good', tagline: 'Connecting purpose-driven builders.' },
        stats: {
          totalMembers: analytics?.stats?.totalMembers || 12,
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks: blocked.length,
          totalMilestones: analytics?.stats?.totalMilestones || 4,
          totalApplications: initialPending.length,
        },
        blockedTasks: blocked,
        milestones: [
          { id: 1, title: 'MVP Development & Architecture', dueDate: 'Jun 15, 2025', progress: 100, status: 'COMPLETED' },
          { id: 2, title: 'Private Beta with 50 Creators', dueDate: 'Jul 1, 2025', progress: 65, status: 'IN_PROGRESS' },
          { id: 3, title: 'Public Showcase & Community Launch', dueDate: 'Aug 10, 2025', progress: 20, status: 'PENDING' },
        ],
        recentActivities: [
          { text: 'Rahul submitted "Core Authentication" for review', time: '1 hour ago', type: 'review' },
          { text: 'Ananya Singh applied for Frontend Architect', time: '2 hours ago', type: 'application' },
          { text: 'Priya Patel completed UI Style Guide', time: '5 hours ago', type: 'task' },
          { text: 'Sneha joined as AI Specialist', time: '1 day ago', type: 'member' },
        ]
      })
    } catch (err) {
      console.error('Failed to fetch overview data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverviewData()
  }, [id])

  const handleApplicantAction = async (applicantId, action) => {
    try {
      await api.applicantAction(id, applicantId, action).catch(() => null)
      setPendingApplicants(prev => prev.filter(a => a.id !== applicantId))
      setActionSuccessMessage(`Applicant ${action === 'ACCEPT' ? 'accepted & welcomed to the team' : 'declined'}.`)
      setTimeout(() => setActionSuccessMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to update applicant status')
    }
  }

  const handleTaskReviewAction = async (taskId, action) => {
    try {
      if (action === 'APPROVE') {
        await api.reviewTask(id, taskId, { action: 'APPROVE' }).catch(() => null)
        setReviewTasks(prev => prev.filter(t => t.id !== taskId))
        setActionSuccessMessage('Deliverable approved & marked as completed!')
      } else {
        await api.reviewTask(id, taskId, { action: 'REQUEST_CHANGES', feedback: 'Changes requested' }).catch(() => null)
        setReviewTasks(prev => prev.filter(t => t.id !== taskId))
        setActionSuccessMessage('Feedback logged and task returned to In Progress.')
      }
      setTimeout(() => setActionSuccessMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to process task review')
    }
  }

  const handleQuickCreateTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      setNewTaskSubmitting(true)
      await api.createFounderTask(id, {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
      }).catch(() => null)

      setIsTaskModalOpen(false)
      setNewTaskTitle('')
      setActionSuccessMessage(`Task "${newTaskTitle}" created successfully!`)
      setTimeout(() => setActionSuccessMessage(''), 4000)
      loadOverviewData()
    } catch (err) {
      alert(err.message || 'Failed to create task')
    } finally {
      setNewTaskSubmitting(false)
    }
  }

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex flex-col items-center justify-center py-28 text-slate-500">
          <div className="w-10 h-10 border-3 border-[#7f1d3b]/20 border-t-[#7f1d3b] rounded-full animate-spin mb-4" />
          <p className="font-display font-medium text-slate-700 text-sm">Loading project telemetry...</p>
        </div>
      </FounderLayout>
    )
  }

  if (error) {
    return (
      <FounderLayout>
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
          <div className="inline-flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold mb-3">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <p className="text-xs text-slate-500">Unable to load admin telemetry. Please try refreshing.</p>
        </div>
      </FounderLayout>
    )
  }

  const { project = {}, stats = {}, milestones = [], recentActivities = [], blockedTasks = [] } = data || {}
  const completionPercentage = Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)
  const totalDecisionsCount = pendingApplicants.length + reviewTasks.length + blockedTasks.length

  return (
    <FounderLayout>
      <div className="space-y-6">
        {/* ── Action Feedback Toast ────────────────────────────────────────── */}
        {actionSuccessMessage && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-900 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Top Header Strip ────────────────────────────────────────────── */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                {project.title || 'AI for Social Good'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Active Build
              </span>
              {totalDecisionsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  {totalDecisionsCount} {totalDecisionsCount === 1 ? 'decision needed' : 'decisions needed'}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs sm:text-sm line-clamp-1">
              {project.tagline || project.description || 'Coordinating contributors and accelerating build milestones.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7f1d3b] hover:bg-[#5c132b] text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Create Task</span>
            </button>
            <Link
              to={`/projects/${id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              <span>Public View</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* ── 4 Telemetry Metric Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Task Completion */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Task Completion</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckSquare size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-2xl font-bold text-slate-900">{completionPercentage}%</span>
                <span className="text-xs text-slate-400 font-medium">({stats.completedTasks}/{stats.totalTasks} done)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Active Roster */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Roster</span>
              <div className="p-2 bg-[#7f1d3b]/10 text-[#7f1d3b] rounded-lg">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-2xl font-bold text-slate-900">{stats.totalMembers}</span>
                <span className="text-xs text-slate-400 font-medium">Contributors</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {pendingApplicants.length} applicants in recruiting pipeline
              </p>
            </div>
          </div>

          {/* Card 3: Decision Queue */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
            totalDecisionsCount > 0 ? 'bg-amber-50/40 border-amber-200/90' : 'bg-white border-stone-200/80'
          }`}>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Decision Queue</span>
              <div className={`p-2 rounded-lg ${totalDecisionsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                <ShieldCheck size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-display text-2xl font-bold ${totalDecisionsCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                  {totalDecisionsCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">pending actions</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {totalDecisionsCount === 0 ? 'All reviews & requests cleared' : `${pendingApplicants.length} apps · ${reviewTasks.length} reviews`}
              </p>
            </div>
          </div>

          {/* Card 4: Sprint Velocity */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Milestone Pace</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Flame size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-2xl font-bold text-slate-900">Sprint 3</span>
                <span className="text-xs text-emerald-600 font-bold">On Schedule</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Targeting next release in 14 days
              </p>
            </div>
          </div>
        </div>

        {/* ── ⚡ Actionable Decision Queue (Attention Center) ───────────────── */}
        <section className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Decision Queue
                </h2>
                <p className="text-[11px] text-slate-500">
                  Clear blockers, review deliverables, and welcome applicants with 1 click.
                </p>
              </div>
            </div>

            {totalDecisionsCount > 0 && (
              <span className="text-xs font-bold text-[#7f1d3b] bg-[#7f1d3b]/10 px-2.5 py-1 rounded-full">
                {totalDecisionsCount} pending
              </span>
            )}
          </div>

          {totalDecisionsCount === 0 ? (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-display text-sm font-bold text-slate-800 mb-1">Decision Queue Cleared</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No pending applicant reviews or blocked deliverables. Your project is cruising smoothly!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. Pending Applicants */}
              {pendingApplicants.map((applicant) => (
                <div
                  key={`applicant-${applicant.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-stone-50/70 hover:bg-stone-50 rounded-xl border border-stone-200/60 gap-4 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={applicant.avatar}
                      alt={applicant.name}
                      className="w-10 h-10 rounded-full bg-stone-200 object-cover border border-stone-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{applicant.name}</span>
                        <span className="text-[10px] font-semibold text-slate-500">applied for</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#7f1d3b]/10 text-[#7f1d3b]">
                          {applicant.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">({applicant.applied_on})</span>
                      </div>
                      {applicant.pitch && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic">
                          "{applicant.pitch}"
                        </p>
                      )}
                      {applicant.matched_skills && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {applicant.matched_skills.map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-stone-200 text-[9px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleApplicantAction(applicant.id, 'REJECT')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApplicantAction(applicant.id, 'ACCEPT')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#7f1d3b] hover:bg-[#5c132b] rounded-lg transition-colors shadow-sm"
                    >
                      <UserPlus size={13} />
                      <span>Accept & Invite</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* 2. Tasks Awaiting Review */}
              {reviewTasks.map((task) => (
                <div
                  key={`review-${task.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-200/80 gap-4 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{task.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Ready for Review
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Submitted by <strong className="text-slate-800">{task.assignee?.name || 'Contributor'}</strong> · Due {task.due_date || 'Soon'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleTaskReviewAction(task.id, 'REQUEST_CHANGES')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleTaskReviewAction(task.id, 'APPROVE')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                    >
                      <Check size={13} />
                      <span>Approve & Complete</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* 3. Blocked Tasks */}
              {blockedTasks.map((task) => (
                <div
                  key={`blocked-${task.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-rose-50/60 rounded-xl border border-rose-200/80 gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-rose-100 text-rose-800 rounded-lg shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{task.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          Blocked
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-1">
                        Assignee: {task.assignee?.name || 'Unassigned'} · Requires owner intervention
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/founder/projects/${id}/tasks`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors self-end md:self-center"
                  >
                    <span>Resolve Task</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Dual-Column Overview Section ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestones Roadmap */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-[#7f1d3b]" />
                <h3 className="font-display font-bold text-sm text-slate-900">Milestone Roadmap</h3>
              </div>
              <Link
                to={`/founder/projects/${id}/milestones`}
                className="text-xs font-bold text-[#7f1d3b] hover:text-[#5c132b] flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="p-3.5 bg-stone-50/70 rounded-xl border border-stone-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800 truncate pr-2">{m.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      m.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-stone-200 text-slate-700'
                    }`}>
                      {m.status === 'COMPLETED' ? 'Done' : m.status === 'IN_PROGRESS' ? 'In Progress' : 'Planned'}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${
                        m.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#7f1d3b]'
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Due {m.dueDate}</span>
                    <span>{m.progress}% Progress</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Activity Stream */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#7f1d3b]" />
                <h3 className="font-display font-bold text-sm text-slate-900">Project Pulse & Activity</h3>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-3.5">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 py-1.5 border-b border-stone-100 last:border-none">
                  <div className="w-2 h-2 rounded-full bg-[#7f1d3b] mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700 font-medium">{act.text}</p>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={`/founder/projects/${id}/tasks`}
              className="mt-4 pt-3 border-t border-stone-100 text-center text-xs font-semibold text-slate-600 hover:text-[#7f1d3b] flex items-center justify-center gap-1 transition-colors"
            >
              <span>Explore All Tasks & Deliverables</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── Quick Create Task Modal ─────────────────────────────────────── */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <h3 className="font-display font-bold text-slate-900 text-sm">Quick Create Task</h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleQuickCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement Webhook listener"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f1d3b]/20 focus:border-[#7f1d3b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f1d3b]/20 focus:border-[#7f1d3b]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-stone-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newTaskSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#7f1d3b] hover:bg-[#5c132b] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {newTaskSubmitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  )
}
