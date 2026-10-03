import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'
import GlobalNav from '../components/layout/GlobalNav.jsx'
import GlobalGrid from '../components/layout/GlobalGrid.jsx'

/** UX-only client-side domain check — backend is the authoritative security boundary */
function isCampusEmail(email) {
  const domain = String(email || '').trim().toLowerCase().split('@')[1]
  if (!domain) return null // not typed yet
  return domain === 'rishihood.edu.in' || domain.endsWith('.rishihood.edu.in')
}

function getSafeRedirect(rawParam) {
  if (!rawParam) return '/dashboard'
  let decoded
  try {
    decoded = decodeURIComponent(rawParam)
  } catch {
    return '/dashboard'
  }
  // Must start with a single '/' (relative path), never '//' or an absolute URL with scheme
  const isRelative = /^\/(?!\/)/.test(decoded)
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(decoded)
  if (!isRelative || hasScheme) return '/dashboard'
  // Whitelist to known app routes only — reject arbitrary open redirects
  const allowedPrefixes = ['/projects/', '/explore', '/talent', '/dashboard', '/create', '/notifications']
  const isAllowed = allowedPrefixes.some((p) => decoded.startsWith(p))
  return isAllowed ? decoded : '/dashboard'
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
    <div className="min-h-[100dvh] bg-[#faf9f5] flex flex-col font-sans text-[#182232] relative overflow-hidden">
      {/* Dashed blueprint grid — same system as the landing page */}
      <GlobalGrid />

      {/* Shared glass nav + dashed blueprint grid */}
      <GlobalNav />

      <main className="relative z-10 flex-1 w-full flex items-center pt-[74px] md:pt-[113px] pb-12 lg:pb-0">
        <div className="w-[min(1400px,calc(100%-8vw))] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-14 lg:gap-16 items-center">

          {/* Editorial side */}
          <div className="lg:pl-[52px]">
            <img
              src="/login.png"
              alt="Students helping each other climb toward an open door"
              draggable="false"
              className="w-[clamp(240px,34vw,520px)] h-auto mb-4 select-none pointer-events-none"
            />
            <h1 className="font-display font-medium text-[clamp(44px,6vw,84px)] leading-[0.95] tracking-[-0.04em] text-[#182232]">
              There's a place<br />for you.
            </h1>
            <p className="mt-5 text-[14px] text-[#737d88] leading-[1.55]">
              Your next collaboration might<br />already be taking shape.
            </p>
          </div>

          {/* Authentication card */}
          <div className="w-full max-w-[400px] mx-auto lg:mx-0 lg:justify-self-end">
            <div className="w-full bg-white rounded-[24px] p-8 md:p-9 shadow-[0_18px_50px_rgba(24,34,50,0.07)] border border-[#ece7db]">

              {/* Card Header */}
              <div className="mb-7">
                <span className="text-[9px] font-bold tracking-[0.2em] text-[#5f6673] uppercase block mb-3">
                  Login
                </span>
                <h2 className="font-display text-[28px] text-[#182232] leading-[1.1] mb-1.5">Welcome to <span className="text-[#7f1d3b]">Sangam</span></h2>
              </div>

              {/* Error/Info States */}
              {infoMsg && (
                <div role="status" className="mb-5 rounded-[12px] bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800 border border-emerald-100">{infoMsg}</div>
              )}

              {error && (
                <div id="auth-error" role="alert" className="mb-5 rounded-[12px] bg-red-50 px-4 py-3 text-[12px] text-red-700 border border-red-100">
                  {error}
                  {resendEmail && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="font-bold underline text-red-800 hover:text-red-900 transition-colors"
                      >
                        Resend verification link
                      </button>
                    </div>
                  )}
                </div>
              )}

              {resendSuccess && (
                <div role="status" className="mb-5 rounded-[12px] bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800 border border-emerald-100">{resendSuccess}</div>
              )}

              {/* Authentication Form */}
              {forgotMode ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-[12px] text-slate-600 mb-4">
                    Enter your campus email and we'll send you a link to reset your password.
                  </p>
                  {forgotMsg && (
                    <div role="status" className="mb-4 rounded-[12px] bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800 border border-emerald-100">{forgotMsg}</div>
                  )}
                  <Field label="Email" errorId="auth-error" hasError={Boolean(error)}>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      aria-describedby={error ? 'auth-error' : undefined}
                      placeholder="you@rishihood.edu.in"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full h-[46px] px-4 rounded-full border border-slate-200 bg-white text-[13px] outline-none focus:border-[#7f1d3b] focus:ring-1 focus:ring-[#7f1d3b] transition-all"
                    />
                  </Field>
                  <div className="pt-2">
                    <SubmitButton submitting={forgotSubmitting} label="Reset password" />
                  </div>
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => setForgotMode(false)} className="text-[11px] font-medium text-[#5f6673] hover:text-[#7f1d3b] transition-colors">Back to sign in</button>
                  </div>
                </form>
              ) : (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field label="Email" errorId="auth-error" hasError={Boolean(error)}>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        aria-describedby={error ? 'auth-error' : undefined}
                        placeholder="you@rishihood.edu.in"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full h-[46px] px-4 rounded-full border border-slate-200 bg-white text-[13px] outline-none focus:border-[#7f1d3b] focus:ring-1 focus:ring-[#7f1d3b] transition-all"
                      />
                      {loginEmailDomainValid === false && (
                        <p className="mt-1.5 text-[10px] text-amber-600">Please use your Rishihood campus email address.</p>
                      )}
                    </Field>
                    <Field label="Password" errorId="auth-error" hasError={Boolean(error)}>
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        aria-describedby={error ? 'auth-error' : undefined}
                        placeholder="Your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full h-[46px] px-4 rounded-full border border-slate-200 bg-white text-[13px] outline-none focus:border-[#7f1d3b] focus:ring-1 focus:ring-[#7f1d3b] transition-all"
                      />
                    </Field>

                    <div className="pt-1">
                      <button type="submit" disabled={submitting} className="w-full h-[46px] bg-[#7f1d3b] hover:bg-[#5c132b] text-white rounded-full text-[13px] font-bold flex items-center justify-center gap-2 transition-colors">
                        {submitting ? 'Please wait…' : (
                          <>Sign in <ArrowRight size={14} strokeWidth={2.5} /></>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="relative my-6 flex items-center justify-center">
                    <div className="w-full border-t border-slate-100" />
                    <span className="absolute bg-white px-3 text-[11px] text-[#5f6673]">
                      or
                    </span>
                  </div>

                  <GoogleSignInButton
                    onSuccess={() => { /* Redirection is handled by the useEffect */ }}
                    onError={(err) => setError(err)}
                  />

                  {/* Forgot Password Link moved here */}
                  <div className="mt-6 text-center">
                    <button type="button" onClick={() => { setForgotMode(true); setForgotMsg(''); setError(''); }} className="text-[10px] font-bold text-[#7f1d3b] hover:text-[#5c132b] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

function Field({ label, children, errorId, hasError }) {
  return (
    <label className="block" aria-describedby={hasError ? errorId : undefined}>
      <span className="mb-2 block text-[11px] font-bold text-[#182232]">{label}</span>
      {children}
    </label>
  )
}

function SubmitButton({ submitting, label }) {
  return (
    <button type="submit" disabled={submitting} className="w-full h-[46px] bg-[#7f1d3b] hover:bg-[#5c132b] text-white rounded-full text-[14px] font-bold flex items-center justify-center gap-2 transition-colors">
      {submitting ? 'Please wait…' : label}
    </button>
  )
}
