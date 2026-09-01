import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, UserPlus } from 'lucide-react';
import { api } from '../api';

export function MemberPickerModal({ isOpen, onClose, onAddMember, excludeUserIds = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State for the selected user to assign a role to
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState("");
  const [roleCategory, setRoleCategory] = useState("OTHER");

  useEffect(() => {
    if (!query || selectedUser) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchUsers(query);
        // Filter out already added members
        const filtered = data.users.filter(u => !excludeUserIds.includes(u.id));
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeUserIds, selectedUser]);

  if (!isOpen) return null;

  function handleSelectUser(user) {
    setSelectedUser(user);
    setRole("");
    setRoleCategory("OTHER");
  }

  function handleAdd() {
    if (!selectedUser || !role.trim()) return;
    onAddMember({
      user_id: selectedUser.id,
      user: selectedUser,
      role: role.trim(),
      role_category: roleCategory,
      status: 'ACTIVE'
    });
    // Reset state for next use
    setSelectedUser(null);
    setQuery("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-[#2a2a2a]/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[#2a2a2a]/10 flex items-center justify-between bg-[#fffaf7]">
          <h2 className="text-lg font-medium text-[#2a2a2a]">
            {selectedUser ? "Assign Role" : "Add Team Member"}
          </h2>
          <button onClick={onClose} className="p-2 text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {!selectedUser ? (
          <>
            <div className="p-4 border-b border-[#2a2a2a]/10 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/40" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, handle, or skills..."
                  className="w-full pl-10 pr-4 py-2 bg-[#fffaf7] border border-[#2a2a2a]/10 rounded-xl focus:outline-none focus:border-[#7f1d3b]/30 focus:ring-1 focus:ring-[#7f1d3b]/30 text-[#2a2a2a] placeholder-[#2a2a2a]/40 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#7f1d3b] animate-spin" />
                </div>
              ) : results.length > 0 ? (
                results.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fffaf7] rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#7f1d3b]/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#7f1d3b] font-medium text-sm">
                          {user.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#2a2a2a] font-medium truncate">{user.full_name}</div>
                      <div className="text-[#2a2a2a]/60 text-xs truncate">{user.headline || 'No headline'}</div>
                    </div>
                    <UserPlus size={18} className="text-[#7f1d3b] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : query ? (
                <div className="py-8 text-center text-[#2a2a2a]/40">
                  No users found matching "{query}"
                </div>
              ) : (
                <div className="py-8 text-center text-[#2a2a2a]/40 text-sm">
                  Search to find people to add to your team
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 bg-[#fffaf7] rounded-xl border border-[#2a2a2a]/10">
              <div className="w-12 h-12 rounded-full bg-[#7f1d3b]/10 flex items-center justify-center overflow-hidden shrink-0">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#7f1d3b] font-medium text-lg">
                    {selectedUser.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-[#2a2a2a]">{selectedUser.full_name}</div>
                <div className="text-sm text-[#2a2a2a]/60 line-clamp-1">{selectedUser.headline}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2a2a2a]/80 mb-1">
                  Project Role <span className="text-[#7f1d3b]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead Designer"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#2a2a2a]/20 rounded-xl focus:outline-none focus:border-[#7f1d3b]/50 focus:ring-1 focus:ring-[#7f1d3b]/50 text-[#2a2a2a]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2a2a2a]/80 mb-1">
                  Role Category
                </label>
                <select
                  value={roleCategory}
                  onChange={e => setRoleCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#2a2a2a]/20 rounded-xl focus:outline-none focus:border-[#7f1d3b]/50 focus:ring-1 focus:ring-[#7f1d3b]/50 text-[#2a2a2a] appearance-none"
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="DESIGNER">Designer</option>
                  <option value="PRODUCT">Product Manager</option>
                  <option value="ADVISOR">Advisor / Mentor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 bg-[#2a2a2a]/5 text-[#2a2a2a] rounded-xl font-medium hover:bg-[#2a2a2a]/10 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAdd}
                disabled={!role.trim()}
                className="flex-1 py-2.5 bg-[#7f1d3b] text-[#fffaf7] rounded-xl font-medium hover:bg-[#6a1730] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Team
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
