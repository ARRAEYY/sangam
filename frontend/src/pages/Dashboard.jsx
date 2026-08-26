import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Github,
  Linkedin,
  Globe,
  Pencil,
  Check,
  X as XIcon,
  UserCheck,
  UserX,
  UserMinus,
  Code2,
  Plus,
  Briefcase,
  GraduationCap,
  Award,
  Trash2,
  Lock,
  AlertTriangle,
  Crown,
  FolderGit2,
} from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext.jsx'
import SkillTagInput from '../components/SkillTagInput.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import FormattedText from '../components/FormattedText.jsx'
import { VALID_COURSES } from '../utils/courses'
import { formatMonthYear } from '../utils/date'
import { WORK_TYPES, EMPLOYMENT_TYPES } from '../utils/experienceTypes'

const STATUS_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
}

export default function Dashboard() {
  const { user, refreshProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [myProjects, setMyProjects] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState(null)
  const [error, setError] = useState('')
  const [pendingRequests, setPendingRequests] = useState([])
  const [connections, setConnections] = useState([])

  // Work experience
  const [experiences, setExperiences] = useState([])
  const [showAddExperience, setShowAddExperience] = useState(false)
  const [experienceForm, setExperienceForm] = useState({
    organization: '',
    role: '',
    description: '',
    location: '',
    work_type: 'On-site',
    employment_type: 'Full-time',
    start_date: '',
    end_date: '',
  })

  // Education
  const [educations, setEducations] = useState([])
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    department: '',
    start_year: new Date().getFullYear() - 2,
    graduation_year: new Date().getFullYear() + 2,
  })

  // Achievements
  const [achievements, setAchievements] = useState([])
  const [showAddAchievement, setShowAddAchievement] = useState(false)
  const [achievementForm, setAchievementForm] = useState({
    type: 'HACKATHON',
    title: '',
    description: '',
    issuer: '',
    date_awarded: '',
    url: '',
  })

  // Project Roles (Team Experience)
  const [projectRoles, setProjectRoles] = useState([])

  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Account deletion
  const [deletingAccount, setDeletingAccount] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMsg('')
    setChangingPassword(true)
    try {
      const res = await api.changePassword(passwordForm.current_password, passwordForm.new_password)
      setPasswordMsg(res.message || 'Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '' })
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const loadConnections = () => {
    if (!user) return
    api.listConnectionRequests('received').then((all) =>
      setPendingRequests(all.filter((r) => r.status === 'PENDING'))
    ).catch((err) => setError(err.message))
    api.listConnections().then(setConnections).catch((err) => setError(err.message))
  }

  const loadPortfolio = () => {
    if (!user) return
    api
      .getUserPublicProfile(user.id)
      .then((data) => {
        setExperiences(data.experiences || [])
        setEducations(data.educations || [])
        setAchievements(data.achievements || [])
        setProjectRoles(data.project_roles || [])
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (!user) return
    api
      .listProjects({ mine: 'true' })
      .then((my) => setMyProjects(my))
      .catch((err) => setError(err.message))
    api
      .myApplications()
      .then(setMyApplications)
      .catch((err) => setError(err.message))
    loadPortfolio()
    loadConnections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const respondToRequest = async (id, status) => {
    try {
      await api.respondToConnectionRequest(id, status)
      loadConnections()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return
    try {
      await api.removeConnection(connectionId)
      loadConnections()
    } catch (err) {
      setError(err.message)
    }
  }

  const withdrawApplication = async (id) => {
    try {
      await api.updateApplicationStatus(id, 'WITHDRAWN')
      const refreshed = await api.myApplications()
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
      avatar_url: user.avatar_url || '',
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
        { ...profileDraft, graduation_year: Number(profileDraft.graduation_year) }
      )
      await refreshProfile()
      setEditingProfile(false)
    } catch (err) {
      setError(err.message)
    }
  }

  // Work experience handlers
  const handleAddExperience = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const added = await api.addExperience(experienceForm)
      setExperiences([added, ...experiences])
      setShowAddExperience(false)
      setExperienceForm({ organization: '', role: '', description: '', location: '', work_type: 'On-site', employment_type: 'Full-time', start_date: '', end_date: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteExperience = async (id) => {
    if (!window.confirm('Delete this experience?')) return
    try {
      await api.deleteExperience(id)
      setExperiences(experiences.filter((exp) => exp.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  // Education handlers
  const handleAddEducation = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const added = await api.addEducation(
        {
          ...educationForm,
          start_year: Number(educationForm.start_year),
          graduation_year: educationForm.graduation_year ? Number(educationForm.graduation_year) : null,
        }
      )
      setEducations([added, ...educations])
      setShowAddEducation(false)
      setEducationForm({
        institution: '',
        degree: '',
        department: '',
        start_year: new Date().getFullYear() - 2,
        graduation_year: new Date().getFullYear() + 2,
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteEducation = async (id) => {
    if (!window.confirm('Delete this education record?')) return
    try {
      await api.deleteEducation(id)
      setEducations(educations.filter((edu) => edu.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  // Achievement handlers
  const handleAddAchievement = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const added = await api.addAchievement(achievementForm)
      setAchievements([added, ...achievements])
      setShowAddAchievement(false)
      setAchievementForm({
        type: 'HACKATHON',
        title: '',
        description: '',
        issuer: '',
        date_awarded: '',
        url: '',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteAchievement = async (id) => {
    if (!window.confirm('Delete this achievement?')) return
    try {
      await api.deleteAchievement(id)
      setAchievements(achievements.filter((ach) => ach.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  // Account deletion
  const handleDeleteAccount = async () => {
    const confirmPrompt = window.prompt(
      'WARNING: This will permanently delete your account, projects, applications, connections, and portfolio data.\\n\\nType DELETE to confirm:'
    )
    if (confirmPrompt !== 'DELETE') return

    setDeletingAccount(true)
    try {
      await api.deleteAccount()
      await logout()
      navigate('/')
    } catch (err) {
      setError(err.message)
      setDeletingAccount(false)
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
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base sm:text-lg font-bold text-brand-600">
                    {initials}
                  </span>
                )}
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
              <Field label="Course / Branch">
                <select
                  required
                  className="input"
                  value={profileDraft.branch}
                  onChange={(e) => setProfileDraft({ ...profileDraft, branch: e.target.value })}
                >
                  <option value="" disabled>Select your course</option>
                  {VALID_COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Graduation year">
                <input
                  type="number"
                  min={new Date().getFullYear() - 5}
                  max={new Date().getFullYear() + 5}
                  className="input"
                  value={profileDraft.graduation_year}
                  onChange={(e) => setProfileDraft({ ...profileDraft, graduation_year: e.target.value })}
                />
              </Field>
              <Field label="Avatar image URL (optional)">
                <input
                  className="input"
                  placeholder="https://example.com/photo.jpg"
                  value={profileDraft.avatar_url}
                  onChange={(e) => setProfileDraft({ ...profileDraft, avatar_url: e.target.value })}
                />
              </Field>
            </div>
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

      {/* Profile Completion Bar */}
      {user.profile_completion && (
        <section className="mb-10">
          <div className="rounded-2xl bg-gradient-to-r from-brand-50/70 via-cream-50 to-emerald-50/50 p-4 border border-brand-100/80 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white shadow-sm">
                  {user.profile_completion.percentage}%
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Profile Completion</h3>
                </div>
              </div>
              <span className="text-xs font-semibold text-brand-700">
                {user.profile_completion.percentage === 100 ? 'All Set! 🎉' : `${user.profile_completion.percentage}% Complete`}
              </span>
            </div>
            
            <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${user.profile_completion.percentage}%` }}
              />
            </div>
            
            {user.profile_completion.percentage < 100 && (
              <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 truncate">
                  <span className="text-brand-600 font-semibold">Recommended:</span> {user.profile_completion.next_step}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="shrink-0 font-semibold text-brand-700 hover:text-brand-800 underline"
                >
                  Update →
                </button>
              </div>
            )}
          </div>
        </section>
      )}

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

      {/* Work Experience */}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Location">
                <input className="input bg-white" value={experienceForm.location} onChange={(e) => setExperienceForm({...experienceForm, location: e.target.value})} />
              </Field>
              <Field label="Work Type">
                <select className="input bg-white" value={experienceForm.work_type} onChange={(e) => setExperienceForm({...experienceForm, work_type: e.target.value})}>
                  {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Employment Type">
                <select className="input bg-white" value={experienceForm.employment_type} onChange={(e) => setExperienceForm({...experienceForm, employment_type: e.target.value})}>
                  {EMPLOYMENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Start Date (Month Year) *">
                <input required type="month" className="input bg-white" value={experienceForm.start_date.substring(0, 7)} onChange={(e) => setExperienceForm({...experienceForm, start_date: e.target.value + '-01'})} />
              </Field>
              <Field label="End Date (Month Year)">
                <input type="month" className="input bg-white" value={experienceForm.end_date ? experienceForm.end_date.substring(0, 7) : ''} onChange={(e) => setExperienceForm({...experienceForm, end_date: e.target.value ? e.target.value + '-01' : ''})} />
              </Field>
            </div>
            <Field label="Description & Responsibilities">
              <textarea rows={4} className="input bg-white" placeholder="- Led a team of 5&#10;- Increased revenue by 20%" value={experienceForm.description} onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})} />
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
                      <p className="text-sm text-slate-600">
                        {exp.organization}
                        {exp.employment_type && <span className="text-slate-400"> · {exp.employment_type}</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatMonthYear(exp.start_date)} - {exp.end_date ? formatMonthYear(exp.end_date) : 'Present'}
                        {exp.location && ` · ${exp.location}`}
                        {exp.work_type && ` (${exp.work_type})`}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteExperience(exp.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {exp.description && (
                    <div className="mt-3">
                      <FormattedText text={exp.description} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Education */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">Education</h2>
          <button onClick={() => setShowAddEducation(true)} className="btn-secondary !px-3.5 !py-1.5 text-xs">
            <Plus size={13} /> Add
          </button>
        </div>

        {showAddEducation && (
          <form onSubmit={handleAddEducation} className="card p-4 sm:p-5 mb-4 space-y-3 bg-slate-50 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Institution *">
                <input
                  required
                  placeholder="e.g. Rishihood University"
                  className="input bg-white"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })}
                />
              </Field>
              <Field label="Degree *">
                <input
                  required
                  placeholder="e.g. B.Tech in Computer Science"
                  className="input bg-white"
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Department (optional)">
                <input
                  placeholder="e.g. Newton School of Technology"
                  className="input bg-white"
                  value={educationForm.department}
                  onChange={(e) => setEducationForm({ ...educationForm, department: e.target.value })}
                />
              </Field>
              <Field label="Start Year *">
                <input
                  required
                  type="number"
                  className="input bg-white"
                  value={educationForm.start_year}
                  onChange={(e) => setEducationForm({ ...educationForm, start_year: e.target.value })}
                />
              </Field>
              <Field label="Graduation Year">
                <input
                  type="number"
                  className="input bg-white"
                  value={educationForm.graduation_year}
                  onChange={(e) => setEducationForm({ ...educationForm, graduation_year: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn-primary !px-5 text-sm">Save</button>
              <button type="button" onClick={() => setShowAddEducation(false)} className="btn-secondary !px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {educations.length === 0 && !showAddEducation ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            No education records added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="card p-4 flex gap-3">
                <div className="mt-1">
                  <GraduationCap className="text-slate-400" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{edu.degree}</h3>
                      <p className="text-sm text-slate-600">{edu.institution}{edu.department ? ` (${edu.department})` : ''}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {edu.start_year} - {edu.graduation_year || 'Present'}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteEducation(edu.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievements & Awards */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">Achievements & Certifications</h2>
          <button onClick={() => setShowAddAchievement(true)} className="btn-secondary !px-3.5 !py-1.5 text-xs">
            <Plus size={13} /> Add
          </button>
        </div>

        {showAddAchievement && (
          <form onSubmit={handleAddAchievement} className="card p-4 sm:p-5 mb-4 space-y-3 bg-slate-50 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Category *">
                <select
                  className="input bg-white"
                  value={achievementForm.type}
                  onChange={(e) => setAchievementForm({ ...achievementForm, type: e.target.value })}
                >
                  <option value="HACKATHON">Hackathon</option>
                  <option value="CERTIFICATION">Certification</option>
                  <option value="AWARD">Award / Honor</option>
                  <option value="COMPETITION">Competition</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Title *">
                <input
                  required
                  placeholder="e.g. Smart India Hackathon Winner"
                  className="input bg-white"
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Issuer / Organization">
                <input
                  placeholder="e.g. Ministry of Education"
                  className="input bg-white"
                  value={achievementForm.issuer}
                  onChange={(e) => setAchievementForm({ ...achievementForm, issuer: e.target.value })}
                />
              </Field>
              <Field label="Date Awarded">
                <input
                  type="date"
                  className="input bg-white"
                  value={achievementForm.date_awarded}
                  onChange={(e) => setAchievementForm({ ...achievementForm, date_awarded: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Credential URL / Link">
              <input
                placeholder="https://..."
                className="input bg-white"
                value={achievementForm.url}
                onChange={(e) => setAchievementForm({ ...achievementForm, url: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                className="input bg-white"
                value={achievementForm.description}
                onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button className="btn-primary !px-5 text-sm">Save</button>
              <button type="button" onClick={() => setShowAddAchievement(false)} className="btn-secondary !px-4 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {achievements.length === 0 && !showAddAchievement ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            No achievements added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {achievements.map((ach) => (
              <div key={ach.id} className="card p-4 flex gap-3">
                <div className="mt-1">
                  <Award className="text-brand-500" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{ach.title}</h3>
                        <span className="pill bg-brand-50 text-brand-700 text-[10px] py-0.5">{ach.type}</span>
                      </div>
                      {ach.issuer && <p className="text-sm text-slate-600">{ach.issuer}</p>}
                      {ach.date_awarded && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(ach.date_awarded).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDeleteAchievement(ach.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {ach.description && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{ach.description}</p>}
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
        )}
      </section>

      {/* Project Experience & Teams (LinkedIn-style history) */}
      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">Project experience & teams</h2>
        {projectRoles.length === 0 ? (
          <p className="card border-dashed px-5 py-6 text-sm text-slate-500">
            No project team memberships yet. Apply to projects or create your own to build your team history!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projectRoles.map((pr, idx) => (
              <div key={idx} className="card p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/projects/${pr.project_id}`} className="font-semibold text-slate-900 hover:text-brand-600 flex items-center gap-1.5">
                      {pr.project_title}
                      {pr.is_lead && <Crown size={13} className="text-amber-500" title="Project Lead" />}
                    </Link>
                    <span className="pill text-[10px] bg-slate-100 text-slate-600">
                      {pr.status === 'ACTIVE' ? pr.project_status : pr.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-brand-700 font-medium">
                    {pr.role}
                    {pr.role_category && pr.role_category !== 'OTHER' && (
                      <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-600">
                        {pr.role_category}
                      </span>
                    )}
                  </p>
                </div>
                {pr.since && (
                  <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    Member since {new Date(pr.since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Projects */}
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

      {/* Applications */}
      <section className="mb-10">
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

      {/* Connection Requests */}
      <section id="connections" className="mb-10">
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
                  <p className="font-semibold text-slate-900">
                    {req.requester ? req.requester.full_name : 'Deleted User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {req.requester ? `${req.requester.branch} · Class of ${req.requester.graduation_year}` : 'Account no longer exists'}
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

      {/* Your Connections */}
      <section className="mb-10">
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
              <div key={c.connection_id} className="card flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  {c.user?.avatar_url ? (
                    <img
                      src={c.user.avatar_url}
                      alt={c.user.full_name || 'Deleted User'}
                      className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                      {c.user && c.user.full_name
                        ? c.user.full_name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : '?'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {c.user ? c.user.full_name : 'Deleted User'}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {c.user ? `${c.user.branch} · Class of ${c.user.graduation_year}` : 'Account no longer exists'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveConnection(c.connection_id)}
                  title="Remove connection"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danger Zone: Account Deletion */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle size={18} />
          <h2 className="font-semibold text-sm uppercase tracking-wider">Danger Zone</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-red-700">
          Permanently delete your account and all associated data including your projects, applications, portfolio entries, and connections. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
        >
          {deletingAccount ? 'Deleting account...' : 'Delete Account'}
        </button>
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
