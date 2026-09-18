import React, { useState } from 'react'
import { X, CheckCircle, MessageSquare, AlertCircle, Send } from 'lucide-react'
import { api } from '../../api'

export default function ReviewDrawer({ task, projectId, onClose, onReviewComplete }) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleReview = async (decision) => {
    if (decision === 'REQUEST_CHANGES' && !comment.trim()) {
      setError('A comment is required when requesting changes.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await api.reviewTask(projectId, task.id, {
        decision,
        comment: comment.trim() || undefined,
      })
      onReviewComplete(task.id, decision)
      onClose()
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-indigo-900">Review Task</h2>
            <p className="text-sm text-slate-500">Founder Approval Loop</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Task Info */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Task Details</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-lg font-bold text-indigo-900 mb-2">{task.title}</h4>
              <p className="text-slate-600 leading-relaxed">{task.description}</p>
            </div>
          </section>

          {/* Latest Updates / Activity */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Latest Activity</h3>
            </div>
            <div className="space-y-3">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((c, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-indigo-900">{c.author}</span>
                      <span className="text-[10px] text-slate-400">{c.date}</span>
                    </div>
                    <p className="text-sm text-slate-600">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No comments yet for this task.</p>
              )}
            </div>
          </section>
        </div>

        {/* Approval Panel */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Review Note (Required for Request Changes)
              </label>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add context or requested changes..."
                  className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[100px] resize-none"
                />
                <div className="absolute bottom-3 right-3 text-slate-300">
                  <Send size={16} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleReview('REQUEST_CHANGES')}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-900 text-white font-bold rounded-xl hover:bg-indigo-800 transition-colors disabled:opacity-50"
              >
                <MessageSquare size={18} />
                Request Changes
              </button>
              <button
                onClick={() => handleReview('APPROVE')}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors disabled:opacity-50 border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
              >
                <CheckCircle size={18} />
                Approve & Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
