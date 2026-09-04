import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X as XIcon, Calendar, Users, Briefcase, CheckCircle2, Loader2, Sparkles, AlertCircle, Edit2, Plus, Flag, Trash2, Check, Clock, Play } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { MemberPickerModal } from './MemberPickerModal.jsx';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function ProjectDetailModal({ isOpen, onClose, projectPreview }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [applyStatus, setApplyStatus] = useState('idle');
  const [applyError, setApplyError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', team_size_needed: '', looking_for: '', expectations: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Milestones state
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', status: 'NOT_STARTED' });

  // Members state
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Handle scroll locking when modal opens
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && projectPreview?.id) {
      setLoading(true);
      setError(null);
      setApplyStatus('idle');
      fetchProject().finally(() => setLoading(false));
    } else {
      setProject(null);
      setIsEditing(false);
      setIsAddingMilestone(false);
    }
  }, [isOpen, projectPreview, user]);

  const isOwner = user && project && (project.owner_id === user.id || project.owner?.id === user.id);

  const fetchProject = async () => {
    try {
      const data = await api.getProject(projectPreview.id);
      setProject(data);
      if (data.status !== 'OPEN') {
        setApplyStatus('closed');
      } else if (user && (data.owner_id === user.id || data.members?.some(m => m.user_id === user.id))) {
        setApplyStatus('already_member');
      }
    } catch (err) {
      setError(err.message || "Failed to load project details");
    }
  };

  useEffect(() => {
    if (isOpen && projectPreview?.id) {
      setLoading(true);
      setError(null);
      setApplyStatus('idle');
      fetchProject().finally(() => setLoading(false));
    } else {
      setProject(null);
      setIsEditing(false);
      setIsAddingMilestone(false);
    }
  }, [isOpen, projectPreview, user]);

  const handleApply = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (applyStatus !== 'idle' && applyStatus !== 'error') return;

    setApplyStatus('loading');
    setApplyError('');
    try {
      await api.applyToProject(project.id, { pitch_message: "I'd love to join the team and contribute my skills." });
      setApplyStatus('success');
    } catch (err) {
      if (err.status === 409) {
        setApplyStatus('already_applied');
      } else {
        setApplyStatus('error');
        setApplyError(err.message || 'Failed to apply. Please try again.');
      }
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await api.editProject(project.id, {
        title: editForm.title,
        description: editForm.description,
        looking_for: editForm.looking_for,
        expectations: editForm.expectations || null,
        team_size_needed: Number(editForm.team_size_needed)
      });
      await fetchProject();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save project: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    try {
      await api.addMilestone(project.id, { ...newMilestone });
      setNewMilestone({ title: '', description: '', status: 'NOT_STARTED' });
      setIsAddingMilestone(false);
      fetchProject();
    } catch (err) {
      alert('Failed to add milestone: ' + err.message);
    }
  };

  const handleUpdateMilestoneStatus = async (mid, newStatus) => {
    try {
      await api.updateMilestone(project.id, mid, { status: newStatus });
      fetchProject();
    } catch (err) {
      alert('Failed to update milestone: ' + err.message);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      await api.addProjectMember(project.id, {
        user_id: memberData.user_id,
        role: memberData.role,
        role_category: memberData.role_category
      });
      fetchProject();
    } catch (err) {
      alert('Failed to add member: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const renderActionButtons = (isDesktop) => {
    if (!project) return null;
    
    if (isOwner) {
      return (
        <div className={`shrink-0 ${isDesktop ? 'hidden sm:block' : 'w-full sm:hidden'}`}>
           <button
            type="button"
            className={`btn-secondary w-full flex items-center justify-center gap-2 ${isDesktop ? 'h-9 px-4 rounded-full text-xs font-semibold' : 'h-10 rounded-lg text-sm font-medium'}`}
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                setEditForm({ title: project.title, description: project.description || '', team_size_needed: project.team_size_needed || 1, looking_for: project.looking_for || '', expectations: project.expectations || '' });
                setIsEditing(true);
              }
            }}
          >
            <Edit2 size={16} /> {isEditing ? 'Cancel Edit' : 'Edit Project'}
          </button>
        </div>
      );
    }

    return (
      <div className={`shrink-0 ${isDesktop ? 'hidden sm:block' : 'w-full sm:hidden'}`}>
        {applyStatus === 'success' || applyStatus === 'already_applied' ? (
          <span className={`flex items-center justify-center gap-2 px-4 text-xs font-semibold text-emerald-600 bg-emerald-50 ${isDesktop ? 'h-9 rounded-full border border-emerald-100 shadow-sm' : 'h-10 rounded-lg'}`}>
            <CheckCircle2 size={16} /> Application sent
          </span>
        ) : applyStatus === 'already_member' ? (
          <span className={`flex items-center justify-center gap-2 px-4 text-xs font-semibold text-slate-600 bg-slate-50 ${isDesktop ? 'h-9 rounded-full border border-slate-200 shadow-sm' : 'h-10 rounded-lg border border-slate-200'}`}>
            <Users size={16} /> You're on the team
          </span>
        ) : applyStatus === 'closed' ? (
          <span className={`flex items-center justify-center gap-2 px-4 text-xs font-semibold text-slate-400 bg-slate-100 ${isDesktop ? 'h-9 rounded-full shadow-sm' : 'h-10 rounded-lg'}`}>
            Applications closed
          </span>
        ) : (
          <div className="relative">
            <button
              type="button"
              className={`btn-primary w-full ${isDesktop ? '!px-4 !py-2 shadow-sm hover:shadow-md' : '!px-5'}`}
              onClick={handleApply}
              disabled={applyStatus === 'loading'}
            >
              {applyStatus === 'loading' ? (
                <Loader2 size={16} className="inline-block mr-1.5 -mt-0.5 animate-spin" />
              ) : (
                <Sparkles size={16} className="inline-block mr-1.5 -mt-0.5" />
              )}
              {applyStatus === 'loading' ? 'Applying...' : 'Apply to join'}
            </button>
            {applyError && !isDesktop && <p className="mt-1.5 text-center text-xs text-red-500">{applyError}</p>}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">

        {/* Top Right Actions */}
                {/* Top Right Actions */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {isOwner && project && (
            <button
              onClick={() => {
                onClose();
                navigate(`/projects/${project.id}/edit`);
              }}
              className="p-2 text-slate-400 hover:text-[#7f1d3b] bg-slate-100 hover:bg-[#7f1d3b]/10 rounded-full shadow-sm transition-colors"
              title="Edit Project"
            >
              <Edit2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full shadow-sm transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 overscroll-contain">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Loader2 size={32} className="animate-spin mb-4 text-slate-300" />
              <p className="text-sm">Loading project details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle size={40} className="text-red-400 mb-4" />
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : project ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pr-10">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-full">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="text-2xl font-display font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full mb-2"
                        placeholder="Project Title"
                      />
                    ) : (
                      <h2 className="text-2xl font-display font-semibold text-slate-900">{project.title}</h2>
                    )}
                    <p className="text-sm text-slate-600 mt-0.5">Posted by {project.owner?.full_name}</p>
                    {isEditing ? (
                      <div className="mt-2 space-y-3">
                        <input
                          type="text"
                          value={editForm.looking_for || ''}
                          onChange={(e) => setEditForm({...editForm, looking_for: e.target.value})}
                          className="text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full"
                          placeholder="Looking for (e.g. Frontend Developer)"
                        />
                        <textarea
                          value={editForm.expectations || ''}
                          onChange={(e) => setEditForm({...editForm, expectations: e.target.value})}
                          className="text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full"
                          placeholder="Expectations from applicants (e.g. comfortable with React)"
                          rows={2}
                        />
                      </div>
                    ) : (
                      project.looking_for && (
                        <div className="mt-2">
                          <div className="text-sm">
                            <span className="font-bold text-slate-900 mr-1.5">Looking for:</span>
                            <span className="font-bold text-[#7f1d3b]">{project.looking_for}</span>
                          </div>
                          {project.expectations && (
                            <div className="mt-6 mb-2">
                              <h3 className="text-sm font-semibold text-slate-900 mb-2">Expectations</h3>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.expectations}</p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                    {project.time_horizon && (
                      <p className="text-sm text-slate-500 mt-0.5">{project.time_horizon}</p>
                    )}
                  </div>
                </div>
                {renderActionButtons(true)}
              </div>

              {/* Mobile Apply Button */}
              <div className="mb-6">
                {renderActionButtons(false)}
              </div>

              {/* Detailed Vision (About) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Vision</h3>
                  <span className={`pill text-[10px] py-0.5 ${project.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                {isEditing ? (
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
                    placeholder="Describe your vision..."
                  />
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.description || project.short_description || 'No detailed description provided.'}</p>
                )}
              </div>

              {isEditing && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Team Size Needed</h3>
                  <input 
                    type="number" 
                    min="1"
                    value={editForm.team_size_needed}
                    onChange={(e) => setEditForm({...editForm, team_size_needed: e.target.value})}
                    className="w-24 bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm text-slate-700"
                  />
                </div>
              )}

              {isEditing && (
                <div className="mb-8 flex justify-end gap-3">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-[#7f1d3b] rounded-lg hover:bg-[#6a1730] transition-colors flex items-center gap-2">
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
              {/* Skills & Tech Stack */}
              {(project.required_skills?.length > 0 || project.tech_stack?.length > 0) && (
                <div className="mb-8 space-y-4">
                  {project.required_skills?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">General Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {project.required_skills.map((s) => (
                          <span key={s.id || s.name} className="pill bg-slate-100 text-slate-600">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.tech_stack?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Tech Stack</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech_stack.map((t) => (
                          <span key={t} className="pill border border-slate-200 text-slate-600">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(project.milestones?.length > 0 || isOwner) && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Flag size={16} className="text-slate-400" /> Milestones
                  </h3>
                  {isOwner && !isAddingMilestone && (
                    <button onClick={() => setIsAddingMilestone(true)} className="text-[11px] font-bold text-[#7f1d3b] hover:underline flex items-center gap-1">
                      <Plus size={14} /> Add Milestone
                    </button>
                  )}
                </div>

                {isAddingMilestone && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4">
                    <input 
                      type="text" 
                      placeholder="Milestone Title" 
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-slate-300"
                    />
                    <textarea 
                      placeholder="Description (optional)"
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 h-20 focus:outline-none focus:border-slate-300"
                    />
                    <div className="flex justify-between items-center mb-3 mt-3">
                      <select 
                        value={newMilestone.status}
                        onChange={(e) => setNewMilestone({...newMilestone, status: e.target.value})}
                        className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 outline-none"
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">Working</option>
                        <option value="COMPLETED">Done</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => setIsAddingMilestone(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300">Cancel</button>
                        <button onClick={handleAddMilestone} disabled={!newMilestone.title.trim()} className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700 disabled:opacity-50">Save Milestone</button>
                      </div>
                    </div>
                  </div>
                )}

                {project.milestones?.length > 0 ? (
                  <div className="space-y-3">
                    {project.milestones.sort((a, b) => a.order_index - b.order_index).map(ms => (
                      <div key={ms.id} className="flex gap-4 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                        <div className="pt-0.5">
                          {ms.status === 'COMPLETED' ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : ms.status === 'IN_PROGRESS' ? (
                            <Play size={18} className="text-amber-500" />
                          ) : ms.status === 'BLOCKED' ? (
                            <AlertCircle size={18} className="text-red-500" />
                          ) : (
                            <Clock size={18} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${ms.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{ms.title}</h4>
                          {ms.description && <p className="text-xs text-slate-500 mt-1">{ms.description}</p>}
                        </div>
                        {isOwner && (
                          <div className="flex flex-col gap-1">
                            <select 
                              value={ms.status}
                              onChange={(e) => handleUpdateMilestoneStatus(ms.id, e.target.value)}
                              className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-600 outline-none"
                            >
                              <option value="NOT_STARTED">Not Started</option>
                              <option value="IN_PROGRESS">Working</option>
                              <option value="COMPLETED">Done</option>
                              <option value="BLOCKED">Blocked</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No milestones set yet.</p>
                )}
              </div>

              )}
              {/* Team Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" /> Current Team
                  </h3>
                  {isOwner && (
                    <button onClick={() => setIsAddingMember(true)} className="text-[11px] font-bold text-[#7f1d3b] hover:underline flex items-center gap-1">
                      <Plus size={14} /> Add Member
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Members */}
                  {project.members?.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="w-10 h-10 rounded-full bg-[#7f1d3b]/10 text-[#7f1d3b] flex items-center justify-center text-sm font-medium overflow-hidden shrink-0">
                        {m.user?.avatar_url ? (
                          <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(m.user?.full_name)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{m.user?.full_name}</p>
                        <p className="text-xs text-[#7f1d3b] font-medium mt-0.5 truncate">{m.role || 'Member'}</p>
                      </div>
                    </div>
                  ))}

                  {/* Open Slots */}
                  {Array.from({ length: Math.max(0, (project.team_size_needed || 1) - 1 - (project.members?.length || 0)) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Users size={16} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-400">Open Position</p>
                        <p className="text-xs text-slate-400 mt-0.5">Looking for talent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      
      {/* Member Picker Modal */}
      {isOwner && (
        <MemberPickerModal 
          isOpen={isAddingMember}
          onClose={() => setIsAddingMember(false)}
          onAddMember={handleAddMember}
          excludeUserIds={[project.owner?.id || project.owner_id, ...(project.members?.map(m => m.user_id) || [])]}
        />
      )}
    </div>,
    document.body
  );
}
