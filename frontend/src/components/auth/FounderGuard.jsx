import React, { useEffect, useState } from 'react'
import { Navigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'

export default function FounderGuard({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { id: projectId } = useParams()
  const location = useLocation()
  const [isLead, setIsLead] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkLeadStatus() {
      // No projectId means this is the /founder hub — just require auth
      if (!projectId) {
        setIsLead(true)
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const context = await api.getProjectContext(projectId)
        setIsLead(context.is_lead || context.is_owner)
      } catch (err) {
        console.error('Error checking lead status:', err)
        setIsLead(false)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      checkLeadStatus()
    }
  }, [user, projectId, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <p className="text-indigo-900 font-medium animate-pulse">
          Loading Command Center...
        </p>
      </div>
    )
  }

  if (!user) {
    const redirectTarget = location.pathname + location.search
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTarget)}`} replace />
  }

  if (isLead === false) {
    // For project-scoped routes, redirect to the public project page
    if (projectId) {
      return <Navigate to={`/projects/${projectId}`} replace />
    }
    // For the hub route, redirect to dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}

