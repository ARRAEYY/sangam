import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Flag, MoreHorizontal, CheckCircle2, Clock, Pencil, Trash2, X, Calendar } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../services/api.js'

export default function ProjectMilestones() {
  const { id } = useParams()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = useState(null)
  
  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('NOT_STARTED')
  const [submitting, setSubmitting] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const data = await api.getMilestones(id).catch(() => ({ milestones: [] }))
        if (isMounted) {
          setMilestones(data.milestones || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [id])

  const openCreateModal = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setStatus('NOT_STARTED')
    setEditingMilestoneId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (m) => {
    setTitle(m.title || '')
    setDescription(m.description || '')
    setDueDate(m.due_date || '')
    setStatus(m.status || 'NOT_STARTED')
    setEditingMilestoneId(m.id)
    setIsModalOpen(true)
  }

  const handleDelete = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return
    try {
      await api.deleteMilestone(id, milestoneId)
      setMilestones(prev => prev.filter(m => m.id !== milestoneId))
      showToast('Milestone deleted')
    } catch (err) {
      alert(err.message || 'Failed to delete')
    }
  }

  const handleUpdateStatus = async (milestoneId, newStatus) => {
    try {
      await api.updateMilestone(id, milestoneId, { status: newStatus })
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m))
      showToast('Status updated')
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      if (editingMilestoneId) {
        await api.updateMilestone(id, editingMilestoneId, {
          title: title.trim(),
          description: description.trim(),
          status,
          due_date: dueDate || null
        })
        setMilestones(prev => prev.map(m => m.id === editingMilestoneId ? {
          ...m,
          title: title.trim(),
          description: description.trim(),
          status,
          due_date: dueDate || null
        } : m))
        showToast('Milestone updated')
      } else {
        const newM = await api.createMilestone(id, {
          title: title.trim(),
          description: description.trim(),
          status,
          due_date: dueDate || null
        })
        setMilestones(prev => [...prev, newM])
        showToast('Milestone created')
      }
      setIsModalOpen(false)
    } catch (err) {
      alert(err.message || 'Failed to save milestone')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusDisplay = (st) => {
    if (st === 'COMPLETED') return 'Completed'
    if (st === 'IN_PROGRESS' || st === 'READY_FOR_REVIEW') return 'In Progress'
    if (st === 'BLOCKED') return 'Blocked'
    return 'Not Started'
  }

  const getProgress = (st) => {
    if (st === 'COMPLETED') return 100
    if (st === 'IN_PROGRESS' || st === 'READY_FOR_REVIEW') return 50
    return 0
  }

  return (
    <FounderLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Milestones</h1>
            <p className="text-[15px] text-slate-500 mt-1">Set and track important milestones for your project.</p>
          </div>
          <button onClick={openCreateModal} className="button button-primary">
            Add Milestone <Plus size={14} />
          </button>
        </section>

        {/* Milestones Table */}
        <div className="dashboard-section reveal-in delay-1">
          <div className="bg-white rounded-[18px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Due Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Progress</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">Loading...</td>
                  </tr>
                ) : milestones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400 bg-[#faf9f5]">
                      <Flag size={32} className="mx-auto text-slate-300 mb-4" />
                      <p className="font-semibold text-[15px] text-slate-700">No milestones added yet.</p>
                      <p className="text-[13px] mt-1 text-slate-500">Plan out major deliverables to stay on track.</p>
                    </td>
                  </tr>
                ) : (
                  milestones.map((m) => {
                    const disp = getStatusDisplay(m.status)
                    const prog = getProgress(m.status)
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6 font-bold text-slate-900">{m.title}</td>
                        <td className="py-4 px-6 text-slate-500 max-w-xs truncate">{m.description}</td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{m.due_date || '-'}</td>
                        <td className="py-4 px-6">
                          <select 
                            value={m.status} 
                            onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer ${
                              disp === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-none' :
                              disp === 'In Progress' ? 'bg-brand-50 text-brand-700 border-none' :
                              disp === 'Blocked' ? 'bg-rose-50 text-rose-700 border-none' :
                              'bg-slate-50 text-slate-600 border-none'
                            }`}
                          >
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="BLOCKED">Blocked</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  prog === 100 ? 'bg-emerald-500' : prog > 0 ? 'bg-brand-600' : 'bg-slate-300'
                                }`}
                                style={{ width: `${prog}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 shrink-0">{prog}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-md w-full p-6 sm:p-8 shadow-lift border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="font-display font-semibold text-slate-900 text-xl">{editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phase 1 Launch"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-[13px] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="Briefly describe what needs to be done..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-[13px] transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-[13px] transition-all"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-[13px] transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6 mt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button button-primary"
                  >
                    {submitting ? 'Saving...' : (editingMilestoneId ? 'Save Changes' : 'Add Milestone')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 p-4 bg-slate-900 text-white rounded-xl shadow-2xl text-[13px] font-medium animate-in slide-in-from-bottom-5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toastMessage}
          </div>
        )}
      </div>
    </FounderLayout>
  )
}
