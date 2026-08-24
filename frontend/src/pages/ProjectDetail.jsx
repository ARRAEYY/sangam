import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Users, Mail, Github, Pencil, Trash2, Check, X as XIcon } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

const STATUS_STYLES = {
  OPEN: 'bg-emerald-50 text-emerald-700',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  COMPLETED: 'bg-slate-100 text-slate-500',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user, token } = useAuth()
  const [project, setProject] = useState(null)
  const [applicants, setApplicants] = useState(null)
  const [pitch, setPitch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [showApplyForm, setShowApplyForm] = useState(false)
  
  const navigate = useNavigate()
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [projectForm, setProjectForm] = useState(null)

  useEffect(() => {
    api.getProject(id).then(setProject).catch((err) => setError(err.message))
  }, [id])

  const isOwner = user && project && project.owner.id === user.id

  useEffect(() => {
    if (isOwner) {
      api.getApplicants(id, token).then(setApplicants).catch((err) => setError(err.message))
    }
  }, [isOwner, id, token])

  const handleApply = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.applyToProject(id, { pitch_message: pitch }, token)
      setStatus('Application sent!')
      setShowApplyForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const decide = async (appId, newStatus) => {
    try {
      await api.updateApplicationStatus(appId, newStatus, token)
      const refreshed = await api.getApplicants(id, token)
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
      const updated = await api.editProject(id, projectForm, token)
      setProject(updated)
      setIsEditingProject(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? It will be moved to your past projects.')) return
    try {
      await api.updateProjectStatus(id, 'ARCHIVED', token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !project) return <p className="py-10 text-red-600">{error}</p>
  if (!project) return <p className="py-10 text-slate-500">Loading…</p>

  return (
    <div className="max-w-3xl pb-16 pt-2">
      <div className="card p-6 sm:p-8">
        {!isEditingProject ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-slate-900">{project.title}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
                  Posted by {project.owner.full_name} · <Users size={13} className="inline" />{' '}
                  {project.team_size_needed} needed
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

        {user && !isOwner && !status && (
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
      </div>

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
                      onClick={() => decide(app.id, 'ACCEPTED')}
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
    </div>
  )
}
