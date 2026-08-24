import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Github, Linkedin, Globe, Pencil, Check, X as XIcon, UserCheck, UserX, Code2, Plus, Briefcase, Trash2, Lock } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import SkillTagInput from '../components/SkillTagInput.jsx'
import ProjectCard from '../components/ProjectCard.jsx'

const STATUS_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
}

export default function Dashboard() {
  const { user, token, refreshProfile } = useAuth()
  const [myProjects, setMyProjects] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState(null)
  const [error, setError] = useState('')
  const [pendingRequests, setPendingRequests] = useState([])
  const [connections, setConnections] = useState([])
  const [experiences, setExperiences] = useState([])
  const [showAddExperience, setShowAddExperience] = useState(false)
  const [experienceForm, setExperienceForm] = useState({
    organization: '',
    role: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMsg('')
    setChangingPassword(true)
    try {
      const res = await api.changePassword(passwordForm.current_password, passwordForm.new_password, token)
      setPasswordMsg(res.message || 'Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '' })
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const loadConnections = () => {
    if (!token) return
    api.listConnectionRequests('received', token).then((all) =>
      setPendingRequests(all.filter((r) => r.status === 'PENDING'))
    ).catch((err) => setError(err.message))
    api.listConnections(token).then(setConnections).catch((err) => setError(err.message))
  }

  useEffect(() => {
    if (!user) return
    api
      .listProjects({})
      .then((all) => setMyProjects(all.filter((p) => p.owner && p.owner.id === user.id)))
      .catch((err) => setError(err.message))
    api
      .myApplications(token)
      .then(setMyApplications)
      .catch((err) => setError(err.message))
    api
      .getUserPublicProfile(user.id, token)
      .then((data) => setExperiences(data.experiences || []))
      .catch(console.error)
    loadConnections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  const respondToRequest = async (id, status) => {
    try {
      await api.respondToConnectionRequest(id, status, token)
      loadConnections()
    } catch (err) {
      setError(err.message)
    }
  }

  const withdrawApplication = async (id) => {
    try {
      await api.updateApplicationStatus(id, 'WITHDRAWN', token)
      const refreshed = await api.myApplications(token)
      setMyApplications(refreshed)
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditing = () => {
    setProfileDraft({
      full_name: user.full_name,
      branch: user.branch,
      graduation_year: user.graduation_year,
      headline: user.headline || '',
      location: user.location || '',
      bio: user.bio || '',
      github_url: user.github_url || '',
      linkedin_url: user.linkedin_url || '',
      portfolio_url: user.portfolio_url || '',
      leetcode_url: user.leetcode_url || '',
      codeforces_url: user.codeforces_url || '',
      skills: user.skills.map((s) => s.name),
    })
    setEditingProfile(true)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.updateProfile(
        { ...profileDraft, graduation_year: Number(profileDraft.graduation_year) },
        token
      )
      await refreshProfile()
      setEditingProfile(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddExperience = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const added = await api.addExperience(experienceForm, token)
      setExperiences([added, ...experiences])
      setShowAddExperience(false)
      setExperienceForm({ organization: '', role: '', description: '', start_date: '', end_date: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Delete this experience?')) return
    try {
      await api.deleteExperience(id, token)
      setExperiences(experiences.filter(exp => exp.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!user) return null

  const initials = user.full_name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-4xl pb-16 pt-2">
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <section className="card mb-10 p-5 sm:p-7">
        {!editingProfile ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base sm:text-lg font-bold text-brand-600">
                  {initials}
                </span>
                <div className="min-w-0">
                  <h1 className="font-display text-lg sm:text-xl font-semibold text-slate-900 truncate">{user.full_name}</h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {user.branch} · Class of {user.graduation_year}
                  </p>
                  {user.headline && <p className="mt-0.5 text-xs sm:text-sm text-slate-600">{user.headline}</p>}
                  {user.location && <p className="mt-0.5 text-xs text-slate-400">{user.location}</p>}
                </div>
              </div>
              <button onClick={startEditing} className="btn-secondary self-start sm:self-auto shrink-0 !px-3.5 !py-1.5 text-xs">
                <Pencil size={13} /> Edit profile
              </button>
            </div>

            {user.bio && <p className="mt-4 text-sm leading-relaxed text-slate-700">{user.bio}</p>}

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              {user.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Github size={13} /> GitHub
                </a>
              )}
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Linkedin size={13} /> LinkedIn
                </a>
              )}
              {user.portfolio_url && (
                <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Globe size={13} /> Portfolio
                </a>
              )}
              {user.leetcode_url && (
                <a href={user.leetcode_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Code2 size={13} /> LeetCode
                </a>
              )}
              {user.codeforces_url && (
                <a href={user.codeforces_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Code2 size={13} /> Codeforces
                </a>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {user.skills.map((s) => (
                <span key={s.id} className="pill bg-brand-50 text-brand-700">
                  {s.name}
                </span>
              ))}
              {user.skills.length === 0 && (
                <span className="text-xs text-slate-400">No skills added yet.</span>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name">
                <input
                  className="input"
                  value={profileDraft.full_name}
                  onChange={(e) => setProfileDraft({ ...profileDraft, full_name: e.target.value })}
                />
              </Field>
              <Field label="Branch / major">
                <input
                  className="input"
                  value={profileDraft.branch}
                  onChange={(e) => setProfileDraft({ ...profileDraft, branch: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Graduation year">
              <input
                type="number"
                min={new Date().getFullYear() - 5}
                max={new Date().getFullYear() + 5}
                className="input max-w-[160px]"
                value={profileDraft.graduation_year}
                onChange={(e) => setProfileDraft({ ...profileDraft, graduation_year: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Headline (optional)">
                <input
                  className="input"
                  placeholder="e.g. Full-stack dev & design enthusiast"
                  value={profileDraft.headline}
                  onChange={(e) => setProfileDraft({ ...profileDraft, headline: e.target.value })}
                />
              </Field>
              <Field label="Location (optional)">
                <input
                  className="input"
                  placeholder="e.g. Sonipat, Haryana"
                  value={profileDraft.location}
                  onChange={(e) => setProfileDraft({ ...profileDraft, location: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Bio">
              <textarea
                className="input"
                rows={3}
                value={profileDraft.bio}
                onChange={(e) => setProfileDraft({ ...profileDraft, bio: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="GitHub">
                <input
                  className="input"
                  value={profileDraft.github_url}
                  onChange={(e) => setProfileDraft({ ...profileDraft, github_url: e.target.value })}
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  className="input"
                  value={profileDraft.linkedin_url}
                  onChange={(e) => setProfileDraft({ ...profileDraft, linkedin_url: e.target.value })}
                />
              </Field>
              <Field label="Portfolio">
                <input
                  className="input"
                  value={profileDraft.portfolio_url}
                  onChange={(e) => setProfileDraft({ ...profileDraft, portfolio_url: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="LeetCode (optional)">
                <input
                  className="input"
                  value={profileDraft.leetcode_url}
                  onChange={(e) => setProfileDraft({ ...profileDraft, leetcode_url: e.target.value })}
                />
              </Field>
              <Field label="Codeforces (optional)">
                <input
                  className="input"
                  value={profileDraft.codeforces_url}
                  onChange={(e) => setProfileDraft({ ...profileDraft, codeforces_url: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Skills">
              <SkillTagInput
                value={profileDraft.skills}
                onChange={(skills) => setProfileDraft({ ...profileDraft, skills })}
              />
            </Field>
            <div className="flex gap-2 pt-1">
              <button className="btn-primary !px-5">
                <Check size={15} /> Save
              </button>
              <button type="button" onClick={() => setEditingProfile(false)} className="btn-secondary !px-4">
                <XIcon size={15} /> Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Change password */}
      <section className="mb-10">
        <button
          onClick={() => { setShowChangePassword(!showChangePassword); setPasswordMsg(''); setPasswordError(''); }}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition"
        >
          <Lock size={15} />
          {showChangePassword ? 'Hide' : 'Change password'}
        </button>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="card mt-3 p-5 space-y-4 max-w-md">
            {passwordMsg && (
              <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{passwordMsg}</div>
            )}
            {passwordError && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{passwordError}</div>
            )}
            <Field label="Current password">
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                required
                minLength={12}
                placeholder="Min 12 chars, upper/lower/digit/special"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="input"
              />
            </Field>
            <button type="submit" disabled={changingPassword} className="btn-primary !px-5">
              {changingPassword ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">Work experience</h2>
          <button onClick={() => setShowAddExperience(true)} className="btn-secondary !px-3.5 !py-1.5 text-xs">
            <Plus size={13} /> Add
          </button>
        </div>

        {showAddExperience && (
          <form onSubmit={handleAddExperience} className="card p-4 sm:p-5 mb-4 space-y-3 bg-slate-50 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Organization *">
                <input required className="input bg-white" value={experienceForm.organization} onChange={(e) => setExperienceForm({...experienceForm, organization: e.target.value})} />
              </Field>
              <Field label="Role *">
                <input required className="input bg-white" value={experienceForm.role} onChange={(e) => setExperienceForm({...experienceForm, role: e.target.value})} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Start Date *">
                <input required type="date" className="input bg-white" value={experienceForm.start_date} onChange={(e) => setExperienceForm({...experienceForm, start_date: e.target.value})} />
              </Field>
              <Field label="End Date">
                <input type="date" className="input bg-white" value={experienceForm.end_date} onChange={(e) => setExperienceForm({...experienceForm, end_date: e.target.value})} />
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={2} className="input bg-white" value={experienceForm.description} onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})} />
            </Field>
            <div className="flex gap-2 pt-2">
              <button className="btn-primary !px-5 text-sm">Save</button>
              <button type="button" onClick={() => setShowAddExperience(false)} className="btn-secondary !px-4 text-sm">Cancel</button>
            </div>
          </form>
        )}

        {experiences.length === 0 && !showAddExperience ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            No work experience added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id} className="card p-4 flex gap-3">
                <div className="mt-1">
                  <Briefcase className="text-slate-400" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{exp.role}</h3>
                      <p className="text-sm text-slate-600">{exp.organization}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(exp.start_date).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})} - {exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, {month: 'short', year: 'numeric'}) : 'Present'}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteExperience(exp.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {exp.description && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">Your posted projects</h2>
        {myProjects.length === 0 ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            You haven't posted a project yet.{' '}
            <Link to="/create" className="font-semibold text-brand-600">
              Post one now →
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700 uppercase tracking-wider">Active Projects</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {myProjects.filter(p => !['COMPLETED', 'ARCHIVED'].includes(p.status)).map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
                {myProjects.filter(p => !['COMPLETED', 'ARCHIVED'].includes(p.status)).length === 0 && (
                  <p className="text-sm text-slate-500 col-span-2">No active projects.</p>
                )}
              </div>
            </div>
            
            {myProjects.filter(p => ['COMPLETED', 'ARCHIVED'].includes(p.status)).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700 uppercase tracking-wider mt-6">Past Projects</h3>
                <div className="grid gap-4 sm:grid-cols-2 opacity-75">
                  {myProjects.filter(p => ['COMPLETED', 'ARCHIVED'].includes(p.status)).map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">Your applications</h2>
        {myApplications.length === 0 ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            You haven't applied to any projects yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {myApplications.map((app) => (
              <div key={app.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div>
                  <Link to={`/projects/${app.project_id}`} className="font-semibold text-slate-900 hover:text-brand-600">
                    View project
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Applied {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`pill ${STATUS_COLORS[app.status]}`}>{app.status}</span>
                  {app.status === 'PENDING' && (
                    <button
                      onClick={() => withdrawApplication(app.id)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="connections" className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">
          Connection requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 pill bg-amber-50 text-amber-700">{pendingRequests.length} pending</span>
          )}
        </h2>
        {pendingRequests.length === 0 ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            No pending connection requests right now.
          </p>
        ) : (
          <div className="space-y-2.5">
            {pendingRequests.map((req) => (
              <div key={req.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{req.requester.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {req.requester.branch} · Class of {req.requester.graduation_year}
                  </p>
                  {req.message && (
                    <p className="mt-2 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 italic">
                      "{req.message}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToRequest(req.id, 'ACCEPTED')}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <UserCheck size={13} /> Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(req.id, 'DECLINED')}
                    className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    <UserX size={13} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">
          Your connections {connections.length > 0 && `(${connections.length})`}
        </h2>
        {connections.length === 0 ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            You haven't connected with anyone yet. Visit{' '}
            <Link to="/talent" className="font-semibold text-brand-600">
              Find talent
            </Link>{' '}
            to send a connection request.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {connections.map((c) => (
              <div key={c.connection_id} className="card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                  {c.user.full_name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{c.user.full_name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {c.user.branch} · Class of {c.user.graduation_year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
