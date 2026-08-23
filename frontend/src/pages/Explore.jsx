import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { api } from '../api'
import ProjectCard from '../components/ProjectCard.jsx'

export default function Explore() {
  const [projects, setProjects] = useState([])
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (skillFilter) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listProjects({ skill: skillFilter })
      setProjects(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    load(skill)
  }

  return (
    <div className="pb-16 pt-2">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">Open projects</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Teams on campus looking for their next builder.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Filter by skill, e.g. React"
              className="input pl-10 text-xs sm:text-sm"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 !px-4 !py-2.5 text-xs sm:text-sm">
            Search
          </button>
        </form>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading projects…</p>}

      {!loading && projects.length === 0 && (
        <p className="card border-dashed py-14 text-center text-sm text-slate-500">
          No projects found. Be the first to post one!
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
