import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, UserPlus, X as XIcon, Trash2, Calendar, Target } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import SkillTagInput from '../components/SkillTagInput.jsx'

const ROLE_CATEGORIES = [
  'FRONTEND', 'BACKEND', 'FULLSTACK', 'DESIGN', 'PRODUCT',
  'DATA', 'DEVOPS', 'CONTENT', 'MARKETING', 'RESEARCH', 'OTHER',
]

export default function CreateProject() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  
  // Core Project Form
  const [form, setForm] = useState({
    title: '',
    description: '',
    team_size_needed: 1,
    skills: [],
    members: [], // Array of { user_id, role, role_category, full_name, avatar_url, branch }
    next_milestone: { title: '', due_date: '' },
  })
  
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Search State for adding members
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null)
  
  // Staged member details
  const [addMemberRole, setAddMemberRole] = useState('')
  const [addMemberCategory, setAddMemberCategory] = useState('OTHER')

  // Search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      setSearchingUsers(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true)
      try {
        const results = await api.searchUsers(searchQuery.trim(), token)
        // filter out current user and already staged members
        const filtered = results.filter(
          (u) => u.id !== user.id && !form.members.some((m) => m.user_id === u.id)
        )
        setSearchResults(filtered)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearchingUsers(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, token, user.id, form.members])

  const handleStageMember = () => {
    if (!selectedUserToAdd || !addMemberRole.trim()) return
    
    setForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          user_id: selectedUserToAdd.id,
          role: addMemberRole.trim(),
          role_category: addMemberCategory,
          full_name: selectedUserToAdd.full_name,
          avatar_url: selectedUserToAdd.avatar_url,
          branch: selectedUserToAdd.branch,
          email: selectedUserToAdd.email,
        }
      ]
    }))

    // Reset add member form
    setSelectedUserToAdd(null)
    setAddMemberRole('')
    setAddMemberCategory('OTHER')
    setSearchQuery('')
  }

  const handleRemoveStagedMember = (userId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter(m => m.user_id !== userId)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    
    // Clean up payload
    const payload = {
      title: form.title,
      description: form.description,
      team_size_needed: Number(form.team_size_needed),
      skills: form.skills,
      members: form.members,
    }
    
    if (form.next_milestone.title.trim()) {
      payload.next_milestone = {
        title: form.next_milestone.title.trim(),
        due_date: form.next_milestone.due_date || null,
      }
    }

    try {
      const project = await api.createProject(payload, token)
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl pb-24 pt-4">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Post a project</h1>
      <p className="mt-1 text-sm text-slate-500 max-w-2xl">
        Tell other students what you're building. You can optionally add existing team members and define your first milestone right now.
      </p>

      {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        
        {/* Core Project Details */}
        <section className="card p-6 space-y-5">
          <h2 className="font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">1</span>
            Project Details
          </h2>
          
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Building a campus food-delivery app"
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></span>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What are you building? What is the goal? What will teammates own?"
              className="input min-h-[140px] leading-relaxed"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Required skills</span>
              <SkillTagInput
                value={form.skills}
                onChange={(skills) => setForm({ ...form, skills })}
                placeholder="e.g. React, Figma, Postgres"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Open positions needed <span className="text-red-500">*</span></span>
              <input
                type="number"
                min={1}
                required
                value={form.team_size_needed}
                onChange={(e) => setForm({ ...form, team_size_needed: e.target.value })}
                className="input"
              />
              <p className="text-[11px] text-slate-500 mt-1">Number of additional teammates you are looking to recruit.</p>
            </label>
          </div>
        </section>

        {/* Optional Team Members */}
        <section className="card p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">2</span>
              Team Members <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 pl-7">Add peers who are already working on this project with you.</p>
          </div>

          {form.members.length > 0 && (
            <div className="space-y-2 mb-4">
              {form.members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 shrink-0">
                        {(m.full_name || '?')[0].toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.full_name}</p>
                      <p className="text-xs text-brand-600 font-medium">{m.role} <span className="text-slate-400 ml-1 font-normal">• {m.role_category}</span></p>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveStagedMember(m.user_id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50/50 rounded-xl p-4 border border-dashed border-slate-200">
            {!selectedUserToAdd ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Search student</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input !pl-9 bg-white"
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchingUsers && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Searching…
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
                  <p className="text-xs text-slate-400 mt-2">No matching students found.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-2.5">
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
                  <button type="button" onClick={() => setSelectedUserToAdd(null)} className="text-xs font-semibold text-brand-700 hover:text-brand-800 shrink-0 px-2">
                    Cancel
                  </button>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Role Title *</label>
                    <input
                      className="input bg-white text-sm"
                      placeholder="e.g. Frontend Developer"
                      value={addMemberRole}
                      onChange={(e) => setAddMemberRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Category</label>
                    <select
                      className="input bg-white text-sm"
                      value={addMemberCategory}
                      onChange={(e) => setAddMemberCategory(e.target.value)}
                    >
                      {ROLE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStageMember}
                  disabled={!addMemberRole.trim()}
                  className="btn-secondary w-full text-sm !py-2 disabled:opacity-50"
                >
                  <UserPlus size={16} /> Add to project
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Optional Next Milestone */}
        <section className="card p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">3</span>
              Next Milestone <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 pl-7">Set an immediate goal to give your team a clear target.</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-5">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-1.5"><Target size={14} className="text-slate-400"/> Milestone Title</span>
              <input
                value={form.next_milestone.title}
                onChange={(e) => setForm({ ...form, next_milestone: { ...form.next_milestone, title: e.target.value } })}
                placeholder="e.g. Design core database schema"
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> Due Date</span>
              <input
                type="date"
                value={form.next_milestone.due_date}
                onChange={(e) => setForm({ ...form, next_milestone: { ...form.next_milestone, due_date: e.target.value } })}
                className="input"
              />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
          <button type="button" onClick={() => navigate(-1)} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary !px-8 !py-3 shadow-md">
            {submitting ? 'Creating Project…' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
