import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, Check, MessageSquare, MoreHorizontal, UserX, Clock, UserPlus } from 'lucide-react'
import { api } from '../api'

export default function Connections() {
  const [connections, setConnections] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('connections')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'name'

  const loadData = async () => {
    try {
      const [conns, received, sent] = await Promise.all([
        api.listConnections().catch(() => []),
        api.listConnectionRequests('received').catch(() => []),
        api.listConnectionRequests('sent').catch(() => [])
      ])
      setConnections(conns || [])
      setPendingRequests((received || []).filter(r => r.status === 'PENDING'))
      setSentRequests((sent || []).filter(r => r.status === 'PENDING'))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return
    try {
      await api.removeConnection(connectionId)
      setConnections(connections.filter(c => c.connection_id !== connectionId))
      setOpenDropdownId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const respondToRequest = async (id, status) => {
    try {
      await api.respondToConnectionRequest(id, status)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleWithdrawRequest = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this connection request?')) return
    try {
      await api.withdrawConnectionRequest(id)
      setSentRequests(sentRequests.filter(r => r.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredConnections = connections.filter(c => {
    if (!c.user) return false;
    const query = searchQuery.toLowerCase();
    const nameMatch = c.user.full_name?.toLowerCase().includes(query) || false;
    const branchMatch = c.user.branch?.toLowerCase().includes(query) || false;
    const headlineMatch = c.user.headline?.toLowerCase().includes(query) || false;
    return nameMatch || branchMatch || headlineMatch;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.user?.full_name || '').localeCompare(b.user?.full_name || '')
    }
    return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="max-w-4xl ml-3 pb-16 pt-2">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Find Your People</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Connect, collaborate, and build together.
          </p>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'connections'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'invitations'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Invitations {pendingRequests.length > 0 && <span className="ml-1 px-2 py-0.5 text-xs bg-brand-100 text-brand-800 rounded-full">{pendingRequests.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Requests({sentRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading network data...
        </div>
      ) : (
        <div>
          {/* CONNECTIONS TAB (LinkedIn Style Row List) */}
          {activeTab === 'connections' && (
            <div className="bg-white rounded-xl border border-slate-200  shadow-sm">
              {/* Filter / Search Control Bar matching LinkedIn UI */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 cursor-pointer focus:outline-none"
                  >
                    <option value="recent">Recently added</option>
                    <option value="name">First name</option>
                  </select>
                </div>

                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Search by name or branch..."
                    className="input !pl-9 !py-1.5 text-xs sm:text-sm bg-white border-slate-300 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Connections List */}
              {connections.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-500 mb-4">You haven't connected with anyone on campus yet.</p>
                  <Link to="/talent" className="btn-primary inline-flex items-center gap-2 text-sm !px-5">
                    <UserPlus size={16} /> Find Talent
                  </Link>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No connections match "{searchQuery}".
                </div>
              ) : (
                <div className="divide-y-2 divide-gray-300">
                  {filteredConnections.map((c) => {
                    const person = c.user
                    if (!person) return null
                    const initials = person.full_name
                      ? person.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
                      : '?'

                    return (
                      <div key={c.connection_id} className="p-4 sm:p-5 flex items-start justify-between gap-4 border-b-2 border-gray-300 hover:bg-slate-50/70 transition">
                        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                          {person.avatar_url ? (
                            <img
                              src={person.avatar_url}
                              alt={person.full_name}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base hover:text-brand-700 cursor-pointer truncate">
                              {person.full_name}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-0.5">
                              {person.headline ? person.headline : `${person.branch || 'Student'} · Class of ${person.graduation_year || '2026'}`}
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                              Connected on {formatDate(c.created_at || c.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 relative">
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === c.connection_id ? null : c.connection_id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                              title="More options"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {openDropdownId === c.connection_id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                                <button
                                  onClick={() => handleRemoveConnection(c.connection_id)}
                                  className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                >
                                  <UserX size={14} /> Remove connection
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* INVITATIONS (RECEIVED REQUESTS) TAB */}
          {activeTab === 'invitations' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 text-sm">
                  Pending Invitations ({pendingRequests.length})
                </h2>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No pending connection requests.
                </div>
              ) : (
                <div className="divide-y-2 divide-gray-300">
                  {pendingRequests.map((req) => {
                    const person = req.requester
                    if (!person) return null
                    const initials = person.full_name
                      ? person.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
                      : '?'

                    return (
                      <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-gray-300 hover:bg-slate-50/70 transition">
                        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.full_name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{person.full_name}</h3>
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-0.5">
                              {person.headline ? person.headline : `${person.branch || 'Student'} · Class of ${person.graduation_year || '2026'}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => respondToRequest(req.id, 'DECLINED')}
                            className="px-4 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition text-xs sm:text-sm font-semibold"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={() => respondToRequest(req.id, 'ACCEPTED')}
                            className="px-4 py-1.5 rounded-full bg-brand-700 text-white hover:bg-brand-800 transition text-xs sm:text-sm font-semibold flex items-center gap-1"
                          >
                            <Check size={15} /> Accept
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* SENT REQUESTS (PENDING SENT) TAB */}
          {activeTab === 'sent' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 text-sm">
                  Pending Sent Requests ({sentRequests.length})
                </h2>
              </div>

              {sentRequests.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  You haven't sent any pending connection requests.
                </div>
              ) : (
                <div className="divide-y-2 divide-gray-300">
                  {sentRequests.map((req) => {
                    const person = req.recipient
                    if (!person) return null
                    const initials = person.full_name
                      ? person.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
                      : '?'

                    return (
                      <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-gray-300 hover:bg-slate-50/70 transition">
                        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.full_name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{person.full_name}</h3>
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-0.5">
                              {person.headline ? person.headline : `${person.branch || 'Student'} · Class of ${person.graduation_year || '2026'}`}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock size={12} /> Request sent on {formatDate(req.created_at || req.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleWithdrawRequest(req.id)}
                            className="px-4 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 transition text-xs sm:text-sm font-semibold"
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
