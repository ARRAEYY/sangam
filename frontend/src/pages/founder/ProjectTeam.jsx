import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, User, ShieldCheck, Mail } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'
import { TalentModal } from '../../components/TalentModal'
import { api } from '../../api'

export default function ProjectTeam() {
  const { id } = useParams()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState(null)

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true)
        const memberList = await api.getMembers(id)
        if (memberList) {
          setMembers(memberList)
        }
      } catch (err) {
        console.error('Failed to load team data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTeamData()
  }, [id])

  return (
    <FounderLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Project Roster</h1>
            <p className="text-[15px] text-slate-500 mt-1">Manage team members and roles.</p>
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

        <div className="dashboard-section reveal-in mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            <button className="pb-4 px-2 transition-all relative font-semibold text-[13px] text-brand-700">
              Active Team ({members.length})
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full"></div>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse reveal-in delay-2">Loading team roster...</div>
        ) : (
          <div className="mt-2 reveal-in delay-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => setSelectedUserId(member.user_id)}
                  className="bg-white border border-slate-100 rounded-[18px] p-6 hover:shadow-md hover:border-slate-200 transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={member.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user?.full_name || 'User'}`}
                        alt={member.user?.full_name || 'Member'}
                        className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 shrink-0 object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-[15px] text-slate-900 flex items-center gap-1.5">
                          {member.user?.full_name || 'Unknown User'}
                          {member.is_lead && <ShieldCheck size={14} className="text-brand-600" />}
                        </h3>
                        <p className="text-[12px] font-bold tracking-widest uppercase text-slate-500 mt-1">{member.role}</p>
                      </div>
                    </div>
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
          </div>
        )}
      </div>

      <TalentModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        talentId={selectedUserId} 
      />
    </FounderLayout>
  )
}
