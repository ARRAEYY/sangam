import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Briefcase, ChevronRight, CheckCircle2, Circle, Lightbulb, MapPin, Loader2, Play } from 'lucide-react';
import { api } from '../api';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function ProjectDetailModal({ isOpen, onClose, projectPreview }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && projectPreview?.id) {
      setLoading(true);
      setError(null);
      api.getProject(projectPreview.id)
        .then(data => setProject(data))
        .catch(err => setError(err.message || "Failed to load project details"))
        .finally(() => setLoading(false));
    } else {
      setProject(null);
    }
  }, [isOpen, projectPreview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm sm:p-4">
      
      {/* Click outside to close (desktop only) */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />
      
      {/* Modal Container - Slides in from right */}
      <div className="relative w-full h-full sm:w-[500px] sm:max-w-full bg-[#fffaf7] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-[#2a2a2a]/10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Project Details</span>
            <span className="text-sm font-medium text-[#7f1d3b]">Sangam Studio</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#7f1d3b]">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm text-[#2a2a2a]/60">Loading project data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <p>{error}</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                Close
              </button>
            </div>
          ) : project ? (
            <div className="p-6 space-y-8 pb-32">
              
              {/* Hero Section */}
              <section className="space-y-4">
                {project.time_horizon && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#2a2a2a]/10 rounded-md shadow-sm">
                    <Calendar size={14} className="text-[#7f1d3b]" />
                    <span className="text-xs font-medium text-[#2a2a2a]/80 uppercase tracking-wide">{project.time_horizon}</span>
                  </div>
                )}
                
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2a2a2a] leading-tight">
                  {project.title}
                </h1>
                
                {project.short_description && (
                  <p className="text-lg text-[#2a2a2a]/70 font-medium leading-relaxed">
                    {project.short_description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-[#7f1d3b]/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    {project.owner?.avatar_url ? (
                      <img src={project.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#7f1d3b] font-medium text-sm">
                        {getInitials(project.owner?.full_name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#2a2a2a]">Led by {project.owner?.full_name}</div>
                    {project.owner?.headline && (
                      <div className="text-xs text-[#2a2a2a]/60 line-clamp-1">{project.owner.headline}</div>
                    )}
                  </div>
                </div>
              </section>

              {/* Detailed Description */}
              {project.description && (
                <section>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Lightbulb size={14} /> The Vision
                  </h3>
                  <div className="prose prose-sm prose-slate max-w-none bg-white p-5 rounded-2xl border border-slate-100 shadow-sm leading-relaxed text-[#2a2a2a]/80 whitespace-pre-wrap">
                    {project.description}
                  </div>
                </section>
              )}

              {/* Skills & Tech */}
              {(project.required_skills?.length > 0 || project.tech_stack?.length > 0) && (
                <section className="space-y-4">
                  {project.required_skills?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Briefcase size={14} /> Skills Needed
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {project.required_skills.map(s => (
                          <span key={s.id} className="px-3 py-1.5 bg-[#7f1d3b] text-white text-xs font-medium rounded-full shadow-sm">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.tech_stack?.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">
                        Tech Stack / Tools
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.map((tech, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-full shadow-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Open Roles */}
              {project.open_roles?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Users size={14} /> Open Roles
                  </h3>
                  <div className="space-y-2">
                    {project.open_roles.map((role, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <span className="font-medium text-[#2a2a2a]">{role.title}</span>
                        <span className="text-xs font-medium text-[#7f1d3b] bg-[#7f1d3b]/10 px-2 py-1 rounded-md">
                          {role.count} needed
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Milestones */}
              {project.milestones?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Play size={14} /> The Plan
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-6">
                    {project.milestones.map((ms, i) => (
                      <div key={ms.id} className="relative pl-6">
                        {/* Timeline line */}
                        {i < project.milestones.length - 1 && (
                          <div className="absolute left-[7px] top-6 bottom-[-24px] w-[2px] bg-slate-100" />
                        )}
                        
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1 w-4 h-4 bg-white border-2 border-[#7f1d3b] rounded-full z-10" />
                        
                        <div className="font-medium text-[#2a2a2a] leading-tight">{ms.title}</div>
                        {ms.description && (
                          <div className="text-sm text-slate-500 mt-1">{ms.description}</div>
                        )}
                        {ms.due_date && (
                          <div className="text-xs font-medium text-[#7f1d3b] mt-2">
                            Target: {new Date(ms.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Current Team */}
              {project.members?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">
                    Current Team ({project.members.length}/{project.team_size_needed})
                  </h3>
                  <div className="grid gap-3">
                    {project.members.map(m => (
                      <div key={m.user_id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          {m.user?.avatar_url ? (
                            <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                              {getInitials(m.user?.full_name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[#2a2a2a] text-sm">{m.user?.full_name}</div>
                          <div className="text-xs text-[#7f1d3b] font-medium">{m.role} {m.is_lead && " (Lead)"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          ) : (
            <div className="p-8 text-center text-[#2a2a2a]/60">
              Project not found.
            </div>
          )}
        </div>
        
        {/* Bottom Actions */}
        {project && (
          <div className="shrink-0 p-4 border-t border-[#2a2a2a]/10 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            <button className="w-full py-3 bg-[#7f1d3b] text-[#fffaf7] rounded-xl font-medium hover:bg-[#6a1730] transition-colors shadow-sm flex items-center justify-center gap-2">
              Apply to join <ChevronRight size={16} />
            </button>
            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {project.member_count} / {project.team_size_needed} members • {project.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
