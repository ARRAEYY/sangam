import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { SangamEmblem } from '../components/ui/SangamLogo.jsx'

// Email verification links now point here (frontend origin) instead of being
// Host-derived API URLs — the page completes verification and routes the
// user to sign in (issue #28).
export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [state, setState] = useState(token ? 'verifying' : 'missing')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api
      .verifyEmail(token)
      .then((res) => {
        if (!cancelled) setState(res?.verified ? 'verified' : 'error')
      })
      .catch((err) => {
        console.error('Email verification failed:', err)
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const content = {
    verifying: {
      tone: 'text-slate-500',
      title: 'Verifying your email…',
      body: 'Hang on a moment while we confirm your campus email.',
    },
    verified: {
      tone: 'text-emerald-700',
      title: 'Email verified!',
      body: 'Your campus email is confirmed. You can now sign in to Sangam.',
    },
    missing: {
      tone: 'text-red-700',
      title: 'Verification link is incomplete',
      body: 'This link is missing its verification token. Please request a new verification email.',
    },
    error: {
      tone: 'text-red-700',
      title: 'We could not verify your email',
      body: 'The link may be invalid or already used. Request a new verification email and try again.',
    },
  }[state]

  return (
    <div className="min-h-[100dvh] bg-[#faf9f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-[0_12px_40px_rgba(24,34,50,0.04)] border border-[#f4f4f4] text-center">
        <SangamEmblem size={40} className="mx-auto mb-5 text-[#7f1d3b]" />
        <h1 className={`font-display text-[22px] mb-2 ${content.tone}`}>{content.title}</h1>
        <p className="text-[13px] text-[#737d88] leading-[1.6] mb-6">{content.body}</p>
        <Link
          to="/auth"
          className="inline-flex h-[46px] items-center justify-center rounded-full bg-[#7f1d3b] px-6 text-[13px] font-bold text-white transition-colors hover:bg-[#5c132b]"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  )
}
