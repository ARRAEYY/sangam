import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { Plus, MoreHorizontal, Pencil, Trash2, X, Check, AlertTriangle, ChevronDown, Minus, Users } from 'lucide-react'
import WorkspaceLayout from '../../components/founder/WorkspaceLayout'

const ROLE_TYPES = ['Volunteer', 'Part-time', 'Full-time', 'Internship']
const STATUS_OPTIONS = ['Open', 'Closed']

const INITIAL_ROLES = [
  { id: 1, title: 'Frontend Developer', type: 'Volunteer', skills: ['React', 'Tailwind', 'JS'],    applicants: 12, openings: 2, status: 'Open'   },
  { id: 2, title: 'ML Engineer',        type: 'Volunteer', skills: ['Python', 'ML', 'NLP'],         applicants: 8,  openings: 1, status: 'Open'   },
  { id: 3, title: 'Content Writer',     type: 'Volunteer', skills: ['Writing', 'Research'],          applicants: 5,  openings: 2, status: 'Closed' },
  { id: 4, title: 'UI/UX Designer',     type: 'Volunteer', skills: ['Figma', 'UI/UX'],              applicants: 10, openings: 1, status: 'Open'   },
]

function parseSkills(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean)
}
function serializeSkills(arr) {
  return (arr || []).join(', ')
}

// ─── Number Stepper ───────────────────────────────────────────
function Stepper({ id, value, onChange, min = 0, max = 999 }) {
  return (
    <div className="flex items-center gap-0 border border-slate-200 rounded-lg overflow-hidden w-fit">
      <button
        type="button"
        id={`${id}-dec`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex items-center justify-center w-9 h-10 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-slate-200"
      >
        <Minus size={13} />
      </button>
      <span className="w-12 text-center text-[14px] font-bold text-slate-800 select-none">
        {value}
      </span>
      <button
        type="button"
        id={`${id}-inc`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex items-center justify-center w-9 h-10 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-slate-200"
      >
        <Plus size={13} />
      </button>
    </div>
  )
}

// ─── Dropdown Action Menu ─────────────────────────────────────
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        id="role-action-menu-btn"
        onClick={() => setOpen(v => !v)}
        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Role actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1">
          <button
            id="role-edit-btn"
            onClick={() => { setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil size={13} className="text-slate-400" />
            Edit role
          </button>
          <button
            id="role-delete-btn"
            onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} />
            Delete role
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Role Form Modal ──────────────────────────────────────────
function RoleModal({ mode, initial, onSave, onClose }) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(isEdit && initial ? {
    title:      initial.title,
    type:       initial.type,
    skillsStr:  serializeSkills(initial.skills),
    status:     initial.status,         // ← carries existing status in correctly
    applicants: initial.applicants ?? 0,
    openings:   initial.openings   ?? 1,
  } : {
    title: '', type: 'Volunteer', skillsStr: '', status: 'Open', applicants: 0, openings: 1,
  })

  const [error, setError] = useState('')

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Role title is required.'); return }
    onSave({
      title:      form.title.trim(),
      type:       form.type,
      skills:     parseSkills(form.skillsStr),
      status:     form.status,           // ← always passed through
      applicants: form.applicants,
      openings:   form.openings,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-display font-bold text-[18px] text-slate-900">
            {isEdit ? 'Edit Role' : 'Create Role'}
          </h2>
          <button
            id="role-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form id="role-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[12px] text-rose-700">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* Role Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Role Title
            </label>
            <input
              id="role-title-input"
              type="text"
              placeholder="e.g. Frontend Developer"
              value={form.title}
              onChange={e => { setError(''); set('title', e.target.value) }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[13px] text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200 transition-all"
            />
          </div>

          {/* Role Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Role Type
            </label>
            <div className="relative">
              <select
                id="role-type-select"
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 text-[13px] text-slate-800 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200 appearance-none transition-all"
              >
                {ROLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Required Skills <span className="font-normal normal-case text-slate-400">(comma separated)</span>
            </label>
            <input
              id="role-skills-input"
              type="text"
              placeholder="e.g. React, Node.js, TypeScript"
              value={form.skillsStr}
              onChange={e => set('skillsStr', e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[13px] text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200 transition-all"
            />
          </div>

          {/* Openings + Applicants side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Openings
              </label>
              <Stepper id="openings" value={form.openings} min={1} max={50} onChange={v => set('openings', v)} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Applicants
              </label>
              <Stepper id="applicants" value={form.applicants} min={0} max={9999} onChange={v => set('applicants', v)} />
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  id={`role-status-${s.toLowerCase()}`}
                  onClick={() => set('status', s)}
                  className={`flex-1 h-10 rounded-lg text-[13px] font-semibold border transition-all ${
                    form.status === s
                      ? s === 'Open'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-rose-50 border-rose-400 text-rose-600 ring-1 ring-rose-200'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              id="role-modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="role-modal-save-btn"
              type="submit"
              className="flex-1 h-10 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            > 
              <Check size={14}/>
              {isEdit ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────
function DeleteConfirm({ role, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={20} className="text-rose-500" />
          </div>
          <h2 className="font-display font-bold text-[18px] text-slate-900 mb-2">Delete Role?</h2>
          <p className="text-[13px] text-slate-500 mb-6">
            Are you sure you want to delete <span className="font-semibold text-slate-700">"{role.title}"</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              id="role-delete-cancel-btn"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="role-delete-confirm-btn"
              onClick={onConfirm}
              className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-rose-700 text-white text-[13px] font-bold transition-all ease-in-out hover:bg-red-400 hover:translate-x-1"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function ProjectHiring() {
  const { id } = useParams()
  const [hiringRoles, setHiringRoles] = useState(INITIAL_ROLES)
  const [modal, setModal] = useState(null)

  const openCreate = ()       => setModal({ type: 'create' })
  const openEdit   = (role)   => setModal({ type: 'edit', role })
  const openDelete = (role)   => setModal({ type: 'delete', role })
  const closeModal = ()       => setModal(null)

  function handleCreate(data) {
    setHiringRoles(prev => [...prev, { id: Date.now(), ...data }])
    closeModal()
  }

  function handleEdit(data) {
    setHiringRoles(prev =>
      prev.map(r => r.id === modal.role.id ? { ...r, ...data } : r)
    )
    closeModal()
  }

  function handleDelete() {
    setHiringRoles(prev => prev.filter(r => r.id !== modal.role.id))
    closeModal()
  }

  const totalApplicants = hiringRoles.reduce((s, r) => s + (r.applicants || 0), 0)
  const totalOpenings   = hiringRoles.reduce((s, r) => s + (r.openings   || 0), 0)
  const openCount       = hiringRoles.filter(r => r.status === 'Open').length

  return (
    <WorkspaceLayout>
      <div className="page-stack max-w-[1200px] mx-auto w-full mb-16">

        {/* Header */}
        <section className="reveal-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Hiring Roles</h1>
            <p className="text-[15px] text-slate-500 mt-1">
              {hiringRoles.length} role{hiringRoles.length !== 1 ? 's' : ''} · {openCount} open
            </p>
          </div>
          <button id="create-role-btn" onClick={openCreate} className="button button-primary">
            Create Role <Plus size={14} />
          </button>
        </section>

        {/* Stats strip */}
        <div className="reveal-in delay-0 grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Roles',       value: hiringRoles.length },
            { label: 'Total Openings',    value: totalOpenings      },
            { label: 'Total Applicants',  value: totalApplicants    },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Roles Table */}
        <div className="dashboard-section reveal-in delay-1">
          {hiringRoles.length === 0 ? (
            <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm p-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-[14px] mb-4">No roles yet. Create your first hiring role.</p>
              <button id="create-first-role-btn" onClick={openCreate} className="button button-primary">
                Create Role <Plus size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[18px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="py-4 px-6">Role Title</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Required Skills</th>
                    <th className="py-4 px-6 text-center">Openings</th>
                    <th className="py-4 px-6 text-center">Applicants</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                  {hiringRoles.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-semibold text-slate-900">{r.title}</td>
                      <td className="py-4 px-6 text-brand-700 font-semibold">{r.type}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {r.skills.length === 0
                            ? <span className="text-slate-400 italic text-[12px]">—</span>
                            : r.skills.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200/60 text-slate-600 font-medium rounded-sm text-[11px]">
                                  {s}
                                </span>
                              ))
                          }
                        </div>
                      </td>
                      {/* Openings — read-only, edit via ... → Edit */}
                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        {r.openings ?? 1}
                      </td>
                      {/* Applicants — read-only, edit via ... → Edit */}
                      <td className="py-4 px-6 text-center font-bold text-slate-900">
                        {r.applicants ?? 0}
                      </td>
                      <td className="py-4 px-6">
                        {/* Click to toggle status directly in the table */}
                        <button
                          type="button"
                          onClick={() => setHiringRoles(prev => prev.map(x => x.id === r.id ? { ...x, status: x.status === 'Open' ? 'Closed' : 'Open' } : x))}
                          className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                            r.status === 'Open'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Click to toggle status"
                        >
                          {r.status}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <ActionMenu onEdit={() => openEdit(r)} onDelete={() => openDelete(r)} />
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer totals */}
                <tfoot>
                  <tr className="bg-slate-50/60 border-t border-slate-200 text-[12px] font-bold text-slate-600">
                    <td className="py-3 px-6" colSpan={3}>Totals</td>
                    <td className="py-3 px-6 text-center">{totalOpenings}</td>
                    <td className="py-3 px-6 text-center">{totalApplicants}</td>
                    <td className="py-3 px-6" colSpan={2}>
                      <span className="text-emerald-600">{openCount} open</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span className="text-rose-500">{hiringRoles.length - openCount} closed</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals — rendered via portal so they escape layout overflow clipping */}
      {modal?.type === 'create' && createPortal(
        <RoleModal mode="create" onSave={handleCreate} onClose={closeModal} />,
        document.body
      )}
      {modal?.type === 'edit' && createPortal(
        <RoleModal mode="edit" initial={modal.role} onSave={handleEdit} onClose={closeModal} />,
        document.body
      )}
      {modal?.type === 'delete' && createPortal(
        <DeleteConfirm role={modal.role} onConfirm={handleDelete} onClose={closeModal} />,
        document.body
      )}
    </WorkspaceLayout>
  )
}
