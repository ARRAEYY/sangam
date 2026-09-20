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

        if (apps) {
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
      await api.applicantAction(id, appId, action)
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
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-[13px] font-semibold shadow-sm animate-in fade-in duration-150 mb-6">
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
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Recruiting Pipeline</h1>
            <p className="text-[15px] text-slate-500 mt-1">
              Review applicant portfolios, matched skills, and onboard talent into your team.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 font-bold uppercase tracking-widest text-[10px]">
              {pendingCount} Pending Review
            </span>
          </div>
        </section>

        {/* Filter Tabs */}
        <div className="dashboard-section reveal-in delay-1 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'PENDING', label: 'Needs Review', count: pendingCount, color: 'text-amber-800 bg-amber-50' },
              { id: 'SHORTLISTED', label: 'Shortlisted', count: shortlistedCount, color: 'text-brand-800 bg-brand-50' },
              { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount, color: 'text-emerald-800 bg-emerald-50' },
              { id: 'REJECTED', label: 'Archived', count: rejectedCount, color: 'text-slate-700 bg-slate-100' },
              { id: 'ALL', label: 'All Candidates', count: applications.length, color: 'text-slate-700 bg-slate-100' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white border border-slate-200 shadow-sm font-bold text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span className="text-[13px]">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applicants Grid / Cards */}
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-[18px] border border-slate-100 p-16 text-center flex flex-col items-center reveal-in delay-2">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
              <Inbox size={22} />
            </div>
            <h3 className="font-display text-sm font-bold text-slate-800 mb-1">No applications found</h3>
            <p className="text-[13px] text-slate-500 max-w-sm">
              There are no candidates in this stage right now. Share your project to attract more collaborators!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal-in delay-2">
            {filteredApps.map((app) => {
              const status = (app.status || '').toUpperCase()
              return (
                <div
                  key={app.id}
                  className="bg-white p-6 rounded-[18px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar, Name, Role, Date */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={app.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Candidate'}
                          alt={app.name}
                          className="w-12 h-12 rounded-full bg-slate-50 object-cover shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-900">{app.name}</h3>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-600">
                            {app.role}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {app.applied_on}
                      </span>
                    </div>

                    {/* Candidate Pitch */}
                    {app.pitch && (
                      <p className="text-[13px] text-slate-600 bg-[#faf9f5] p-4 rounded-[12px] border border-slate-100 mb-4">
                        "{app.pitch}"
                      </p>
                    )}

                    {/* Skills Tag Strip */}
                    {app.skills && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {app.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[11px] font-medium text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100/60 flex items-center justify-between gap-2">
                    {/* Status Pill */}
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                      status === 'ACCEPTED' || status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      status === 'SHORTLISTED' ? 'bg-brand-50 text-brand-700' :
                      status === 'REJECTED' ? 'bg-slate-50 text-slate-600' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {status === 'ACCEPTED' ? 'Accepted' : status === 'SHORTLISTED' ? 'Shortlisted' : status === 'REJECTED' ? 'Declined' : 'Pending Review'}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, 'REJECT')}
                            className="button button-secondary text-[11px] py-1.5 px-3"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'SHORTLIST')}
                            className="button button-secondary text-[11px] py-1.5 px-3"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'ACCEPT')}
                            className="button button-primary text-[11px] py-1.5 px-3"
                          >
                            <UserPlus size={14} className="mr-1" />
                            Accept
                          </button>
                        </>
                      )}

                      {status === 'SHORTLISTED' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, 'REJECT')}
                            className="button button-secondary text-[11px] py-1.5 px-3"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAction(app.id, 'ACCEPT')}
                            className="button button-primary text-[11px] py-1.5 px-3"
                          >
                            <UserPlus size={14} className="mr-1" />
                            Accept & Welcome
                          </button>
                        </>
                      )}

                      {(status === 'ACCEPTED' || status === 'REJECTED') && (
                        <button
                          onClick={() => handleAction(app.id, 'SHORTLIST')}
                          className="button button-secondary text-[11px] py-1.5 px-3"
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
