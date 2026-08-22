import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-slate-500">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}
