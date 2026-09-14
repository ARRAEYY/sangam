import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api'

export default function ProjectSettings() {
  const { id } = useParams()
  const [project, setProject] = useState({
    name: '',
    description: '',
    problem_statement: '',
    status: '',
    visibility: 'public'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  async function fetchProject() {
    setLoading(true)
    try {
      const data = await api.getProject(id)
      setProject({
        name: data.name || '',
        description: data.description || '',
        problem_statement: data.problem_statement || '',
        status: data.status || '',
        visibility: data.visibility || 'public'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)
    try {
      await api.editProject(id, project)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-center text-indigo-900">Loading project settings...</div>
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-900">Project Configuration</h1>
        <p className="text-indigo-700">Manage high-level metadata and visibility for your project.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-indigo-50 border-l-4 border-yellow-400 rounded-r-lg p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-indigo-900 border-b border-indigo-200 pb-2 mb-4">General Information</h2>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">Project Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                className="w-full p-2 rounded border border-indigo-200 bg-white text-indigo-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">Description</label>
              <textarea
                rows={3}
                value={project.description}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                className="w-full p-2 rounded border border-indigo-200 bg-white text-indigo-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                placeholder="Brief overview of the project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">Problem Statement</label>
              <textarea
                rows={4}
                value={project.problem_statement}
                onChange={(e) => setProject({ ...project, problem_statement: e.target.value })}
                className="w-full p-2 rounded border border-indigo-200 bg-white text-indigo-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                placeholder="Detailed problem the project is solving"
              />
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border-l-4 border-yellow-400 rounded-r-lg p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-semibold text-indigo-900 border-b border-indigo-200 pb-2 mb-4">Status & Visibility</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">Project Status</label>
              <select
                value={project.status}
                onChange={(e) => setProject({ ...project, status: e.target.value })}
                className="w-full p-2 rounded border border-indigo-200 bg-white text-indigo-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              >
                <option value="ideation">Ideation</option>
                <option value="recruiting">Recruiting</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">Visibility</label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={project.visibility === 'public'}
                    onChange={(e) => setProject({ ...project, visibility: e.target.value })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-indigo-900 group-hover:text-indigo-700">Public</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={project.visibility === 'private'}
                    onChange={(e) => setProject({ ...project, visibility: e.target.value })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-indigo-900 group-hover:text-indigo-700">Private</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          {success && <span className="text-green-600 font-medium">Settings saved successfully!</span>}
          {error && <span className="text-red-600 font-medium">Error: {error}</span>}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-900 text-white font-bold rounded hover:bg-indigo-800 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
