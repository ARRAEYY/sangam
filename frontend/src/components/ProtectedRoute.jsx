import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-slate-500">Loading…</p>
  }

  if (!user) {
    const redirectTarget = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTarget)}`} replace />
  }

  return children
}
