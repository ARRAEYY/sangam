import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [error, setError] = useState(null)

  const handleDeleteAccount = async () => {
    const confirmPrompt = window.prompt(
      'WARNING: This will permanently delete your account, projects, applications, connections, and portfolio data.\n\nType DELETE to confirm:'
    )
    if (confirmPrompt !== 'DELETE') return

    setDeletingAccount(true)
    try {
      await api.deleteAccount()
      await logout()
      navigate('/')
    } catch (err) {
      setError(err.message)
      setDeletingAccount(false)
    }
  }

  if (!user) return null

  return (
    <div className="w-full max-w-[640px] mx-auto pb-24">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage your account preferences and settings.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Danger Zone: Account Deletion */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6 mt-8">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle size={18} />
          <h2 className="font-semibold text-sm uppercase tracking-wider">Danger Zone</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-red-700">
          Permanently delete your account and all associated data including your projects, applications, portfolio entries, and connections. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
        >
          {deletingAccount ? 'Deleting account...' : 'Delete Account'}
        </button>
      </section>
    </div>
  )
}
