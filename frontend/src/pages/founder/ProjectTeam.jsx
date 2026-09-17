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
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Roster</h1>
            <p className="text-sm text-slate-500 mt-1">Manage team members, roles, and pending invites.</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <Mail size={16} /> Invite by Email
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-600 text-white font-semibold text-sm rounded-xl hover:bg-maroon-700 transition-colors shadow-sm">
              <Plus size={16} /> Add Member
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`pb-4 transition-colors relative ${
              activeTab === 'MEMBERS'
                ? 'text-maroon-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Team ({members.length})
            {activeTab === 'MEMBERS' && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-4 transition-colors flex items-center gap-2 relative ${
              activeTab === 'PENDING'
                ? 'text-maroon-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending Invites & Requests
             {pendingRequests.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center justify-center font-extrabold transition-colors ${activeTab === 'PENDING' ? 'bg-maroon-100 text-maroon-700' : 'bg-slate-100 text-slate-600'}`}>
                {pendingRequests.length}
              </span>
            )}
            {activeTab === 'PENDING' && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-600 rounded-t-full"></div>
            )}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse">Loading team roster...</div>
        ) : (
          <div className="mt-6">
            {activeTab === 'MEMBERS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                          alt={member.name}
                          className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                            {member.name}
                            {member.role === 'Admin' && <ShieldCheck size={14} className="text-maroon-600" />}
                          </h3>
                          <p className="text-xs font-medium text-slate-500">{member.role}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-600 line-clamp-1"><span className="text-slate-400 font-medium">Skills:</span> {member.skills}</p>
                      <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-medium">Joined:</span> {member.joined}</p>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                   <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                     <User size={32} className="mx-auto text-slate-300 mb-3" />
                     <p className="font-medium text-slate-700">No active members</p>
                     <p className="text-sm mt-1">Invite people to join your project team.</p>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'PENDING' && (
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-600">
                     <thead className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                              <div className="flex items-center gap-3">
                                <img
                                  src={req.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.name}`}
                                  alt={req.name}
                                  className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{req.name}</div>
                                  <div className="text-xs text-slate-500">Applied 2 days ago</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {req.roleTarget || 'General'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleAction(req.id, 'reject')}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-trigger"
                                  title="Decline Request"
                                >
                                  <X size={18} />
                                </button>
                                <button
                                  onClick={() => handleAction(req.id, 'accept')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-maroon-50 text-maroon-700 hover:bg-maroon-100 hover:text-maroon-800 font-semibold text-xs rounded-lg transition-colors"
                                >
                                  <Check size={14} /> Accept
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                          <tr>
                            <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                               <UserCheck size={32} className="mx-auto text-slate-300 mb-3" />
                               <p className="font-medium text-slate-700">No pending requests</p>
                               <p className="text-sm mt-1">You're all caught up with invites and applications.</p>
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
