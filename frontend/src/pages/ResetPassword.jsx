import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import SangamLogo from '../components/SangamLogo.jsx'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [rules, setRules] = useState([])

  useEffect(() => {
    api.getPasswordRules().then((res) => {
      if (res?.rules) setRules(res.rules)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Password reset token is missing from the link. Please request a new link.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => {
        navigate('/auth?reset=true')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <SangamLogo className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Reset Your Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter a new secure password for your Sangam account.</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              ✓
            </div>
            <h3 className="font-semibold text-emerald-900">Password Reset Successful!</h3>
            <p className="mt-1 text-xs text-emerald-700">
              Redirecting you to the sign in page in 3 seconds...
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {rules.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <p className="mb-1.5 font-semibold text-slate-700">Password Requirements:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Updating password...' : 'Set New Password'}
            </button>

            <div className="text-center">
              <Link to="/auth" className="text-xs text-slate-500 hover:text-brand-600">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
