import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProjectOverview() {
  const { id } = useParams()
  return <div className="p-6"><h1>Attention Center</h1><p>Project ID: {id}</p></div>
}
