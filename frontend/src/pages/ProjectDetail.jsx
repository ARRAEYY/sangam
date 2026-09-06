import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProjectDetailModal } from '../components/ProjectDetailModal.jsx'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background similar to Dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[100vw] h-[100vw] rounded-full bg-[#7f1d3b]/5 blur-3xl opacity-50" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[100vw] h-[100vw] rounded-full bg-slate-300/10 blur-3xl opacity-50" />
      </div>

      <ProjectDetailModal 
        isOpen={true} 
        onClose={() => {
          if (window.history.length > 2) {
            navigate(-1)
          } else {
            navigate('/dashboard')
          }
        }} 
        projectPreview={{ id }} 
      />
    </div>
  )
}
