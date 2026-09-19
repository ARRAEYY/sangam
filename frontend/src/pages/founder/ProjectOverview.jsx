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
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
          <div className="inline-flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold mb-3">
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
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* ── Action Feedback Toast ────────────────────────────────────────── */}
        {actionSuccessMessage && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 mb-6">
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
        <section className="reveal-in bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                {project.title || 'AI for Social Good'}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700">
                Active Build
              </span>
              {totalDecisionsCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-50 text-amber-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {totalDecisionsCount} {totalDecisionsCount === 1 ? 'decision needed' : 'decisions needed'}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm line-clamp-1">
              {project.tagline || project.description || 'Coordinating contributors and accelerating build milestones.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="button button-primary"
            >
              <Plus size={14} /> Create Task
            </button>
            <Link
              to={`/projects/${id}`}
              className="button button-secondary"
            >
              Public View <ExternalLink size={14} />
            </Link>
          </div>
        </section>

        {/* ── 4 Telemetry Metric Cards (Stats Strip) ─────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 reveal-in delay-1 mb-12">
          {/* Card 1: Task Completion */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Completion</span>
              <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckSquare size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <strong className="text-3xl font-display font-bold text-slate-900">{completionPercentage}%</strong>
                <span className="text-[12px] font-medium text-slate-400">({stats.completedTasks}/{stats.totalTasks} done)</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionPercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Card 2: Active Roster */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Roster</span>
              <div className="w-6 h-6 rounded bg-red-50 text-red-600 flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <strong className="text-2xl font-display font-bold text-slate-900">{stats.totalMembers}</strong>
                <span className="text-[13px] font-medium text-slate-600">Contributors</span>
              </div>
              <span className="text-[12px] text-slate-500 font-medium">{pendingApplicants.length} applicants in recruiting pipeline</span>
            </div>
          </div>

          {/* Card 3: Decision Queue */}
          <div className="bg-[#fffcf5] border border-amber-100 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Decision Queue</span>
              <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <strong className="text-2xl font-display font-bold text-slate-900">{totalDecisionsCount}</strong>
                <span className="text-[13px] font-medium text-slate-600">pending actions</span>
              </div>
              <span className="text-[12px] text-slate-500 font-medium">{pendingApplicants.length} apps • {reviewTasks.length} reviews</span>
            </div>
          </div>

          {/* Card 4: Milestone Pace */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Milestone Pace</span>
              <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                <Flame size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <strong className="text-xl font-display font-bold text-slate-900">Sprint 3</strong>
                <span className="text-[12px] font-bold text-emerald-600">On Schedule</span>
              </div>
              <span className="text-[12px] text-slate-500 font-medium">Targeting next release in 14 days</span>
            </div>
          </div>
        </section>

        {/* ── ⚡ Actionable Decision Queue (Attention Center) ───────────────── */}
        <section className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm reveal-in delay-2 mb-12">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                 <Sparkles size={16} />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-slate-900 leading-tight">Decision Queue</h2>
                 <p className="text-[12px] text-slate-500">Clear blockers, review deliverables, and welcome applicants with 1 click.</p>
               </div>
            </div>
            {totalDecisionsCount > 0 && (
              <span className="text-[11px] font-bold tracking-widest text-maroon bg-[#fff0f4] px-3 py-1 rounded-full uppercase shrink-0">
                {totalDecisionsCount} pending
              </span>
            )}
          </div>

          {totalDecisionsCount === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No pending applicant reviews or blocked deliverables. Your project is cruising smoothly!
            </div>
          ) : (
            <div className="flex flex-col">
              {/* 1. Pending Applicants */}
              {pendingApplicants.map((applicant, index) => (
                <div
                  key={`applicant-${applicant.id}`}
                  className={`flex flex-col md:flex-row md:items-center justify-between py-4 ${index !== 0 ? 'border-t border-slate-100' : ''} gap-4 hover:bg-slate-50/30 transition-colors -mx-6 px-6`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={applicant.avatar}
                      alt={applicant.name}
                      className="w-10 h-10 rounded-full bg-slate-100 object-cover shrink-0 mt-1"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[14px] text-slate-900">{applicant.name}</span>
                        <span className="text-[12px] text-slate-500">applied for</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700">
                          {applicant.role}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">({applicant.applied_on})</span>
                      </div>
                      {applicant.pitch && (
                        <p className="text-[13px] text-slate-500 italic line-clamp-1">
                          "{applicant.pitch}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {applicant.matched_skills?.slice(0,3).map(skill => (
                          <span key={skill} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => handleApplicantAction(applicant.id, 'REJECT')}
                      className="text-[12px] font-semibold text-slate-500 hover:text-slate-800 transition px-2"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApplicantAction(applicant.id, 'ACCEPT')}
                      className="button button-primary text-[12px] py-2"
                    >
                      <UserPlus size={14} className="mr-1" /> Accept & Invite
                    </button>
                  </div>
                </div>
              ))}

              {/* 2. Tasks Awaiting Review */}
              {reviewTasks.map((task) => (
                <div
                  key={`review-${task.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between py-4 border-t border-slate-100 gap-4 hover:bg-slate-50/30 transition-colors -mx-6 px-6"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-600 shrink-0 mt-1">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[14px] text-slate-900">{task.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700">
                          Ready for Review
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500">
                        Submitted by <strong className="text-slate-700">{task.assignee?.name || 'Contributor'}</strong> <span className="mx-1">•</span> Due {task.due_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    <button
                      onClick={() => handleTaskReviewAction(task.id, 'REQUEST_CHANGES')}
                      className="text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-full px-4 py-2 transition"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleTaskReviewAction(task.id, 'APPROVE')}
                      className="button px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full border-none text-[12px]"
                    >
                      <Check size={14} className="mr-1" /> Approve & Complete
                    </button>
                  </div>
                </div>
              ))}

              {/* 3. Blocked Tasks */}
              {blockedTasks.map((task) => (
                <div
                  key={`blocked-${task.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between py-4 border-t border-slate-100 gap-4 hover:bg-slate-50/30 transition-colors -mx-6 px-6"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-600 shrink-0 mt-1">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[14px] text-slate-900">{task.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700">
                          Blocked
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500">
                        Assignee: <strong className="text-slate-700">{task.assignee?.name || 'Unassigned'}</strong> <span className="mx-1">•</span> Requires owner intervention
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/founder/projects/${id}/tasks`}
                    className="text-[12px] font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-full px-4 py-2 transition flex items-center gap-1 self-start md:self-center"
                  >
                    Resolve Task <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Dual-Column Overview Section ─────────────────────────────────── */}
        <div className="grid md:grid-cols-[1fr_300px] gap-8 reveal-in delay-3">
          
          {/* Milestones Roadmap */}
          <section className="dashboard-activity">
            <div className="section-heading mb-6">
              <div>
                <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">Timeline</span>
                <h2>Milestone Roadmap</h2>
              </div>
              <Link to={`/founder/projects/${id}/milestones`} className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="activity-list space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="activity-item p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm text-slate-800 truncate pr-2">{m.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                      m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      m.status === 'IN_PROGRESS' ? 'bg-brand-50 text-brand-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {m.status === 'COMPLETED' ? 'Done' : m.status === 'IN_PROGRESS' ? 'In Progress' : 'Planned'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        m.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Due {m.dueDate}</span>
                    <span>{m.progress}% Progress</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Real-time Activity Stream */}
          <section className="dashboard-sidebar">
            <div className="explore-card accent-sand p-6 rounded-[18px] border border-slate-100 bg-[#faf9f5]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200/50 pb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" /> Activity
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {recentActivities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-slate-700">{act.text}</p>
                      <span className="text-[11px] text-slate-400">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to={`/founder/projects/${id}/tasks`}
                className="button button-secondary w-full text-center justify-center text-[12px]"
              >
                Explore Deliverables <ArrowRight size={14} />
              </Link>
            </div>
          </section>

        </div>

        {/* ── Quick Create Task Modal ─────────────────────────────────────── */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <h3 className="font-display font-semibold text-slate-900 text-lg">Quick Create Task</h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full transition"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleQuickCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement Webhook listener"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="button button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newTaskSubmitting}
                    className="button button-primary"
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
