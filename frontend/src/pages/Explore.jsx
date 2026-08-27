import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api } from '../api'
import ProjectCard from '../components/ProjectCard.jsx'
import { SkeletonProjectCard } from '../components/Skeletons.jsx'

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
      {/* Page header: stacks on mobile, side-by-side on sm+ */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">Open projects</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Teams on campus looking for their next builder.</p>
        </div>
        <Link to="/create" className="btn-secondary w-fit text-xs px-3.5 py-2 self-start sm:self-auto sm:shrink-0">
          + Post a project
        </Link>
      </div>

      {/* Search bar — stacks on mobile, inline on sm+ */}
      <form onSubmit={handleSearch} className="mb-5 flex w-full flex-col gap-2 sm:max-w-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Filter by skill, e.g. React"
            className="input !pl-10 text-sm"
          />
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto shrink-0 !px-4 !py-2.5 text-sm">
          Search
        </button>
      </form>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {!loading && projects.length === 0 && (
        <p className="card border-dashed py-14 text-center text-sm text-slate-500">
          No projects found. Be the first to post one!
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonProjectCard key={i} />)
          : projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
      </div>
    </div>
  )

}
