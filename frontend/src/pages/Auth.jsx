import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SkillTagInput from '../components/SkillTagInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { SangamEmblem } from '../components/SangamLogo.jsx'

const currentYear = new Date().getFullYear()

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(loginForm.email, loginForm.password)
      navigate('/explore')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ ...regForm, graduation_year: Number(regForm.graduation_year) })
      navigate('/explore')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-7 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <SangamEmblem size={30} className="text-white" />
        </span>
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
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}



        {mode === 'login' ? (
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
                minLength={8}
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                className="input"
              />
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
