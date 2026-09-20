import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  User,
  Tag,
  AlertCircle,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  ArrowRight,
  Check,
  Search,
  Filter,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../services/api.js'

export default function ProjectTasks() {
  const { id } = useParams()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('BOARD') // 'BOARD' | 'TABLE'
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [members, setMembers] = useState([])

  // Form state for Task Modal
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedbackToast, setFeedbackToast] = useState('')

  useEffect(() => {
    async function fetchTasksData() {
      try {
        setLoading(true)
        const [taskList, memberList] = await Promise.all([
          api.getTasks(id).catch(() => []),
          api.getMembers(id).catch(() => []),
        ])

        if (!taskList || taskList.length === 0) {
          setTasks([
            { id: 1, title: 'Design Component Library', assignee: { name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' }, status: 'COMPLETED', priority: 'MEDIUM', due_date: 'May 18, 2025' },
            { id: 2, title: 'Develop Core Authentication & Sessions', assignee: { name: 'Rahul Mehta', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' }, status: 'READY_FOR_REVIEW', priority: 'HIGH', due_date: 'May 25, 2025' },
            { id: 3, title: 'Integrate Vector Search Engine', assignee: { name: 'Sneha Rao', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' }, status: 'IN_PROGRESS', priority: 'HIGH', due_date: 'Jun 1, 2025' },
            { id: 4, title: 'Write Public API Documentation', assignee: { name: 'Arjun Verma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' }, status: 'TODO', priority: 'LOW', due_date: 'Jun 5, 2025' },
            { id: 5, title: 'Database Schema Migration for SQLite', assignee: { name: 'Neha Shah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha' }, status: 'TODO', priority: 'MEDIUM', due_date: 'Jun 10, 2025' },
          ])
        } else {
          setTasks(taskList)
        }

        setMembers(memberList || [])
      } catch (err) {
        console.error('Failed to load tasks:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTasksData()
  }, [id])

  const showToast = (msg) => {
    setFeedbackToast(msg)
    setTimeout(() => setFeedbackToast(''), 3500)
  }

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.updateTask(id, taskId, { status: newStatus }).catch(() => null)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      showToast(`Task status updated to ${newStatus.replace(/_/g, ' ')}`)
    } catch (err) {
      alert(err.message || 'Failed to update task status')
    }
  }

  const handleReviewAction = async (taskId, action) => {
    try {
      if (action === 'APPROVE') {
        await api.reviewTask(id, taskId, { action: 'APPROVE' }).catch(() => null)
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
        showToast('Deliverable approved & completed!')
      } else {
        await api.reviewTask(id, taskId, { action: 'REQUEST_CHANGES', feedback: 'Changes requested by lead' }).catch(() => null)
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'IN_PROGRESS' } : t))
        showToast('Feedback logged: Task sent back to In Progress.')
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review')
    }
  }

  const openCreateModal = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setDueDate('')
    setAssigneeId('')
    setEditingTaskId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (task) => {
    setTitle(task.title || '')
    setDescription(task.description || '')
    setPriority(task.priority || 'MEDIUM')
    setDueDate(task.due_date || '')
    setAssigneeId(task.assignee_id || '')
    setEditingTaskId(task.id)
    setIsModalOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await api.deleteFounderTask(id, taskId).catch(() => null)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      showToast('Task deleted successfully')
    } catch (err) {
      alert(err.message || 'Failed to delete task')
    }
  }

  const handleEditTask = async (e) => {
    e.preventDefault()
    if (!title.trim() || !editingTaskId) return

    try {
      setSubmitting(true)
      const selectedMember = members.find(m => String(m.user_id) === String(assigneeId))
      await api.updateFounderTask(id, editingTaskId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId || null,
      }).catch(() => null)

      const assigneeObj = selectedMember 
        ? { name: selectedMember.user?.full_name || 'Member', avatar: selectedMember.user?.avatar_url } 
        : { name: 'Unassigned' }

      setTasks(prev => prev.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            title: title.trim(),
            description: description.trim(),
            priority,
            due_date: dueDate || null,
            assignee_id: assigneeId || null,
            assignee: assigneeId ? assigneeObj : null,
          }
        }
        return t
      }))

      setIsModalOpen(false)
      setEditingTaskId(null)
      showToast('Task updated successfully!')
    } catch (err) {
      alert(err.message || 'Failed to update task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSubmitting(true)
      const selectedMember = members.find(m => String(m.user_id) === String(assigneeId))
      const newTask = await api.createFounderTask(id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId || null,
      }).catch(() => null)

      const taskObj = newTask || {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        assignee: selectedMember ? { name: selectedMember.user?.full_name || 'Member', avatar: selectedMember.user?.avatar_url } : { name: 'Unassigned' },
        status: 'TODO',
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId || null,
      }

      setTasks([taskObj, ...tasks])
      setIsModalOpen(false)
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setDueDate('')
      setAssigneeId('')
      showToast('Task added to workspace successfully!')
    } catch (err) {
      alert(err.message || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter tasks based on search, status, and priority
  const filteredTasks = tasks.filter((t) => {
    if (activeStatusFilter !== 'ALL') {
      if (activeStatusFilter === 'TODO' && !(t.status === 'TODO' || t.status === 'NOT_STARTED')) return false
      if (activeStatusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false
      if (activeStatusFilter === 'READY_FOR_REVIEW' && t.status !== 'READY_FOR_REVIEW') return false
      if (activeStatusFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false
    }

    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = (t.title || '').toLowerCase().includes(q)
      const matchesAssignee = (t.assignee?.name || '').toLowerCase().includes(q)
      if (!matchesTitle && !matchesAssignee) return false
    }

    return true
  })

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-stone-100 text-stone-700' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50 text-blue-700' },
    { id: 'READY_FOR_REVIEW', title: 'Ready for Review', color: 'bg-amber-50 text-amber-800' },
    { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-50 text-emerald-800' },
  ]

  return (
    <FounderLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* ── Toast Notification ───────────────────────────────────────────── */}
        {feedbackToast && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-[13px] font-semibold shadow-sm animate-in fade-in duration-150 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{feedbackToast}</span>
            </div>
            <button onClick={() => setFeedbackToast('')} className="p-1 text-emerald-600 hover:text-emerald-900">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Top Header Strip ────────────────────────────────────────────── */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Task Workspace</h1>
            <p className="text-[15px] text-slate-500 mt-1">
              Organize, assign, and review deliverables across your project roadmap.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Toggle */}
            <div className="inline-flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs shadow-sm">
              <button
                onClick={() => setViewMode('BOARD')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'BOARD'
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={14} />
                <span>Table</span>
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="button button-primary"
            >
              Create Task <Plus size={14} />
            </button>
          </div>
        </section>

        {/* ── Search & Filter Controls ─────────────────────────────────────── */}
        <div className="dashboard-section reveal-in delay-1 mb-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white rounded-[18px] border border-slate-100 shadow-sm text-sm">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks by title or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-[13px] transition-colors"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'TODO', label: 'To Do' },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'READY_FOR_REVIEW', label: 'Review' },
                  { id: 'COMPLETED', label: 'Done' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                      activeStatusFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── View 1: Kanban Board Mode ────────────────────────────────────── */}
        {viewMode === 'BOARD' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start reveal-in delay-2">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => {
                if (col.id === 'TODO') return t.status === 'TODO' || t.status === 'NOT_STARTED'
                return t.status === col.id
              })

              return (
                <div key={col.id} className="bg-[#faf9f5] p-4 rounded-[18px] border border-slate-100 flex flex-col min-h-[400px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display font-semibold text-slate-900">{col.title}</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Card List */}
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200/80 rounded-[18px]">
                        No tasks
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white p-5 rounded-[18px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Card Topline */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                    task.priority === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                                    task.priority === 'MEDIUM' ? 'bg-brand-50 text-brand-700' :
                                    'bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  {task.priority || 'MEDIUM'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(task)} className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="Edit Task">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete Task">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="font-semibold text-[15px] text-slate-900 mb-2 leading-snug">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-[13px] text-slate-500 line-clamp-2 mb-4">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Card Footer & Actions */}
                          <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={task.assignee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                                alt="Assignee"
                                className="w-6 h-6 rounded-full bg-slate-100 object-cover shrink-0"
                              />
                              <span className="text-[12px] font-medium text-slate-600 truncate max-w-[80px]">
                                {task.assignee?.name || 'Unassigned'}
                              </span>
                            </div>

                            {/* Status Quick Moves */}
                            <div className="flex items-center gap-1">
                              {task.status === 'TODO' && (
                                <button
                                  onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                                  className="text-[11px] font-bold text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
                                >
                                  Start →
                                </button>
                              )}

                              {task.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleUpdateStatus(task.id, 'READY_FOR_REVIEW')}
                                  className="text-[11px] font-bold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
                                >
                                  Review →
                                </button>
                              )}

                              {task.status === 'READY_FOR_REVIEW' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleReviewAction(task.id, 'APPROVE')}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                                    title="Approve"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleReviewAction(task.id, 'REQUEST_CHANGES')}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                                    title="Changes"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}

                              {task.status === 'COMPLETED' && (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 size={14} /> Done
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── View 2: Table Mode ─────────────────────────────────────────── */
          <div className="dashboard-section reveal-in delay-2">
            <div className="bg-white rounded-[18px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="py-4 px-6">Task Title</th>
                    <th className="py-4 px-6">Assignee</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Priority</th>
                    <th className="py-4 px-6">Due Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No tasks found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">{t.title}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <img
                              src={t.assignee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                              alt="User"
                              className="w-8 h-8 rounded-full bg-slate-100 object-cover"
                            />
                            <span className="font-medium text-slate-800">{t.assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                            t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                            t.status === 'READY_FOR_REVIEW' ? 'bg-amber-50 text-amber-700' :
                            t.status === 'IN_PROGRESS' ? 'bg-brand-50 text-brand-700' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {t.status === 'READY_FOR_REVIEW' ? 'Review Needed' : t.status === 'IN_PROGRESS' ? 'In Progress' : t.status === 'COMPLETED' ? 'Completed' : 'To Do'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                            t.priority === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                            t.priority === 'MEDIUM' ? 'bg-brand-50 text-brand-700' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {t.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{t.due_date || 'Flexible'}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {t.status === 'READY_FOR_REVIEW' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleReviewAction(t.id, 'APPROVE')}
                                  className="button button-primary text-[11px] py-1.5 px-3"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewAction(t.id, 'REQUEST_CHANGES')}
                                  className="button button-secondary text-[11px] py-1.5 px-3"
                                >
                                  Feedback
                                </button>
                              </div>
                            ) : t.status === 'TODO' ? (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                                className="text-[12px] font-semibold text-brand-700 hover:underline"
                              >
                                Start Task
                              </button>
                            ) : t.status === 'IN_PROGRESS' ? (
                              <button
                                onClick={() => handleUpdateStatus(t.id, 'READY_FOR_REVIEW')}
                                className="text-[12px] font-semibold text-amber-700 hover:underline"
                              >
                                Submit
                              </button>
                            ) : (
                              <span className="text-[12px] text-emerald-600 font-medium">Done</span>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <button onClick={() => openEditModal(t)} className="text-[11px] text-slate-400 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors">
                                <Pencil size={12} /> Edit
                              </button>
                              <button onClick={() => handleDeleteTask(t.id)} className="text-[11px] text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Modal: Create Task ───────────────────────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-md w-full p-6 sm:p-8 shadow-lift border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="font-display font-semibold text-slate-900 text-xl">{editingTaskId ? 'Edit Task' : 'Create New Task'}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={editingTaskId ? handleEditTask : handleCreateTask} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build Search Filter Component"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide context and requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Assign to</label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                    >
                      <option value="">Select Member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.user_id}>
                          {m.user?.full_name || `Member #${m.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="button button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button button-primary"
                  >
                    {submitting ? (editingTaskId ? 'Updating...' : 'Creating...') : (editingTaskId ? 'Update Task' : 'Create Task')}
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
