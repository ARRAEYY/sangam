import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { SangamEmblem } from '../components/SangamLogo.jsx'
import { api } from '../api'

/** UX-only client-side domain check — backend is the authoritative security boundary */
function isCampusEmail(email) {
  const domain = String(email || '').trim().toLowerCase().split('@')[1]
  if (!domain) return null // not typed yet
  return domain === 'rishihood.edu.in' || domain.endsWith('.rishihood.edu.in')
}

function getSafeRedirect(rawParam) {
  if (!rawParam) return '/explore'
  let decoded
  try {
    decoded = decodeURIComponent(rawParam)
  } catch {
    return '/explore'
  }
  // Must start with a single '/' (relative path), never '//' or an absolute URL with scheme
  const isRelative = /^\/(?!\/)/.test(decoded)
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(decoded)
  if (!isRelative || hasScheme) return '/explore'
  // Whitelist to known app routes only — reject arbitrary open redirects
  const allowedPrefixes = ['/projects/', '/explore', '/talent', '/dashboard', '/create', '/notifications']
  const isAllowed = allowedPrefixes.some((p) => decoded.startsWith(p))
  return isAllowed ? decoded : '/explore'
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendSuccess, setResendSuccess] = useState('')

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      if (!user.is_onboarded) {
        navigate('/onboarding', { replace: true })
      } else {
        const target = getSafeRedirect(searchParams.get('redirect'))
        navigate(target, { replace: true })
      }
    }
  }, [user, navigate, searchParams])

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const loginEmailDomainValid = isCampusEmail(loginForm.email)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setInfoMsg('Your email has been verified successfully! You can now sign in.')
    }
    if (searchParams.get('reset') === 'true') {
      setInfoMsg('Your password has been reset successfully! Please sign in with your new password.')
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
      // Redirection is handled by the useEffect above
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
      setForgotMsg(res.message || 'If an account with that email exists, password reset instructions have been sent to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setForgotSubmitting(false)
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-7 text-center">
        <SangamEmblem size={44} className="mx-auto mb-4 text-slate-900" />
        <h1 className="font-sans text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Sangam
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your Rishihood campus email or Google account.
        </p>
      </div>

      <div className="card p-6 sm:p-7">
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

        <div className="mb-5">
          <GoogleSignInButton
            onSuccess={() => { /* Redirection is handled by the useEffect */ }}
            onError={(err) => setError(err)}
          />
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-2 text-xs uppercase tracking-wider text-slate-400">
              or with email
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Campus email">
            <input
              type="email"
              required
              placeholder="you@nst.rishihood.edu.in"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className="input"
            />
            {loginEmailDomainValid === false && (
              <p className="mt-1 text-xs text-amber-600">Please use your Rishihood campus email address.</p>
            )}
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
              Enter your campus email and we'll send you a link to reset your password.
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
