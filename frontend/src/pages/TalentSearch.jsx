import React, { useEffect, useState } from 'react'
import { Search, Github, Linkedin, Globe, UserPlus, Check } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

export default function TalentSearch() {
  const { user, token } = useAuth()
  const [talent, setTalent] = useState([])
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectState, setConnectState] = useState({}) // userId -> 'sent' | 'error message'

  const load = async (skillFilter) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.searchTalent({ skill: skillFilter })
      setTalent(data)
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

  const connect = async (personId) => {
    if (!token) return
    try {
      await api.sendConnectionRequest(personId, null, token)
      setConnectState((prev) => ({ ...prev, [personId]: 'sent' }))
    } catch (err) {
      setConnectState((prev) => ({ ...prev, [personId]: err.message }))
    }
  }

  return (
    <div className="pb-16 pt-2">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Find talent</h1>
          <p className="mt-0.5 text-sm text-slate-500">Students on campus ready to join your team.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Filter by skill, e.g. Figma"
              className="input pl-10"
            />
          </div>
          <button className="btn-primary">Search</button>
        </form>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading students…</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {talent.map((person) => (
          <div key={person.id} className="card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                {person.full_name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-display font-semibold text-slate-900">{person.full_name}</h3>
                <p className="truncate text-xs text-slate-500">
                  {person.branch} · Class of {person.graduation_year}
                </p>
              </div>
            </div>
            {person.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{person.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {person.skills.slice(0, 6).map((s) => (
                <span key={s.id} className="pill bg-slate-100 text-slate-600">
                  {s.name}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {person.github_url && (
                <a href={person.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Github size={13} />
                </a>
              )}
              {person.linkedin_url && (
                <a href={person.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Linkedin size={13} />
                </a>
              )}
              {person.portfolio_url && (
                <a href={person.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600">
                  <Globe size={13} />
                </a>
              )}
            </div>

            {user && user.id !== person.id && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {connectState[person.id] === 'sent' ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <Check size={13} /> Request sent
                  </span>
                ) : (
                  <button
                    onClick={() => connect(person.id)}
                    className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    <UserPlus size={13} /> Connect
                  </button>
                )}
                {connectState[person.id] && connectState[person.id] !== 'sent' && (
                  <p className="mt-1.5 text-xs text-slate-400">{connectState[person.id]}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && talent.length === 0 && (
        <p className="card border-dashed py-14 text-center text-slate-500">
          No students found for that skill yet.
        </p>
      )}
    </div>
  )
}
