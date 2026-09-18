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
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hiring Roles</h1>
            <p className="text-xs text-slate-500">Define roles and hiring requirements for your project.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus size={16} /> Create Role
          </button>
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Required Skills</th>
                <th className="py-3 px-4">Applicants</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {hiringRoles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.title}</td>
                  <td className="py-3.5 px-4 text-purple-600 font-semibold">{r.type}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {r.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{r.applicants}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FounderLayout>
  )
}
