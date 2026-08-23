import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Github, Linkedin, Globe, Pencil, Check, X as XIcon, UserCheck, UserX, Code2 } from 'lucide-react'
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
          <div className="grid gap-4 sm:grid-cols-2">
            {myProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
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
