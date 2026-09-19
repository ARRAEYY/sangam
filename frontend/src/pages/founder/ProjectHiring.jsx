import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Briefcase, MoreHorizontal, Users, CheckCircle } from 'lucide-react'
import FounderLayout from '../../components/founder/FounderLayout'

export default function ProjectHiring() {
  const { id } = useParams()
  const [hiringRoles, setHiringRoles] = useState([
    { id: 1, title: 'Frontend Developer', type: 'Volunteer', skills: ['React', 'Tailwind', 'JS'], applicants: 12, status: 'Open' },
    { id: 2, title: 'ML Engineer', type: 'Volunteer', skills: ['Python', 'ML', 'NLP'], applicants: 8, status: 'Open' },
    { id: 3, title: 'Content Writer', type: 'Volunteer', skills: ['Writing', 'Research'], applicants: 5, status: 'Closed' },
    { id: 4, title: 'UI/UX Designer', type: 'Volunteer', skills: ['Figma', 'UI/UX'], applicants: 10, status: 'Open' },
  ])

  return (
    <FounderLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">
        {/* Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Hiring Roles</h1>
            <p className="text-[15px] text-slate-500 mt-1">Define roles and hiring requirements for your project.</p>
          </div>
          <button className="button button-primary">
            Create Role <Plus size={14} />
          </button>
        </section>

        {/* Roles Table */}
        <div className="dashboard-section reveal-in delay-1">
          <div className="bg-white rounded-[18px] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="py-4 px-6">Role Title</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Required Skills</th>
                  <th className="py-4 px-6">Applicants</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                {hiringRoles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6 font-semibold text-slate-900">{r.title}</td>
                    <td className="py-4 px-6 text-brand-700 font-semibold">{r.type}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {r.skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200/60 text-slate-600 font-medium rounded-sm text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{r.applicants}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                        r.status === 'Open' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FounderLayout>
  )
}
