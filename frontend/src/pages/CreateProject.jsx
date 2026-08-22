import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import SkillTagInput from '../components/SkillTagInput.jsx'

export default function CreateProject() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    team_size_needed: 1,
    skills: [],
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const project = await api.createProject(
        { ...form, team_size_needed: Number(form.team_size_needed) },
        token
      )
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl pb-16 pt-2">
      <h1 className="font-display text-2xl font-semibold text-slate-900">Post a project</h1>
      <p className="mt-0.5 text-sm text-slate-500">Tell other students what you're building and who you need.</p>

      {error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Building a campus food-delivery app"
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What are you building? What will this teammate own?"
            className="input min-h-[140px]"
          />
        </label>

        <label className="block max-w-[160px]">
          <span className="mb-1 block text-sm font-medium text-slate-700">Team size needed</span>
          <input
            type="number"
            min={1}
            required
            value={form.team_size_needed}
            onChange={(e) => setForm({ ...form, team_size_needed: e.target.value })}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Required skills</span>
          <SkillTagInput
            value={form.skills}
            onChange={(skills) => setForm({ ...form, skills })}
            placeholder="e.g. React, Figma, Postgres"
          />
        </label>

        <button disabled={submitting} className="btn-primary">
          {submitting ? 'Posting…' : 'Post project'}
        </button>
      </form>
    </div>
  )
}
