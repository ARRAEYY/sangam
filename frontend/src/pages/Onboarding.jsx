import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SangamEmblem } from '../components/SangamLogo.jsx'
import { api } from '../api'

const currentYear = new Date().getFullYear()

// Same valid courses from the backend/utils
const VALID_COURSES = [
  'B.Tech Computer Science',
  'B.Tech Artificial Intelligence',
  'B.Sc Computer Science',
  'B.B.A',
  'B.Des',
  'B.A. (Hons.)',
  'MBA',
  'General',
]

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: 'None', color: 'bg-slate-200' }
  let score = 0
  if (password.length > 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 4) return { score, label: 'Good', color: 'bg-amber-500' }
  return { score, label: 'Strong', color: 'bg-emerald-500' }
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    branch: '',
    graduation_year: currentYear + 1,
  })

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already onboarded or not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
    } else if (user.is_onboarded) {
      navigate('/explore', { replace: true })
    } else {
      setForm((prev) => ({
        ...prev,
        full_name: user.full_name || '',
        email: user.email || '',
      }))
    }
  }, [user, navigate])

  if (!user || user.is_onboarded) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.onboardGoogleUser({
        password: form.password,
        branch: form.branch,
        graduation_year: Number(form.graduation_year),
      })
      await refreshProfile()
      navigate('/explore', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const strength = getPasswordStrength(form.password)

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-7 text-center">
        <SangamEmblem size={44} className="mx-auto mb-4 text-slate-900" />
        <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900">
          Complete your Sangam profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You're almost there. Complete your student profile to start using Sangam.
        </p>
      </div>

      <div className="card p-6 sm:p-7">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input bg-slate-50"
              readOnly
            />
          </Field>
          
          <Field label="College email">
            <input
              type="email"
              required
              value={form.email}
              className="input bg-slate-50 text-slate-500"
              readOnly
            />
            <p className="mt-1 text-xs text-slate-500">Your verified Google email.</p>
          </Field>

          <Field label="Create Password">
            <input
              type="password"
              required
              minLength={12}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="Min 12 chars, upper/lower/digit/special"
            />
            {form.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Strength: {strength.label}</span>
                  <span>{strength.score}/5</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Course / Branch">
              <select
                required
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="input"
              >
                <option value="" disabled>Select course</option>
                {VALID_COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Graduation year">
              <input
                type="number"
                required
                min={currentYear - 5}
                max={currentYear + 5}
                value={form.graduation_year}
                onChange={(e) => setForm({ ...form, graduation_year: e.target.value })}
                className="input"
              />
            </Field>
          </div>

          <SubmitButton submitting={submitting} label="Complete Profile" />
        </form>
      </div>
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

function SubmitButton({ submitting, label }) {
  return (
    <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
      {submitting ? 'Please wait…' : label}
    </button>
  )
}
