import React, { useEffect, useState } from 'react'
import { Navigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api.js'

export default function WorkspaceGuard({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { id: projectId } = useParams()
  const location = useLocation()
  const [hasAccess, setHasAccess] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccessStatus() {
      if (!projectId) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const context = await api.getProjectContext(projectId)
        setHasAccess(context.is_lead || context.is_owner || context.is_member)
      } catch (err) {
        console.error('Error checking access status:', err)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      checkAccessStatus()
    }
  }, [user, projectId, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <p className="text-indigo-900 font-medium animate-pulse">
          Loading Workspace...
        </p>
      </div>
    )
  }

  if (!user) {
    const redirectTarget = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTarget)}`} replace />
  }

  if (hasAccess === false) {
    // Redirect to public project page if they don't have access
    return <Navigate to={`/projects/${projectId}`} replace />
  }

  return children
}
