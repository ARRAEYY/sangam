import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X as XIcon, Calendar, Users, Briefcase, CheckCircle2, Loader2, Sparkles, AlertCircle, Play } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function ProjectDetailModal({ isOpen, onClose, projectPreview }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [applyStatus, setApplyStatus] = useState('idle'); // idle, loading, success, error, already_applied, already_member, closed
  const [applyError, setApplyError] = useState('');

  // Fetch project data
  useEffect(() => {
    if (isOpen && projectPreview?.id) {
      setLoading(true);
      setError(null);
      setApplyStatus('idle');
      api.getProject(projectPreview.id, token)
        .then(data => {
          setProject(data);

          // Compute static initial apply states
          if (data.status !== 'OPEN') {
            setApplyStatus('closed');
          } else if (user && (data.owner_id === user.id || data.members?.some(m => m.user_id === user.id))) {
            setApplyStatus('already_member');
          }
        })
        .catch(err => setError(err.message || "Failed to load project details"))
        .finally(() => setLoading(false));
    } else {
      setProject(null);
    }
  }, [isOpen, projectPreview, token, user]);

  const handleApply = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (applyStatus !== 'idle' && applyStatus !== 'error') return;

    setApplyStatus('loading');
    setApplyError('');
    try {
      await api.applyToProject(project.id, { pitch_message: "I'd love to join the team and contribute my skills." }, token);
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

  if (!isOpen) return null;

  const renderApplyButton = (isDesktop) => {
    if (!project) return null;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-50 rounded-2xl shadow-xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">

        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          {renderApplyButton(true)}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full shadow-sm"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8">
          {loading ? (
            <p className="text-sm text-slate-500">Loading project details...</p>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle size={40} className="text-red-400 mb-4" />
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : project ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pr-12">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-slate-900">{project.title}</h2>
                    <p className="text-sm text-slate-600 mt-0.5">Posted by {project.owner?.full_name}</p>
                    {project.time_horizon && (
                      <p className="text-sm text-slate-500 mt-0.5">{project.time_horizon}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Apply Button */}
              <div className="mb-6">
                {renderApplyButton(false)}
              </div>

              {/* Detailed Vision (About) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">Vision</h3>
                  <span className={`pill text-[10px] py-0.5 ${project.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : project.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.description || project.short_description || 'No detailed description provided.'}</p>
              </div>

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
                        {project.tech_stack.map((tech, i) => (
                          <span key={i} className="pill bg-slate-100 text-slate-600">{tech}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Current Team */}
              {project.members?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" /> Current Team
                  </h3>
                  <div className="flex flex-col gap-4 divide-y divide-slate-100">
                    {project.members.map((m) => (
                      <div key={m.user_id} className="pt-4 first:pt-0">
                        <div className="border-l-2 border-[#ffcda3] pl-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800">{m.user?.full_name}</h4>

                          </div>
                          <p className="text-sm text-brand-600">{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Roles */}
              {project.open_roles?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" /> Open Roles
                  </h3>
                  <div className="flex flex-col gap-4 divide-y divide-slate-100">
                    {project.open_roles.map((role, i) => (
                      <div key={i} className="pt-4 first:pt-0">
                        <div className="border-l-2 border-[#ffcda3] pl-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-800">{role.title}</h4>
                            <span className="text-xs text-slate-500">{role.count} needed</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {project.milestones?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Play size={16} className="text-slate-400" /> Milestones
                  </h3>
                  <div className="flex flex-col gap-4 divide-y divide-slate-100">
                    {project.milestones.map((ms) => (
                      <div key={ms.id} className="pt-4 first:pt-0">
                        <div className="border-l-2 border-[#ffcda3] pl-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800">{ms.title}</h4>
                            <span className={`pill text-[10px] py-0.5 ${ms.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : ms.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                              {ms.status.replace('_', ' ')}
                            </span>
                          </div>
                          {ms.due_date && (
                            <p className="text-xs text-slate-500 mt-1">Target: {new Date(ms.due_date).toLocaleDateString()}</p>
                          )}
                          {ms.description && (
                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{ms.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
