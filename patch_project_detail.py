import re

with open('frontend/src/pages/ProjectDetail.jsx', 'r') as f:
    content = f.read()

# 1. Add MILESTONE_STATUS_LABELS
labels_code = """const MILESTONE_STATUS_PILLS = {
  NOT_STARTED: 'bg-slate-100 text-slate-500',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-600',
}

const MILESTONE_STATUS_LABELS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'Working',
  COMPLETED: 'Done',
  BLOCKED: 'Blocked',
}"""
content = content.replace("const MILESTONE_STATUS_PILLS = {\n  NOT_STARTED: 'bg-slate-100 text-slate-500',\n  IN_PROGRESS: 'bg-brand-50 text-brand-600',\n  COMPLETED: 'bg-emerald-50 text-emerald-700',\n  BLOCKED: 'bg-red-50 text-red-600',\n}", labels_code)

# 2. Update milestoneForm initial state
content = content.replace(
    "const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '' })",
    "const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '', status: 'NOT_STARTED' })"
)

# 3. Update handleCreateMilestone
create_logic_old = """      await api.createMilestone(id, {
        title: milestoneForm.title,
        description: milestoneForm.description || undefined,
        due_date: milestoneForm.due_date || undefined,
      })
      await refreshMilestones()
      setShowMilestoneForm(false)
      setMilestoneForm({ title: '', description: '', due_date: '' })"""
create_logic_new = """      await api.createMilestone(id, {
        title: milestoneForm.title,
        description: milestoneForm.description || undefined,
        due_date: milestoneForm.due_date || undefined,
        status: milestoneForm.status,
      })
      await refreshMilestones()
      setShowMilestoneForm(false)
      setMilestoneForm({ title: '', description: '', due_date: '', status: 'NOT_STARTED' })"""
content = content.replace(create_logic_old, create_logic_new)

# 4. Add handleUpdateMilestone
update_func = """
  const handleUpdateMilestone = async (e) => {
    e.preventDefault()
    try {
      await api.updateMilestone(id, editingMilestone.id, {
        title: editingMilestone.title,
        description: editingMilestone.description || undefined,
        due_date: editingMilestone.due_date || undefined,
        status: editingMilestone.status,
      })
      await refreshMilestones()
      setEditingMilestone(null)
    } catch (err) {
      setError(err.message)
    }
  }
"""
content = content.replace(
    "  const handleToggleMilestone = async (milestone) => {",
    update_func + "\n  const handleToggleMilestone = async (milestone) => {"
)

# 5. Add status dropdown to CREATE form
create_form_old = """            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Due date (optional)</label>
                <input
                  type="date"
                  className="input !py-1.5 text-sm"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                />
              </div>
              <button className="btn-primary !py-1.5 !text-sm">Create Milestone</button>
              <button type="button" onClick={() => setShowMilestoneForm(false)} className="btn-secondary !py-1.5 !text-sm">Cancel</button>
            </div>"""
create_form_new = """            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Due date (optional)</label>
                <input
                  type="date"
                  className="input !py-1.5 text-sm"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Status</label>
                <select
                  className="input !py-1.5 text-sm outline-none bg-white"
                  value={milestoneForm.status}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">Working</option>
                  <option value="COMPLETED">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
              <button className="btn-primary !py-1.5 !text-sm">Create Milestone</button>
              <button type="button" onClick={() => setShowMilestoneForm(false)} className="btn-secondary !py-1.5 !text-sm">Cancel</button>
            </div>"""
content = content.replace(create_form_old, create_form_new)

# 6. Replace map with editing condition
map_old = """            {milestones.map((m) => (
              <div key={m.id} className="card p-4">"""

map_new = """            {milestones.map((m) => (
              editingMilestone?.id === m.id ? (
                <form key={m.id} onSubmit={handleUpdateMilestone} className="card p-4 space-y-3">
                  <input
                    required
                    className="input"
                    placeholder="Milestone title"
                    value={editingMilestone.title}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  />
                  <textarea
                    className="input"
                    placeholder="Description (optional)"
                    rows={2}
                    value={editingMilestone.description || ''}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  />
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Due date (optional)</label>
                      <input
                        type="date"
                        className="input !py-1.5 text-sm"
                        value={editingMilestone.due_date || ''}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, due_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status</label>
                      <select
                        className="input !py-1.5 text-sm outline-none bg-white"
                        value={editingMilestone.status}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, status: e.target.value })}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">Working</option>
                        <option value="COMPLETED">Done</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary !py-1.5 !text-sm">Update</button>
                    <button type="button" onClick={() => setEditingMilestone(null)} className="btn-secondary !py-1.5 !text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
              <div key={m.id} className="card p-4">"""
content = content.replace(map_old, map_new)

# 7. Update display label
content = content.replace(
    "{m.status.replace('_', ' ')}",
    "{MILESTONE_STATUS_LABELS[m.status] || m.status.replace('_', ' ')}"
)

# 8. Add Edit button next to Delete button
buttons_old = """                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}"""

buttons_new = """                        <button
                          onClick={() => setEditingMilestone(m)}
                          className="text-slate-400 hover:text-brand-600 p-0.5"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
            ))}"""
# wait the closing is slightly different because of the ternary we added.
# In map_new we added a ternary `editingMilestone?.id === m.id ? (form) : (div...`
# So we need to close the ternary at the end!
# The end was:
#                 </div>
#               </div>
#             ))}
# It should become:
#                 </div>
#               </div>
#               )
#             ))}

content = content.replace(buttons_old, buttons_new)

with open('frontend/src/pages/ProjectDetail.jsx', 'w') as f:
    f.write(content)
