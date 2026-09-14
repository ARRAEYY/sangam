import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProjectSettings() {
  const { id } = useParams()
  return <div className="p-6"><h1>Project Config</h1><p>Project ID: {id}</p></div>
}
