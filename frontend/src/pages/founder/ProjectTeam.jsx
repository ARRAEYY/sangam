import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function ProjectTeam() {
  const { id } = useParams()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transferringTo, setTransferringTo] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [id])

  async function fetchMembers() {
    setLoading(true)
    try {
      const data = await api.getMembers(id)
      setMembers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm('Are you sure you want to remove this member?')) return
    try {
      await api.removeMember(id, userId)
      await fetchMembers()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleTransferOwnership() {
    if (!transferringTo) {
      alert('Please select a member to transfer ownership to.')
      return
    }
    if (transferringTo === user?.id) {
      alert('You are already the owner.')
      return
    }
    if (!window.confirm(`Are you sure you want to transfer ownership to this member? You will lose owner privileges.`)) return

    try {
      await api.updateMemberRole(id, transferringTo, { role: 'OWNER' })
      alert('Ownership transferred successfully.')
      await fetchMembers()
      setTransferringTo('')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-6 text-center text-indigo-900">Loading team roster...</div>
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>

  const owner = members.find(m => m.role === 'OWNER')
  const isOwner = user?.id === owner?.userId

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-900">Team Roster</h1>
        <p className="text-indigo-700">Manage your project members and ownership.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-indigo-50 border-l-4 border-yellow-400 rounded-r-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4">Project Members</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-indigo-200 text-indigo-900 font-medium">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.userId} className="border-b border-indigo-100 hover:bg-indigo-100/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-indigo-900">
                        {member.name}
                        {member.userId === user?.id && <span className="ml-2 text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">You</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          member.role === 'OWNER' ? 'bg-yellow-200 text-yellow-800' : 'bg-indigo-200 text-indigo-700'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-indigo-600 text-sm">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {member.role !== 'OWNER' && member.userId !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="py-8 text-center text-indigo-500 italic">No members found in the roster.</p>
              )}
            </div>
          </div>
        </div>

        {/* Ownership Transfer Section */}
        <div className="space-y-6">
          <div className="bg-indigo-50 border-l-4 border-yellow-400 rounded-r-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4">Transfer Ownership</h2>
            <p className="text-sm text-indigo-700 mb-6">
              Transfer the Project Lead status to another member. This action is permanent and you will lose administrative control.
            </p>

            {!isOwner ? (
              <div className="p-4 bg-indigo-100 text-indigo-800 rounded-lg text-sm text-center font-medium">
                Only the current owner can transfer ownership.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-900 mb-1">Select New Owner</label>
                  <select
                    value={transferringTo}
                    onChange={(e) => setTransferringTo(e.target.value)}
                    className="w-full p-2 rounded border border-indigo-200 bg-white text-indigo-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  >
                    <option value="">-- Choose Member --</option>
                    {members
                      .filter(m => m.userId !== user?.id)
                      .map(m => (
                        <option key={m.userId} value={m.userId}>{m.name} ({m.role})</option>
                      ))
                    }
                  </select>
                </div>
                <button
                  onClick={handleTransferOwnership}
                  disabled={!transferringTo}
                  className="w-full py-2 px-4 bg-indigo-900 text-white font-bold rounded hover:bg-indigo-800 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                  Transfer Ownership
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
