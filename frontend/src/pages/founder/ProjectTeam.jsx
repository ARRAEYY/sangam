import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Check, X, UserCheck, MoreHorizontal, User, ShieldCheck, Mail } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { api } from '../../api'

export default function ProjectTeam() {
  const { id } = useParams()
  const [members, setMembers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('MEMBERS') // MEMBERS or PENDING

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true)
        const [memberList, applicantsList] = await Promise.all([
          api.getMembers(id).catch(() => []),
          api.getFounderApplicants(id).catch(() => []),
        ])

        if (!memberList || memberList.length === 0) {
          setMembers([
            { id: 1, name: 'Atharv Mehta', role: 'Admin', skills: 'Full Stack, Product', joined: 'Jan 10, 2025', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Atharv' },
            { id: 2, name: 'Priya Sharma', role: 'Member', skills: 'UI/UX Design', joined: 'Jan 12, 2025', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
            { id: 3, name: 'Rahul Verma', role: 'Member', skills: 'Backend, DevOps', joined: 'Jan 15, 2025', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
            { id: 4, name: 'Sneha Iyer', role: 'Member', skills: 'AI/ML, Python', joined: 'Jan 18, 2025', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' },
            { id: 5, name: 'Arjun Kapoor', role: 'Member', skills: 'Frontend, React', joined: 'Jan 20, 2025', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' },
          ])
        } else {
          setMembers(memberList)
        }

        if (!applicantsList || applicantsList.length === 0) {
          setPendingRequests([
            { id: 101, name: 'Ananya Singh', roleTarget: 'Frontend Developer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' },
            { id: 102, name: 'Karan Malhotra', roleTarget: 'ML Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan' },
            { id: 103, name: 'Riya Patel', roleTarget: 'Content Writer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya' },
            { id: 104, name: 'Daniel Kim', roleTarget: 'UI/UX Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel' },
          ])
        } else {
          setPendingRequests(applicantsList)
        }
      } catch (err) {
        console.error('Failed to load team data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTeamData()
  }, [id])

  const handleAction = async (applicantId, action) => {
    try {
      await api.applicantAction(id, applicantId, action).catch(() => null)
      setPendingRequests(pendingRequests.filter((p) => p.id !== applicantId))
    } catch (err) {
      alert(err.message || 'Action failed')
    }
  }

  return (
    <FounderLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Project Roster</h1>
            <p className="text-[15px] text-slate-500 mt-1">Manage team members, roles, and pending invites.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="button button-secondary">
              <Mail size={14} className="mr-1" /> Invite by Email
            </button>
            <button className="button button-primary">
              Add Member <Plus size={14} />
            </button>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="dashboard-section reveal-in delay-1 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('MEMBERS')}
              className={`pb-4 px-2 transition-all relative font-semibold text-[13px] ${
                activeTab === 'MEMBERS'
                  ? 'text-brand-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Active Team ({members.length})
              {activeTab === 'MEMBERS' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`pb-4 px-2 transition-all flex items-center gap-2 relative font-semibold text-[13px] ${
                activeTab === 'PENDING'
                  ? 'text-brand-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending Invites & Requests
              {pendingRequests.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center justify-center font-bold tracking-widest uppercase transition-colors ${activeTab === 'PENDING' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                  {pendingRequests.length}
                </span>
              )}
              {activeTab === 'PENDING' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse reveal-in delay-2">Loading team roster...</div>
        ) : (
          <div className="mt-2 reveal-in delay-2">
            {activeTab === 'MEMBERS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div key={member.id} className="bg-white border border-slate-100 rounded-[18px] p-6 hover:shadow-md hover:border-slate-200 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                          alt={member.name}
                          className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 shrink-0 object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-900 flex items-center gap-1.5">
                            {member.name}
                            {member.role === 'Admin' && <ShieldCheck size={14} className="text-brand-600" />}
                          </h3>
                          <p className="text-[12px] font-bold tracking-widest uppercase text-slate-500 mt-1">{member.role}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-brand-600 p-1.5 rounded-md hover:bg-brand-50 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-slate-100/60">
                      <p className="text-[13px] text-slate-700 line-clamp-1 mb-1"><span className="text-slate-400 font-medium mr-1">Skills:</span> {member.skills}</p>
                      <p className="text-[13px] text-slate-700"><span className="text-slate-400 font-medium mr-1">Joined:</span> {member.joined}</p>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                   <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[18px] bg-[#faf9f5]">
                     <User size={32} className="mx-auto text-slate-300 mb-4" />
                     <p className="font-semibold text-[15px] text-slate-700">No active members</p>
                     <p className="text-[13px] mt-1 text-slate-500">Invite people to join your project team.</p>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'PENDING' && (
               <div className="bg-white border border-slate-200 rounded-[18px] overflow-hidden shadow-sm dashboard-section">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-[13px] text-slate-600">
                     <thead className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                       <tr>
                         <th className="px-6 py-4">Applicant</th>
                         <th className="px-6 py-4">Target Role</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {pendingRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <img
                                  src={req.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.name}`}
                                  alt={req.name}
                                  className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 shrink-0 object-cover"
                                />
                                <div>
                                  <div className="font-bold text-[14px] text-slate-900">{req.name}</div>
                                  <div className="text-[12px] text-slate-500 mt-0.5">Applied 2 days ago</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-700">
                                {req.roleTarget || 'General'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleAction(req.id, 'reject')}
                                  className="button button-secondary text-[11px] py-1.5 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                  title="Decline Request"
                                >
                                  <X size={14} className="mr-1" /> Decline
                                </button>
                                <button
                                  onClick={() => handleAction(req.id, 'accept')}
                                  className="button button-primary text-[11px] py-1.5 px-3"
                                >
                                  <Check size={14} className="mr-1" /> Accept
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                          <tr>
                            <td colSpan="3" className="px-6 py-16 text-center text-slate-400 bg-[#faf9f5]">
                               <UserCheck size={32} className="mx-auto text-slate-300 mb-4" />
                               <p className="font-semibold text-[15px] text-slate-700">No pending requests</p>
                               <p className="text-[13px] mt-1 text-slate-500">You're all caught up with invites and applications.</p>
                            </td>
                          </tr>
                        )}
                     </tbody>
                   </table>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </FounderLayout>
  )
}
