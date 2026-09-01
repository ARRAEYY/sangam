import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, X as XIcon, Briefcase, FolderGit2, GraduationCap, Award, Crown, UserPlus, Pencil } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function TalentModal({ isOpen, onClose, talentId }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [selectedUser, setSelectedUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // To match the master branch connectState behavior (which was in the parent component)
  const [connectState, setConnectState] = useState({});

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
    if (!isOpen || !talentId) {
      setSelectedUser(null);
      return;
    }

    let isMounted = true;
    setProfileLoading(true);

    const loadProfile = async () => {
      try {
        const fullProfile = await api.getUserPublicProfile(talentId, token);
        if (isMounted) setSelectedUser(fullProfile);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, [isOpen, talentId, token]);

  const handleConnect = async () => {
    if (!selectedUser) return;
    try {
      await api.sendConnectionRequest(selectedUser.id, "I'd love to connect with you on Sangam!", token);
      setConnectState(prev => ({ ...prev, [selectedUser.id]: 'sent' }));
    } catch (err) {
      setConnectState(prev => ({ ...prev, [selectedUser.id]: err.message }));
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-50 rounded-2xl shadow-xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          {selectedUser && user && user.id !== selectedUser.id && (
            <div className="shrink-0 hidden sm:block">
              {connectState[selectedUser.id] === 'sent' ? (
                <span className="flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                  <Check size={14} /> Request sent
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-primary !px-4 !py-2 shadow-sm hover:shadow-md"
                  onClick={handleConnect}
                >
                  <UserPlus size={14} className="inline-block mr-1.5 -mt-0.5" />
                  Connect
                </button>
              )}
            </div>
          )}
          {selectedUser && user && user.id === selectedUser.id && (
            <button
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
              className="p-2 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition-colors shadow-sm flex items-center gap-1.5 px-3"
            >
              <Pencil size={15} />
              <span className="text-sm font-semibold hidden sm:block">Edit Profile</span>
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full shadow-sm"
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 sm:p-8 overscroll-contain">
          {profileLoading || !selectedUser ? (
            <p className="text-sm text-slate-500">Loading details...</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">
                      {selectedUser.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-slate-900">{selectedUser.full_name}</h2>
                    <p className="text-sm text-slate-600">{selectedUser.branch} · Class of {selectedUser.graduation_year}</p>
                    {selectedUser.headline && <p className="text-sm text-slate-500 mt-1">{selectedUser.headline}</p>}
                  </div>
                </div>
                {user && user.id !== selectedUser.id && (
                  <div className="shrink-0 w-full sm:hidden">
                    {connectState[selectedUser.id] === 'sent' ? (
                      <span className="flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg">
                        <Check size={16} /> Request sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary w-full !px-5"
                        onClick={handleConnect}
                      >
                        <UserPlus size={16} className="inline-block mr-2 -mt-0.5" />
                        Connect
                      </button>
                    )}
                    {connectState[selectedUser.id] && connectState[selectedUser.id] !== 'sent' && (
                      <p className="mt-1.5 text-center text-xs text-red-500">{connectState[selectedUser.id]}</p>
                    )}
                  </div>
                )}
              </div>
              
              {selectedUser.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">About</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedUser.bio}</p>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.skills?.map((s) => (
                    <span key={s.id || s.name || s} className="pill bg-slate-100 text-slate-600">{typeof s === 'string' ? s : s.name}</span>
                  ))}
                  {(!selectedUser.skills || selectedUser.skills.length === 0) && <span className="text-sm text-slate-500">No skills listed.</span>}
                </div>
              </div>

              {/* Projects First */}
              {selectedUser.project_roles && selectedUser.project_roles.length > 0 ? (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FolderGit2 size={16} className="text-slate-400" /> Projects
                  </h3>
                  <div className="space-y-3">
                    {selectedUser.project_roles.map((pr, idx) => (
                      <div key={idx} className="card p-3.5 bg-slate-50/75 border border-slate-100 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            {pr.project_title}
                            {pr.is_lead && <Crown size={12} className="text-amber-500" title="Project Lead" />}
                          </h4>
                          <p className="text-xs text-brand-700 font-medium mt-0.5">
                            {pr.role}
                          </p>
                          {pr.since && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Member since {new Date(pr.since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <span className="pill text-[10px] bg-white border border-slate-200 text-slate-600 shrink-0">
                          {pr.status === 'ACTIVE' ? pr.project_status : pr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedUser.accepted_projects && selectedUser.accepted_projects.length > 0 ? (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FolderGit2 size={16} className="text-slate-400" /> Projects Working On
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selectedUser.accepted_projects.map((proj) => (
                      <div key={proj.id} className="card p-3 bg-slate-50">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{proj.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Education Second */}
              {selectedUser.educations && selectedUser.educations.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <GraduationCap size={16} className="text-slate-400" /> Education
                  </h3>
                  <div className="flex flex-col gap-4 divide-y divide-slate-100">
                    {selectedUser.educations.map((edu) => (
                      <div key={edu.id} className="pt-4 first:pt-0">
                        <div className="border-l-2 border-[#7f1d3b] pl-4">
                          <h4 className="font-semibold text-slate-800">{edu.degree}</h4>
                          <p className="text-sm font-medium text-[#7f1d3b]">
                            {edu.institution_name || edu.institution}
                            {edu.department ? ` (${edu.department})` : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {edu.start_year} - {edu.graduation_year || 'Present'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Third */}
              {selectedUser.experiences && selectedUser.experiences.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" /> Experience
                  </h3>
                  <div className="flex flex-col gap-4 divide-y divide-slate-100">
                    {selectedUser.experiences.map((exp) => (
                      <div key={exp.id} className="pt-4 first:pt-0">
                        <div className="border-l-2 border-[#7f1d3b] pl-4">
                          <h4 className="font-semibold text-slate-800">{exp.role || exp.title}</h4>
                          <p className="text-sm font-medium text-[#7f1d3b] mb-1">{exp.organization || exp.company}</p>
                          <p className="text-xs text-slate-500 mb-1">
                            {new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} -{' '}
                            {exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Present'}
                          </p>
                          {exp.description && <p className="text-sm text-slate-600 whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements Last */}
              {selectedUser.achievements && selectedUser.achievements.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Award size={16} className="text-slate-400" /> Achievements
                  </h3>
                  <div className="flex flex-col gap-4 divide-y divide-slate-100">
                    {selectedUser.achievements.map((ach) => (
                      <div key={ach.id} className="pt-4 first:pt-0">
                        <div className="border-l-2 border-[#7f1d3b] pl-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800">{ach.title}</h4>
                            <span className="pill bg-brand-50 text-brand-700 text-[10px] py-0.5">{ach.type}</span>
                          </div>
                          {ach.issuer && <p className="text-sm text-slate-600">{ach.issuer}</p>}
                          {ach.description && <p className="text-sm text-slate-600 mt-1">{ach.description}</p>}
                          {ach.url && (
                            <a
                              href={ach.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                            >
                              View Credential →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
