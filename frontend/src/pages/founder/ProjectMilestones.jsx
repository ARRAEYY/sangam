import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Flag, MoreHorizontal, CheckCircle2, Clock, Pencil, Trash2, X, Calendar } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../api'

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
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Milestones</h1>
            <p className="text-xs text-slate-500">Set and track important milestones for your project.</p>
          </div>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus size={16} /> Add Milestone
          </button>
        </div>

        {/* Milestones Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading...</td>
                </tr>
              ) : milestones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">No milestones added yet.</td>
                </tr>
              ) : (
                milestones.map((m) => {
                  const disp = getStatusDisplay(m.status)
                  const prog = getProgress(m.status)
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.title}</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{m.description}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{m.due_date || '-'}</td>
                      <td className="py-3.5 px-4">
                        <select 
                          value={m.status} 
                          onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
                          className={`px-2 py-1 rounded text-[10px] font-bold outline-none cursor-pointer ${
                            disp === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-none' :
                            disp === 'In Progress' ? 'bg-indigo-100 text-indigo-700 border-none' :
                            disp === 'Blocked' ? 'bg-rose-100 text-rose-700 border-none' :
                            'bg-slate-100 text-slate-600 border-none'
                          }`}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 w-48">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prog === 100 ? 'bg-emerald-500' : prog > 0 ? 'bg-indigo-600' : 'bg-slate-300'
                              }`}
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 shrink-0">{prog}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-display font-bold text-slate-900 text-sm">{editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 1 Launch"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Briefly describe what needs to be done..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingMilestoneId ? 'Save Changes' : 'Add Milestone')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}
    </FounderLayout>
  )
}
