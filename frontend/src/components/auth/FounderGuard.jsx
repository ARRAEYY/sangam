import React, { useEffect, useState } from 'react'
import { Navigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'

export default function FounderGuard({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { id: projectId } = useParams() // Using 'id' to be consistent with /projects/:id
  const location = useLocation()
  const [isLead, setIsLead] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkLeadStatus() {
      if (!user || !projectId) {
        setLoading(false)
        return
      }

      try {
        const context = await api.getProjectContext(projectId, user.token)
        setIsLead(context.is_lead)
      } catch (err) {
        console.error('Error checking lead status:', err)
        setIsLead(false)
      } finally {
        setLoading(false)
      }
    }

    checkLeadStatus()
  }, [user, projectId])

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
    return <Navigate to={`/projects/${projectId}`} replace />
  }

  return children
}
