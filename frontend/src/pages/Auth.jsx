import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SkillTagInput from '../components/SkillTagInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { SangamEmblem } from '../components/SangamLogo.jsx'
import { api } from '../api'

const currentYear = new Date().getFullYear()

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const levels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-emerald-500' },
    { label: 'Strong', color: 'bg-emerald-600' },
  ]
  const idx = Math.min(Math.max(score - 1, 0), 4)
  return { score, label: levels[idx].label, color: levels[idx].color }
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendSuccess, setResendSuccess] = useState('')

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    full_name: '',
    branch: '',
    graduation_year: currentYear + 1,
    github_url: '',
    skills: [],
  })

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setInfoMsg('Your email has been verified successfully! You can now sign in.')
    }
  }, [searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMsg('')
    setResendSuccess('')
    setSubmitting(true)
    try {
      await login(loginForm.email, loginForm.password)
      navigate('/explore')
    } catch (err) {
      setError(err.message)
      if (err.data?.email_unverified) {
        setResendEmail(loginForm.email)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setForgotMsg('')
    setForgotSubmitting(true)
    try {
      const res = await api.forgotPassword(forgotEmail)
      setForgotMsg(res.message || 'If an account with that email exists, a temporary password has been sent to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setForgotSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setInfoMsg('')
    setResendSuccess('')
    setSubmitting(true)
    try {
      const res = await register({ ...regForm, graduation_year: Number(regForm.graduation_year) })
      setInfoMsg(res.message || 'Account created! Please check your email/console to verify your account.')
      setMode('login')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    if (!resendEmail) return
    try {
      const res = await api.resendVerification(resendEmail)
      setResendSuccess(res.message || 'Verification link resent.')
    } catch (err) {
      setError(err.message)
    }
  }

  const strength = getPasswordStrength(regForm.password)

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-7 text-center">
        <SangamEmblem size={44} className="mx-auto mb-4 text-slate-900" />
        <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'login' ? 'Welcome back to Sangam' : 'Join Sangam'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login' ? 'Sign in with your campus email.' : 'Only campus email addresses are accepted.'}
        </p>
      </div>

      <div className="card p-6 sm:p-7">
        <div className="mb-6 flex rounded-full bg-slate-100 p-1">
          <button
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
            onClick={() => { setMode('login'); setError(''); setInfoMsg(''); }}
          >
            Sign in
          </button>
          <button
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
            onClick={() => { setMode('register'); setError(''); setInfoMsg(''); }}
          >
            Create account
          </button>
        </div>

        {infoMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{infoMsg}</div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
            {resendEmail && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="font-semibold underline text-red-800 hover:text-red-900"
                >
                  Resend verification link
                </button>
              </div>
            )}
          </div>
        )}

        {resendSuccess && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{resendSuccess}</div>
        )}

        {mode === 'login' ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Campus email">
                <input
                  type="email"
                  required
                  placeholder="you@depart.rishihood.edu.in"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="input"
                />
              </Field>
              <SubmitButton submitting={submitting} label="Sign in" />
            </form>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => { setForgotMode(!forgotMode); setForgotMsg(''); setError(''); }}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition"
              >
                Forgot password?
              </button>
            </div>
            {forgotMode && (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-600">
                  Enter your campus email and we'll send you a temporary password.
                </p>
                {forgotMsg && (
                  <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{forgotMsg}</div>
                )}
                <Field label="Campus email">
                  <input
                    type="email"
                    required
                    placeholder="you@depart.rishihood.edu.in"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input bg-white"
                  />
                </Field>
                <SubmitButton submitting={forgotSubmitting} label="Reset password" />
              </form>
            )}
          </>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Full name">
              <input
                required
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Campus email">
              <input
                type="email"
                required
                placeholder="you@depart.rishihood.edu.in"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={12}
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                className="input"
                placeholder="Min 12 chars, upper/lower/digit/special"
              />
              {regForm.password && (
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
              <Field label="Branch / major">
                <input
                  required
                  value={regForm.branch}
                  onChange={(e) => setRegForm({ ...regForm, branch: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Graduation year">
                <input
                  type="number"
                  required
                  min={currentYear - 5}
                  max={currentYear + 5}
                  value={regForm.graduation_year}
                  onChange={(e) => setRegForm({ ...regForm, graduation_year: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <Field label="GitHub URL (optional)">
              <input
                value={regForm.github_url}
                onChange={(e) => setRegForm({ ...regForm, github_url: e.target.value })}
                className="input"
                placeholder="https://github.com/you"
              />
            </Field>
            <Field label="Skills">
              <SkillTagInput
                value={regForm.skills}
                onChange={(skills) => setRegForm({ ...regForm, skills })}
                placeholder="e.g. React, Figma, Python"
              />
            </Field>
            <SubmitButton submitting={submitting} label="Create account" />
          </form>
        )}
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
    <button type="submit" disabled={submitting} className="btn-primary w-full">
      {submitting ? 'Please wait…' : label}
    </button>
  )
}
