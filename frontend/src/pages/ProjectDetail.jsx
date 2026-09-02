import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Mail,
  Github,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
  Crown,
  UserMinus,
  LogOut,
  Plus,
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Calendar,
  UserPlus,
  Search,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

const STATUS_STYLES = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  COMPLETED: 'bg-slate-100 text-slate-500',
}

const ROLE_CATEGORIES = [
  'FRONTEND', 'BACKEND', 'FULLSTACK', 'DESIGN', 'PRODUCT',
  'DATA', 'DEVOPS', 'CONTENT', 'MARKETING', 'RESEARCH', 'LEAD', 'OTHER',
]

const MILESTONE_STATUS_ICONS = {
  NOT_STARTED: <Circle size={14} className="text-slate-400" />,
  IN_PROGRESS: <Loader2 size={14} className="text-brand-600 animate-spin" />,
  COMPLETED: <CheckCircle2 size={14} className="text-emerald-600" />,
  BLOCKED: <AlertCircle size={14} className="text-red-500" />,
}

const MILESTONE_STATUS_PILLS = {
  NOT_STARTED: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-600',
}

const MILESTONE_STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'Working',
  COMPLETED: 'Done',
  BLOCKED: 'Blocked',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [applicants, setApplicants] = useState(null)
  const [members, setMembers] = useState([])
  const [milestoneData, setMilestoneData] = useState({ milestones: [], progress: { total: 0, completed: 0, percentage: 0 } })
  const [pitch, setPitch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)

  const [isEditingProject, setIsEditingProject] = useState(false)
  const [projectForm, setProjectForm] = useState(null)

  // Accept modal state
  const [acceptModal, setAcceptModal] = useState(null) // { appId, applicantName }
  const [acceptRole, setAcceptRole] = useState('Team Member')
  const [acceptCategory, setAcceptCategory] = useState('OTHER')

  // Milestone form state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '', status: 'NOT_STARTED' })
  const [editingMilestone, setEditingMilestone] = useState(null)

  // Edit role modal state
  const [editRoleModal, setEditRoleModal] = useState(null)
  const [editRoleForm, setEditRoleForm] = useState({ role: '', role_category: '' })

  // Add member modal state (direct add by lead)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null)
  const [addMemberRole, setAddMemberRole] = useState('')
  const [addMemberCategory, setAddMemberCategory] = useState('OTHER')
  const [addMemberError, setAddMemberError] = useState('')
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false)

  useEffect(() => {
    api.getProject(id).then(setProject).catch((err) => setError(err.message))
    api.getMembers(id).then(setMembers).catch(() => {})
    api.getMilestones(id).then(setMilestoneData).catch(() => {})
  }, [id])

  const isOwner = user && project && project.owner?.id === user.id
  const isMember = members.some((m) => m.user_id === user?.id)
  const myMembership = members.find((m) => m.user_id === user?.id)

  // Search autocomplete for adding members
  useEffect(() => {
    if (!searchQuery.trim() || !showAddMemberModal || selectedUserToAdd) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearchingUsers(true)
      setAddMemberError('')
      api.searchUsers(searchQuery.trim())
        .then((res) => {
          const existingIds = new Set(members.map((m) => m.user_id))
          setSearchResults(res.filter((u) => !existingIds.has(u.id)))
        })
        .catch((err) => setAddMemberError(err.message))
        .finally(() => setSearchingUsers(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, showAddMemberModal, selectedUserToAdd, members])

  useEffect(() => {
    if (isOwner) {
      api.getApplicants(id).then(setApplicants).catch((err) => setError(err.message))
    }
  }, [isOwner, id])

  const refreshMembers = () => api.getMembers(id).then(setMembers).catch(() => {})
  const refreshMilestones = () => api.getMilestones(id).then(setMilestoneData).catch(() => {})

  const handleApply = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.applyToProject(id, { pitch_message: pitch })
      setStatus('Application sent!')
      setShowApplyForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const openAcceptModal = (appId, applicantName) => {
    setAcceptModal({ appId, applicantName })
    setAcceptRole('Team Member')
    setAcceptCategory('OTHER')
  }

  const confirmAccept = async () => {
    if (!acceptModal) return
    try {
      await api.updateApplicationStatus(acceptModal.appId, 'ACCEPTED', {
        role: acceptRole,
        role_category: acceptCategory,
      })
      const refreshed = await api.getApplicants(id)
      setApplicants(refreshed)
      await refreshMembers()
      setAcceptModal(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const decide = async (appId, newStatus) => {
    if (newStatus === 'ACCEPTED') return // handled by modal
    try {
      await api.updateApplicationStatus(appId, newStatus)
      const refreshed = await api.getApplicants(id)
      setApplicants(refreshed)
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditing = () => {
    setProjectForm({
      title: project.title,
      description: project.description,
      team_size_needed: project.team_size_needed,
      skills: project.required_skills.map((s) => s.name),
    })
    setIsEditingProject(true)
  }

  const handleEditProject = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const updated = await api.editProject(id, projectForm)
      setProject(updated)
      setIsEditingProject(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this project? This cannot be undone.')) return
    try {
      await api.deleteProject(id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  // ─── Member Actions ────────────────────────────────────────
  const handleRemoveMember = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return
    try {
      await api.removeMember(id, userId)
      await refreshMembers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this project?')) return
    try {
      await api.leaveProject(id, user.id)
      await refreshMembers()
    } catch (err) {
      setError(err.message)
    }
  }

  const openEditRole = (member) => {
    setEditRoleModal(member)
    setEditRoleForm({ role: member.role, role_category: member.role_category })
  }

  const confirmEditRole = async () => {
    if (!editRoleModal) return
    try {
      await api.updateMemberRole(id, editRoleModal.user_id, editRoleForm)
      await refreshMembers()
      setEditRoleModal(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUserToAdd) {
      setAddMemberError('Please search and select a user to add.')
      return
    }
    if (!addMemberRole.trim()) {
      setAddMemberError('Role title is required.')
      return
    }
    setAddMemberSubmitting(true)
    setAddMemberError('')
    try {
      await api.addProjectMember(id, {
        user_id: selectedUserToAdd.id,
        role: addMemberRole.trim(),
        role_category: addMemberCategory,
      })
      await refreshMembers()
      setShowAddMemberModal(false)
      setSelectedUserToAdd(null)
      setSearchQuery('')
      setAddMemberRole('')
    } catch (err) {
      setAddMemberError(err.message)
    } finally {
      setAddMemberSubmitting(false)
    }
  }

  // ─── Milestone Actions ─────────────────────────────────────
  const handleCreateMilestone = async (e) => {
    e.preventDefault()
    try {
      await api.createMilestone(id, {
        title: milestoneForm.title,
        description: milestoneForm.description || undefined,
        due_date: milestoneForm.due_date || undefined,
        status: milestoneForm.status,
      })
      await refreshMilestones()
      setShowMilestoneForm(false)
      setMilestoneForm({ title: '', description: '', due_date: '', status: 'NOT_STARTED' })
    } catch (err) {
      setError(err.message)
    }
  }


  const handleUpdateMilestone = async (e) => {
    e.preventDefault()
    try {
      await api.updateMilestone(id, editingMilestone.id, {
        title: editingMilestone.title,
        description: editingMilestone.description || undefined,
        due_date: editingMilestone.due_date || undefined,
        status: editingMilestone.status,
      })
      await refreshMilestones()
      setEditingMilestone(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleMilestone = async (milestone) => {
    const nextStatus = milestone.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED'
    try {
      await api.updateMilestone(id, milestone.id, { status: nextStatus })
      await refreshMilestones()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateMilestoneStatus = async (milestone, newStatus) => {
    try {
      await api.updateMilestone(id, milestone.id, { status: newStatus })
      await refreshMilestones()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Delete this milestone?')) return
    try {
      await api.deleteMilestone(id, milestoneId)
      await refreshMilestones()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !project) return <p className="py-10 text-red-600">{error}</p>
  if (!project) return <p className="py-10 text-slate-500">Loading…</p>

  const { milestones, progress } = milestoneData

  return (
    <div className="max-w-3xl pb-16 pt-2">
      {/* ─── Project Header Card ─────────────────────────────── */}
      <div className="card p-6 sm:p-8">
        {!isEditingProject ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-slate-900">{project.title}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
                  Posted by {project.owner?.full_name || 'Unknown'} · <Users size={13} className="inline" />{' '}
                  {project.team_size_needed} needed
                  {(project.member_count || 0) > 0 && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {project.member_count} on team
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`pill ${STATUS_STYLES[project.status] || 'bg-slate-100 text-slate-500'}`}>
                  {project.status.replace('_', ' ')}
                </span>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={startEditing} className="text-slate-400 hover:text-brand-600 p-1" title="Edit project">
                      <Pencil size={15} />
                    </button>
                    <button onClick={handleDeleteProject} className="text-slate-400 hover:text-red-600 p-1" title="Delete project">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
              {project.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.required_skills.map((s) => (
                <span key={s.id} className="pill bg-brand-50 text-brand-700">
                  {s.name}
                </span>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleEditProject} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Project Title</label>
              <input required className="input" value={projectForm.title} onChange={(e) => setProjectForm({...projectForm, title: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea required rows={5} className="input" value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Team Size Needed</label>
              <input required type="number" min="1" className="input max-w-[150px]" value={projectForm.team_size_needed} onChange={(e) => setProjectForm({...projectForm, team_size_needed: parseInt(e.target.value) || 1})} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Required Skills (comma separated)</label>
              <input className="input" value={projectForm.skills.join(', ')} onChange={(e) => setProjectForm({...projectForm, skills: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="e.g. React, Node, Figma" />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn-primary !px-5"><Check size={15} /> Save Changes</button>
              <button type="button" onClick={() => setIsEditingProject(false)} className="btn-secondary !px-4"><XIcon size={15} /> Cancel</button>
            </div>
          </form>
        )}

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
        {status && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{status}</p>
        )}

        {!user && (
          <Link to="/auth" className="mt-6 inline-block text-sm font-semibold text-brand-600">
            Sign in to apply →
          </Link>
        )}

        {user && !isOwner && !status && !isMember && (
          <div className="mt-6">
            {!showApplyForm ? (
              <button onClick={() => setShowApplyForm(true)} className="btn-primary">
                Apply to this project
              </button>
            ) : (
              <form onSubmit={handleApply} className="space-y-3">
                <textarea
                  required
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Say a bit about why you'd be a good fit…"
                  className="input min-h-[100px]"
                />
                <button className="btn-primary">Send application</button>
              </form>
            )}
          </div>
        )}

        {/* Self-leave button for non-lead members */}
        {isMember && myMembership && !myMembership.is_lead && (
          <div className="mt-4">
            <button onClick={handleLeave} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition">
              <LogOut size={13} /> Leave Team
            </button>
          </div>
        )}
      </div>

      {/* ─── Progress Bar (if milestones exist) ──────────────── */}
      {progress.total > 0 && (
        <div className="mt-6 card p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-slate-900">
              <Target size={15} className="text-brand-600" /> Project Progress
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {progress.completed} of {progress.total} complete
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-semibold text-brand-600">{progress.percentage}%</p>
        </div>
      )}

      {/* ─── Team Roster ─────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
            <Users size={17} className="text-brand-600" /> Team ({members.length})
          </h2>
          {isOwner && (
            <button
              onClick={() => {
                setShowAddMemberModal(true)
                setSearchQuery('')
                setSearchResults([])
                setSelectedUserToAdd(null)
                setAddMemberRole('')
                setAddMemberCategory('OTHER')
                setAddMemberError('')
              }}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition shadow-sm"
            >
              <UserPlus size={13} /> Add Member
            </button>
          )}
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">No team members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="card flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {m.user?.avatar_url ? (
                    <img src={m.user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shrink-0">
                      {(m.user?.full_name || '?')[0].toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-900 text-sm truncate">
                      {m.user?.full_name || 'Unknown'}
                      {m.is_lead && <Crown size={12} className="text-amber-500" />}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {m.role}
                      {m.role_category !== 'OTHER' && m.role_category !== 'LEAD' && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {m.role_category}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isOwner && !m.is_lead && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditRole(m)}
                      className="text-slate-400 hover:text-brand-600 p-1"
                      title="Edit role"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.user_id, m.user?.full_name)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove member"
                    >
                      <UserMinus size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Milestones ──────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
            <Target size={17} className="text-brand-600" /> Milestones
          </h2>
          {isOwner && (
            <button
              onClick={() => { setShowMilestoneForm(!showMilestoneForm); setEditingMilestone(null) }}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              <Plus size={13} /> Add
            </button>
          )}
        </div>

        {showMilestoneForm && isOwner && (
          <form onSubmit={handleCreateMilestone} className="card mb-4 space-y-3 p-4">
            <input
              required
              className="input"
              placeholder="Milestone title"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Description (optional)"
              rows={2}
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
            />
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Due date (optional)</label>
                <input
                  type="date"
                  className="input !py-1.5 text-sm"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Status</label>
                <select
                  className="input !py-1.5 text-sm outline-none bg-white"
                  value={milestoneForm.status}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">Working</option>
                  <option value="COMPLETED">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
              <button className="btn-primary !py-1.5 !text-sm">Create Milestone</button>
              <button type="button" onClick={() => setShowMilestoneForm(false)} className="btn-secondary !py-1.5 !text-sm">Cancel</button>
            </div>
          </form>
        )}

        {milestones.length === 0 ? (
          <p className="text-sm text-slate-500">No milestones yet.</p>
        ) : (
          <div className="space-y-2">
            {milestones.map((m) => (
              editingMilestone?.id === m.id ? (
                <form key={m.id} onSubmit={handleUpdateMilestone} className="card p-4 space-y-3">
                  <input
                    required
                    className="input"
                    placeholder="Milestone title"
                    value={editingMilestone.title}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  />
                  <textarea
                    className="input"
                    placeholder="Description (optional)"
                    rows={2}
                    value={editingMilestone.description || ''}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  />
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Due date (optional)</label>
                      <input
                        type="date"
                        className="input !py-1.5 text-sm"
                        value={editingMilestone.due_date || ''}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status</label>
                      <select
                        className="input !py-1.5 text-sm outline-none bg-white"
                        value={editingMilestone.status}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, status: e.target.value })}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">Working</option>
                        <option value="COMPLETED">Done</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary !py-1.5 !text-sm">Update</button>
                    <button type="button" onClick={() => setEditingMilestone(null)} className="btn-secondary !py-1.5 !text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={() => isOwner && handleToggleMilestone(m)}
                      className={`mt-0.5 shrink-0 ${isOwner ? 'cursor-pointer hover:scale-110 transition' : ''}`}
                      disabled={!isOwner}
                    >
                      {MILESTONE_STATUS_ICONS[m.status]}
                    </button>
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${m.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {m.title}
                      </p>
                      {m.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{m.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                        {m.due_date && (
                          <span className="flex items-center gap-0.5">
                            <Calendar size={10} /> {m.due_date}
                          </span>
                        )}
                        {m.completed_at && (
                          <span className="text-emerald-600">✓ Completed {new Date(m.completed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`pill text-[10px] ${MILESTONE_STATUS_PILLS[m.status]}`}>
                      {MILESTONE_STATUS_LABELS[m.status] || m.status.replace('_', ' ')}
                    </span>
                    {isOwner && (
                      <div className="flex gap-1">
                        {/* Status cycle buttons */}
                        {m.status !== 'IN_PROGRESS' && m.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateMilestoneStatus(m, 'IN_PROGRESS')}
                            className="text-slate-400 hover:text-brand-600 p-0.5"
                            title="Start"
                          >
                            <Loader2 size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingMilestone(m)}
                          className="text-slate-400 hover:text-brand-600 p-0.5"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
            ))}
          </div>
        )}
      </div>

      {/* ─── Applicants (Owner Only) ─────────────────────────── */}
      {isOwner && applicants && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">
            Applicants ({applicants.length})
          </h2>
          {applicants.length === 0 && <p className="text-sm text-slate-500">No applications yet.</p>}
          <div className="space-y-3">
            {applicants.map((app) => (
              <div key={app.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{app.applicant.full_name}</p>
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} /> {app.applicant.email}
                      {app.applicant.github_url && (
                        <>
                          {' '}
                          · <Github size={12} className="inline" /> {app.applicant.github_url}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="pill shrink-0 bg-slate-100 text-slate-600">{app.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{app.pitch_message}</p>
                {app.status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openAcceptModal(app.id, app.applicant.full_name)}
                      className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => decide(app.id, 'REJECTED')}
                      className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Accept Modal (role picker) ──────────────────────── */}
      {acceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAcceptModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Accept {acceptModal.applicantName}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Assign a role and category for this new team member.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role Title</label>
                <input
                  className="input"
                  placeholder="e.g. Frontend Developer"
                  value={acceptRole}
                  onChange={(e) => setAcceptRole(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select
                  className="input"
                  value={acceptCategory}
                  onChange={(e) => setAcceptCategory(e.target.value)}
                >
                  {ROLE_CATEGORIES.filter((c) => c !== 'LEAD').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAcceptModal(null)} className="btn-secondary !px-4">Cancel</button>
              <button onClick={confirmAccept} className="btn-primary !px-5">
                <Check size={15} /> Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Role Modal ─────────────────────────────────── */}
      {editRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditRoleModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Edit Role — {editRoleModal.user?.full_name}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role Title</label>
                <input
                  className="input"
                  value={editRoleForm.role}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, role: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select
                  className="input"
                  value={editRoleForm.role_category}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, role_category: e.target.value })}
                >
                  {ROLE_CATEGORIES.filter((c) => c !== 'LEAD').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditRoleModal(null)} className="btn-secondary !px-4 text-xs">Cancel</button>
              <button onClick={confirmEditRole} className="btn-primary !px-5 text-xs">
                <Check size={15} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Member Modal (Direct add by lead) ──────────── */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddMemberModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-brand-600" /> Add Team Member
              </h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <XIcon size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Directly add an existing Sangam student to your project team.</p>

            {addMemberError && (
              <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2 text-xs text-red-700">{addMemberError}</div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              {/* Step 1: User Search / Selected User */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Student *</label>
                {!selectedUserToAdd ? (
                  <div className="relative">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className="input !pl-9"
                        placeholder="Search by name or email…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {searchingUsers && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Searching students…
                      </p>
                    )}

                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg space-y-1">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUserToAdd(u)
                              setSearchQuery('')
                              setSearchResults([])
                            }}
                            className="w-full flex items-center gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition"
                          >
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 shrink-0">
                                {(u.full_name || '?')[0].toUpperCase()}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">{u.full_name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{u.branch} · {u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchingUsers && (
                      <p className="text-xs text-slate-400 mt-1.5">No matching students found.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedUserToAdd.avatar_url ? (
                        <img src={selectedUserToAdd.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-200 text-xs font-bold text-brand-800 shrink-0">
                          {(selectedUserToAdd.full_name || '?')[0].toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{selectedUserToAdd.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{selectedUserToAdd.branch} · {selectedUserToAdd.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserToAdd(null)}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800 underline shrink-0 px-2"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Role Details */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role Title *</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Frontend Developer, UI Designer"
                  value={addMemberRole}
                  onChange={(e) => setAddMemberRole(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select
                  className="input"
                  value={addMemberCategory}
                  onChange={(e) => setAddMemberCategory(e.target.value)}
                >
                  {ROLE_CATEGORIES.filter((c) => c !== 'LEAD').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn-secondary !px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUserToAdd || !addMemberRole.trim() || addMemberSubmitting}
                  className="btn-primary !px-5 text-xs disabled:opacity-50"
                >
                  {addMemberSubmitting ? 'Adding…' : 'Add to Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
