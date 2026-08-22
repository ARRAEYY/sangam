import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function SkillTagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  const addSkill = () => {
    const cleaned = draft.trim()
    if (cleaned && !value.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      onChange([...value, cleaned])
    }
    setDraft('')
  }

  const removeSkill = (skill) => {
    onChange(value.filter((s) => s !== skill))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="mb-1 flex flex-wrap gap-1.5">
        {value.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
          >
            {skill}
            <button type="button" onClick={() => removeSkill(skill)}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addSkill()
          }
        }}
        onBlur={addSkill}
        placeholder={placeholder || 'Type a skill and hit Enter'}
        className="w-full border-none px-1 py-1 text-sm outline-none"
      />
    </div>
  )
}
