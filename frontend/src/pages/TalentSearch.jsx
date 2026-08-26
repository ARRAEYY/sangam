import React, { useEffect, useState } from 'react'
import { Search, Github, Linkedin, Globe, UserPlus, Check, X as XIcon, Briefcase, FolderGit2, GraduationCap, Award, Crown } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'

export default function TalentSearch() {
  const { user } = useAuth()
  const [talent, setTalent] = useState([])
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectState, setConnectState] = useState({}) // userId -> 'sent' | 'error message'
  
  const [connectingUserId, setConnectingUserId] = useState(null)
  const [connectionMessage, setConnectionMessage] = useState('')

  const [selectedUser, setSelectedUser] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  
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

  const handleConnectSubmit = async (e) => {
    e.preventDefault()
    if (!connectingUserId) return
    const personId = connectingUserId
    try {
      await api.sendConnectionRequest(personId, connectionMessage)
      setConnectState((prev) => ({ ...prev, [personId]: 'sent' }))
      setConnectingUserId(null)
      setConnectionMessage('')
    } catch (err) {
      setConnectState((prev) => ({ ...prev, [personId]: err.message }))
      setConnectingUserId(null)
      setConnectionMessage('')
    }
  }

  const openProfile = async (person) => {
    setSelectedUser(person)
    setProfileLoading(true)
    try {
      const fullProfile = await api.getUserPublicProfile(person.id)
      setSelectedUser(fullProfile)
    } catch (err) {
      console.error(err)
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="pb-16 pt-2">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">Find talent</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Students on campus ready to join your team.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Filter by skill, e.g. React"
              className="input !pl-10 text-xs sm:text-sm"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 !px-4 !py-2.5 text-xs sm:text-sm">
            Search
          </button>
        </form>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading students…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {talent.map((person) => (
          <div key={person.id} className="card flex flex-col p-5 hover:border-brand-300 transition-colors cursor-pointer" onClick={() => openProfile(person)}>
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
                <h3 className="truncate font-display font-semibold text-slate-900 group-hover:text-brand-600">{person.full_name}</h3>
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
            <div className="mt-auto pt-3">
              <div className="flex gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
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
                      onClick={(e) => { e.stopPropagation(); setConnectingUserId(person.id); }}
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
          </div>
        ))}
      </div>

      {!loading && talent.length === 0 && (
        <p className="card border-dashed py-14 text-center text-sm text-slate-500">
          No students found for that skill yet.
        </p>
      )}

      {/* Connection Message Modal */}
      {connectingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Send connection request</h3>
            <p className="mb-4 text-sm text-slate-500">Add a custom message so they know why you want to connect.</p>
            <form onSubmit={handleConnectSubmit}>
              <textarea
                className="input min-h-[100px] mb-4"
                placeholder="Hi, I wanted to work with you on..."
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setConnectingUserId(null); setConnectionMessage(''); }} className="btn-secondary !px-4">Cancel</button>
                <button type="submit" className="btn-primary !px-4">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedUser(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full z-10"
            >
              <XIcon size={20} />
            </button>
            <div className="overflow-y-auto p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">
                      {selectedUser.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-slate-900">{selectedUser.full_name}</h2>
                    <p className="text-sm text-slate-600">{selectedUser.branch} · Class of {selectedUser.graduation_year}</p>
                    {selectedUser.headline && <p className="text-sm text-slate-500 mt-1">{selectedUser.headline}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary shrink-0 w-full sm:w-auto !px-5"
                  onClick={() => alert('Connect functionality coming soon!')}
                >
                  Connect
                </button>
              </div>
              
              {selectedUser.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedUser.bio}</p>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.skills.map((s) => (
                    <span key={s.id} className="pill bg-slate-100 text-slate-600">{s.name}</span>
                  ))}
                  {selectedUser.skills.length === 0 && <span className="text-sm text-slate-500">No skills listed.</span>}
                </div>
              </div>

              {profileLoading ? (
                <p className="text-sm text-slate-500">Loading details...</p>
              ) : (
                <>
                  {/* Projects First */}
                  {selectedUser.project_roles && selectedUser.project_roles.length > 0 ? (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <FolderGit2 size={16} className="text-slate-400" /> Projects
                      </h3>
                      <div className="space-y-3">
                        {selectedUser.project_roles.map((pr, idx) => (
                          <div key={idx} className="card p-3.5 bg-slate-50/75 border border-slate-100 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                {pr.project_title}
                                {pr.is_lead && <Crown size={12} className="text-amber-500" title="Project Lead" />}
                              </h4>
                              <p className="text-xs text-brand-700 font-medium mt-0.5">
                                {pr.role}
                              </p>
                              {pr.since && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Member since {new Date(pr.since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <span className="pill text-[10px] bg-white border border-slate-200 text-slate-600 shrink-0">
                              {pr.status === 'ACTIVE' ? pr.project_status : pr.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedUser.accepted_projects && selectedUser.accepted_projects.length > 0 ? (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <FolderGit2 size={16} className="text-slate-400" /> Projects Working On
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {selectedUser.accepted_projects.map((proj) => (
                          <div key={proj.id} className="card p-3 bg-slate-50">
                            <h4 className="font-semibold text-slate-800 text-sm truncate">{proj.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Education Second */}
                  {selectedUser.educations && selectedUser.educations.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <GraduationCap size={16} className="text-slate-400" /> Education
                      </h3>
                      <div className="flex flex-col gap-4 divide-y divide-slate-100">
                        {selectedUser.educations.map((edu) => (
                          <div key={edu.id} className="pt-4 first:pt-0">
                            <div className="border-l-2 border-brand-200 pl-4">
                              <h4 className="font-semibold text-slate-800">{edu.degree}</h4>
                              <p className="text-sm text-slate-600">
                                {edu.institution}
                                {edu.department ? ` (${edu.department})` : ''}
                              </p>
                              <p className="text-xs text-slate-500">
                                {edu.start_year} - {edu.graduation_year || 'Present'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Third */}
                  {selectedUser.experiences && selectedUser.experiences.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Briefcase size={16} className="text-slate-400" /> Experience
                      </h3>
                      <div className="flex flex-col gap-4 divide-y divide-slate-100">
                        {selectedUser.experiences.map((exp) => (
                          <div key={exp.id} className="pt-4 first:pt-0">
                            <div className="border-l-2 border-brand-200 pl-4">
                              <h4 className="font-semibold text-slate-800">{exp.role}</h4>
                              <p className="text-sm text-brand-600">{exp.organization}</p>
                              <p className="text-xs text-slate-500 mb-1">
                                {new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} -{' '}
                                {exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                              </p>
                              {exp.description && <p className="text-sm text-slate-600 whitespace-pre-wrap">{exp.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements Last */}
                  {selectedUser.achievements && selectedUser.achievements.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Award size={16} className="text-slate-400" /> Achievements
                      </h3>
                      <div className="flex flex-col gap-4 divide-y divide-slate-100">
                        {selectedUser.achievements.map((ach) => (
                          <div key={ach.id} className="pt-4 first:pt-0">
                            <div className="border-l-2 border-brand-200 pl-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-800">{ach.title}</h4>
                                <span className="pill bg-brand-50 text-brand-700 text-[10px] py-0.5">{ach.type}</span>
                              </div>
                              {ach.issuer && <p className="text-sm text-slate-600">{ach.issuer}</p>}
                              {ach.description && <p className="text-sm text-slate-600 mt-1">{ach.description}</p>}
                              {ach.url && (
                                <a
                                  href={ach.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                                >
                                  View Credential →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
