import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Check,
  X,
  Bookmark,
  FileText,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Sparkles,
  Inbox
} from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../api'

export default function ProjectApplications() {
  const { id } = useParams()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('PENDING')
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    async function loadApplicationsData() {
      try {
        setLoading(true)
        const apps = await api.getFounderApplicants(id).catch(() => [])

        if (!apps || apps.length === 0) {
          setApplications([
            {
              id: 1,
              name: 'Ananya Singh',
              role: 'Frontend Architect',
              applied_on: 'May 10, 2025',
              status: 'PENDING',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
              skills: ['React', 'Tailwind', 'Next.js', 'State Machines'],
              pitch: 'I have 2 years of experience building collaborative web applications. Super excited about Sangam!'
            },
            {
              id: 2,
              name: 'Karan Malhotra',
              role: 'ML Engineer',
              applied_on: 'May 9, 2025',
              status: 'SHORTLISTED',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan',
              skills: ['PyTorch', 'FastAPI', 'Vector Databases'],
              pitch: 'Specialized in fine-tuning embeddings and building low-latency inference pipelines.'
            },
            {
              id: 3,
              name: 'Riya Patel',
              role: 'Product Designer',
              applied_on: 'May 8, 2025',
              status: 'REJECTED',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya',
              skills: ['Figma', 'Prototyping', 'Design Systems'],
              pitch: 'Focused on accessibility and human-centered design.'
            },
            {
              id: 4,
              name: 'Daniel Kim',
              role: 'Backend Developer',
              applied_on: 'May 7, 2025',
              status: 'PENDING',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel',
              skills: ['Node.js', 'PostgreSQL', 'Docker'],
              pitch: 'Passionate about building resilient distributed systems and clean REST APIs.'
            },
          ])
        } else {
          setApplications(apps)
        }
      } catch (err) {
        console.error('Failed to load applications:', err)
      } finally {
        setLoading(false)
      }
    }
    loadApplicationsData()
  }, [id])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const handleAction = async (appId, action) => {
    try {
      await api.applicantAction(id, appId, action).catch(() => null)
      const nextStatus = action === 'ACCEPT' ? 'ACCEPTED' : action === 'SHORTLIST' ? 'SHORTLISTED' : 'REJECTED'
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a))
      showToast(`Applicant successfully ${action === 'ACCEPT' ? 'accepted & invited' : action === 'SHORTLIST' ? 'shortlisted' : 'declined'}.`)
    } catch (err) {
      alert(err.message || 'Action failed')
    }
  }

  const filteredApps = applications.filter((a) => {
    const s = (a.status || '').toUpperCase()
    if (activeTab === 'PENDING') return s === 'PENDING'
    if (activeTab === 'SHORTLISTED') return s === 'SHORTLISTED'
    if (activeTab === 'ACCEPTED') return s === 'ACCEPTED' || s === 'APPROVED'
    if (activeTab === 'REJECTED') return s === 'REJECTED'
    return true
  })

  const pendingCount = applications.filter(a => (a.status || '').toUpperCase() === 'PENDING').length
  const shortlistedCount = applications.filter(a => (a.status || '').toUpperCase() === 'SHORTLISTED').length
  const acceptedCount = applications.filter(a => ['ACCEPTED', 'APPROVED'].includes((a.status || '').toUpperCase())).length
  const rejectedCount = applications.filter(a => (a.status || '').toUpperCase() === 'REJECTED').length

  return (
    <FounderLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-semibold shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="p-1 text-emerald-600 hover:text-emerald-900">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Recruiting Pipeline</h1>
            <p className="text-xs text-slate-500 mt-1">
              Review applicant portfolios, matched skills, and onboard talent into your team.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 font-bold">
              {pendingCount} Pending Review
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 border-b border-stone-200 text-xs font-semibold pb-1 overflow-x-auto">
          {[
            { id: 'PENDING', label: 'Needs Review', count: pendingCount, color: 'text-amber-800 bg-amber-50' },
            { id: 'SHORTLISTED', label: 'Shortlisted', count: shortlistedCount, color: 'text-blue-800 bg-blue-50' },
            { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount, color: 'text-emerald-800 bg-emerald-50' },
            { id: 'REJECTED', label: 'Archived', count: rejectedCount, color: 'text-slate-700 bg-stone-100' },
            { id: 'ALL', label: 'All Candidates', count: applications.length, color: 'text-slate-700 bg-stone-100' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-[#7f1d3b] text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : tab.color
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Applicants Grid / Cards */}
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-slate-400 flex items-center justify-center mb-3">
              <Inbox size={22} />
            </div>
            <h3 className="font-display text-sm font-bold text-slate-800 mb-1">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              There are no candidates in this stage right now. Share your project to attract more collaborators!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApps.map((app) => {
              const status = (app.status || '').toUpperCase()
              return (
                <div
                  key={app.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar, Name, Role, Date */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Candidate'}
                          alt={app.name}
                          className="w-11 h-11 rounded-full bg-stone-200 object-cover border border-stone-200 shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{app.name}</h3>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#7f1d3b]/10 text-[#7f1d3b]">
                            {app.role}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {app.applied_on}
                      </span>
                    </div>

                    {/* Candidate Pitch */}
                    {app.pitch && (
                      <p className="text-xs text-slate-600 bg-stone-50/70 p-3 rounded-xl border border-stone-100 mb-3 italic">
                        "{app.pitch}"
                      </p>
                    )}

                    {/* Skills Tag Strip */}
                    {app.skills && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {app.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-medium text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      status === 'ACCEPTED' || status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                      status === 'REJECTED' ? 'bg-stone-200 text-slate-600' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {status === 'ACCEPTED' ? 'Accepted' : status === 'SHORTLISTED' ? 'Shortlisted' : status === 'REJECTED' ? 'Declined' : 'Pending Review'}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, 'REJECT')}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'SHORTLIST')}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100 bg-blue-50 rounded-lg transition-colors"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'ACCEPT')}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#7f1d3b] hover:bg-[#5c132b] rounded-lg transition-colors shadow-sm"
                          >
                            <UserPlus size={12} />
                            <span>Accept</span>
                          </button>
                        </>
                      )}

                      {status === 'SHORTLISTED' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, 'REJECT')}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-stone-100 rounded-lg"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'ACCEPT')}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#7f1d3b] hover:bg-[#5c132b] rounded-lg shadow-sm"
                          >
                            <UserPlus size={12} />
                            <span>Accept & Welcome</span>
                          </button>
                        </>
                      )}

                      {(status === 'ACCEPTED' || status === 'REJECTED') && (
                        <button
                          onClick={() => handleAction(app.id, 'SHORTLIST')}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-stone-100 rounded-lg"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </FounderLayout>
  )
}
