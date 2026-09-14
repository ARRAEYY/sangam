import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProjectApplications() {
  const { id } = useParams()
  return <div className="p-6"><h1>Recruiting Pipeline</h1><p>Project ID: {id}</p></div>
}
