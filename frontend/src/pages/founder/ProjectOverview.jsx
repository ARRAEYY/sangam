import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProjectOverview() {
  const { id } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-indigo-900 mb-4">Attention Center</h1>
      <div className="p-4 bg-indigo-50 border-l-4 border-yellow-400 rounded-r-lg">
        <p className="text-indigo-800">Project ID: <span className="font-mono font-bold">{id}</span></p>
      </div>
    </div>
  )
}
