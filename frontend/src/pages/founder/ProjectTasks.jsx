import React from 'react'
import { useParams } from 'react-router-dom'

export default function ProjectTasks() {
  const { id } = useParams()
  return <div className="p-6"><h1>Execution Board</h1><p>Project ID: {id}</p></div>
}
