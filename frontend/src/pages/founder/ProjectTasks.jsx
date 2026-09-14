import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ListTodo, AlertCircle, X } from 'lucide-react'
import { api } from '../../api'
import KanbanBoard from '../../components/founder/KanbanBoard'
import ReviewDrawer from '../../components/founder/ReviewDrawer'

export default function ProjectTasks() {
  const { id: projectId } = useParams()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true)
        const data = await api.getTasks(projectId)
        setTasks(data)
      } catch (err) {
        console.error('Failed to fetch tasks:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [projectId])

  const handleTaskMove = async (taskId, sourceStatus, destinationStatus) => {
    if (sourceStatus === destinationStatus) return

    // Optimistic update
    const previousTasks = [...tasks]
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: destinationStatus } : t))

    try {
      await api.updateTask(projectId, taskId, { status: destinationStatus })
      // Success - no further action needed as state is already updated
    } catch (err) {
      console.error('Failed to update task status:', err)
      // Rollback
      setTasks(previousTasks)
      setToast({
        message: `Failed to move task: ${err.message}`,
        type: 'error'
      })
      // Auto-clear toast after 5 seconds
      setTimeout(() => setToast(null), 5000)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleReviewComplete = (taskId, decision) => {
    const destinationStatus = decision === 'APPROVE' ? 'Completed' : 'In Progress'
    handleTaskMove(taskId, 'Ready for Review', destinationStatus)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Unable to load tasks</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-indigo-900 text-white font-bold rounded-xl hover:bg-indigo-800 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="page-stack max-w-7xl mx-auto w-full relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 p-4 bg-red-600 text-white rounded-2xl shadow-2xl border border-red-700 min-w-[300px]">
            <AlertCircle size={20} />
            <p className="font-bold text-sm flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="hover:bg-red-700 p-1 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <header className="mb-8">
        <Link
          to={`/founder/projects/${projectId}/overview`}
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Overview
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-900 rounded-xl">
              <ListTodo size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-indigo-900 tracking-tight">Execution Board</h1>
              <p className="text-slate-600">Visual progress and task lifecycle management.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-300px)]">
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          isLoading={loading}
          error={error}
          onTaskClick={handleTaskClick}
        />
      </div>

      {selectedTask && (
        <ReviewDrawer
          task={selectedTask}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </div>
  )
}
