import React, { useEffect, useState } from 'react';
import { X, GraduationCap, Briefcase, FolderOpen } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return 'Present';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function TalentModal({ isOpen, onClose, talentId }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !talentId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadProfile = async () => {
      try {
        const data = await api.getUserPublicProfile(talentId, token);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => { isMounted = false; };
  }, [isOpen, talentId, token]);

  if (!isOpen) return null;

  // Derive top-level details similar to the card
  let degree = "Student";
  let year = "";
  if (profile?.educations && profile.educations.length > 0) {
    degree = profile.educations[0].degree || profile.educations[0].branch || degree;
    if (profile.educations[0].graduation_year) {
      year = `Class of ${profile.educations[0].graduation_year}`;
    }
  } else if (profile?.branch) {
    degree = profile.branch;
    if (profile.graduation_year) year = `Class of ${profile.graduation_year}`;
  }

  const initials = getInitials(profile?.full_name);
  const tone = 'maroon'; // Or pick randomly/based on id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading profile...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : profile ? (
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-[18px] bg-slate-100 text-slate-700`}>
                {initials}
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-slate-800 leading-tight mb-1">{profile.full_name}</h2>
                <p className="text-[13px] text-slate-500">
                  {degree} {year && `· ${year}`}
                </p>
              </div>
            </div>

            {/* About */}
            {profile.headline && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-800 mb-2">About</h3>
                <p className="text-[14px] text-slate-600 font-display leading-relaxed">
                  {profile.headline}
                </p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => {
                    const skillName = typeof s === 'string' ? s : s.name;
                    return (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100">
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Projects / Memberships */}
            {profile.memberships && profile.memberships.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <FolderOpen size={16} className="text-slate-400" />
                  Projects
                </h3>
                <div className="space-y-3">
                  {profile.memberships.map((m, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[14px] text-slate-800">{m.project?.title || 'Unknown Project'}</h4>
                        <p className="text-[12px] text-slate-500 mt-1">{m.role || 'Member'} · Joined {formatDate(m.joined_at)}</p>
                      </div>
                      {m.project?.status === 'OPEN' && (
                        <span className="px-2.5 py-1 rounded-full border border-slate-200 text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                          Open
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.educations && profile.educations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-slate-400" />
                  Education
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-y-2 before:left-[5px] before:w-px before:bg-slate-100">
                  {profile.educations.map((edu, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white"></div>
                      <h4 className="font-bold text-[14px] text-slate-800">{edu.degree || edu.branch}</h4>
                      <p className="text-[13px] text-slate-600 mt-0.5">{edu.institution_name}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{edu.start_year || ''} {edu.graduation_year ? `- ${edu.graduation_year}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Briefcase size={16} className="text-slate-400" />
                  Experience
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-y-2 before:left-[5px] before:w-px before:bg-slate-100">
                  {profile.experiences.map((exp, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white"></div>
                      <h4 className="font-bold text-[14px] text-slate-800">{exp.title}</h4>
                      <p className="text-[13px] text-[#7f1d3b] mt-0.5">{exp.company}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{formatDate(exp.start_date)} - {formatDate(exp.end_date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        ) : null}
      </div>
    </div>
  );
}
