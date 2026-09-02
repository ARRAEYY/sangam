import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, Lightbulb, Plus, Sparkles, X, User, Trash2, Search } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { SkillPickerModal } from '../components/SkillPickerModal.jsx';
import { MemberPickerModal } from '../components/MemberPickerModal.jsx';

const DEFAULT_SKILL_OPTIONS = ["Product", "Design", "Engineering", "Research", "Community", "Storytelling", "Climate", "Data"];
const DEFAULT_TECH_OPTIONS = ["React", "Node.js", "Python", "TypeScript", "PostgreSQL", "MongoDB", "AWS", "Figma", "Tailwind CSS"];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data State
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [techStack, setTechStack] = useState([]);

  const [teamMembers, setTeamMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);

  // UI State
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false);
  const [isTechPickerOpen, setIsTechPickerOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);

  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", targetDate: "", status: 'NOT_STARTED' });
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  // Quick toggles for predefined skills
  function toggleQuickSkill(skill) {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  }



  function handleAddMilestone() {
    if (newMilestone.title.trim()) {
      setMilestones([...milestones, { ...newMilestone, title: newMilestone.title.trim() }]);
      setNewMilestone({ title: "", description: "", targetDate: "", status: 'NOT_STARTED' });
      setIsAddingMilestone(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!title.trim() || !shortDescription.trim() || !detailedDescription.trim()) {
      alert("Please fill out the title, short description, and detailed description.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim(),
        description: detailedDescription.trim(),
        skills: selectedSkills,
        tech_stack: techStack,
        team_size_needed: 3,
        time_horizon: "This semester",
        open_roles: [],
        members: teamMembers,
        milestones: milestones
      };

      const project = await api.createProject(payload);

      setStep(5);
      // Brief delay before redirect
      setTimeout(() => {
        navigate(`/explore`);
      }, 800);

    } catch (err) {
      alert(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack create-page w-full max-w-[1200px] mx-auto pb-20">

      <div className="create-topline reveal-in">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Back to workspace
        </button>
      </div>

      <section className="create-intro reveal-in delay-1">
        <div>
          <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">Make an invitation</span>
          <h1>Let’s build<br /><em className="not-italic text-[#7f1d3b]">something.</em></h1>
          <p>Give your idea enough shape for the right people to find it.</p>
        </div>
        <div className="create-intro-mark">
          <Lightbulb size={26} strokeWidth={1.3} />
          <span>01 /<br />the spark</span>
        </div>
      </section>

      <div className="stepper reveal-in delay-2">
        <div className={`stepper-item ${step >= 1 ? "is-current" : ""}`} onClick={() => setStep(1)}>
          <span>01</span><strong>The Idea</strong>
        </div>
        <div className="stepper-line" />
        <div className={`stepper-item ${step >= 2 ? "is-current" : ""}`} onClick={() => setStep(2)}>
          <span>02</span><strong>Signal</strong>
        </div>
        <div className="stepper-line" />
        <div className={`stepper-item hidden md:flex ${step >= 3 ? "is-current" : ""}`} onClick={() => setStep(3)}>
          <span>03</span><strong>Team & Plan</strong>
        </div>
      </div>

      <div className="create-layout reveal-in delay-3">

        <form className="create-form" onSubmit={submit}>

          {/* Section 01 */}
          <div className="form-section">
            <div className="form-section-heading">
              <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase">01 / The idea</span>
              <span>Start simple</span>
            </div>
            <label className="field-label">
              Project name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give the idea a working title"
              />
            </label>
            <label className="field-label">
              Short Description (Teaser)
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A one-sentence hook that appears on the project card."
                rows={2}
              />
            </label>
            <label className="field-label">
              Detailed Description
              <textarea
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                placeholder="Explain the problem, your approach, and why it matters."
                rows={6}
              />
              <span className="field-hint">Keep it human. You can edit this later.</span>
            </label>
          </div>

          {/* Section 02 */}
          <div className="form-section">
            <div className="form-section-heading">
              <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase">02 / The signal</span>
              <span>Help people find the fit</span>
            </div>

            <div className="field-label">
              What skills would make this stronger?
              <div className="skill-selector mt-3">
                {DEFAULT_SKILL_OPTIONS.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    className={`selectable-skill ${selectedSkills.includes(skill) ? "is-selected" : ""}`}
                    onClick={() => toggleQuickSkill(skill)}
                  >
                    {selectedSkills.includes(skill) ? <Check size={13} /> : <Plus size={13} />}
                    {skill}
                  </button>
                ))}
                <button type="button" onClick={() => setIsSkillPickerOpen(true)} className="selectable-skill border-dashed border-[#7f1d3b]/30 text-[#7f1d3b] hover:bg-[#7f1d3b]/5">
                  <Search size={13} /> Search & Add Other
                </button>
              </div>
              {selectedSkills.filter(s => !DEFAULT_SKILL_OPTIONS.includes(s)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-400">Custom skills:</span>
                  {selectedSkills.filter(s => !DEFAULT_SKILL_OPTIONS.includes(s)).map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200">
                      {skill} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => toggleQuickSkill(skill)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="field-label mt-6">
              Tech Stack & Tools (Optional)
              <div className="mt-2 flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span key={tech} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#2a2a2a]/10 shadow-sm text-sm rounded-full text-[#2a2a2a]">
                    {tech} <X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => setTechStack(techStack.filter(t => t !== tech))} />
                  </span>
                ))}
                <button type="button" onClick={() => setIsTechPickerOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fffaf7] border border-dashed border-[#7f1d3b]/30 text-sm rounded-full text-[#7f1d3b] hover:bg-[#7f1d3b]/5 transition-colors">
                  <Plus size={14} /> Add Tech
                </button>
              </div>
            </div>
          </div>

          {/* Section 03: The Team */}
          <div className="form-section">
            <div className="form-section-heading">
              <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase">03 / The Team</span>
              <span>Already have teammates?</span>
            </div>

            <div className="space-y-3 mt-4">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7f1d3b]/10 flex items-center justify-center overflow-hidden">
                      {member.user.avatar_url ? (
                        <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-[#7f1d3b]">{getInitials(member.user.full_name)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[#2a2a2a]">{member.user.full_name}</div>
                      <div className="text-xs text-slate-500">{member.role}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setIsMemberPickerOpen(true)} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[#2a2a2a]/10 rounded-xl text-slate-500 hover:text-[#7f1d3b] hover:border-[#7f1d3b]/30 hover:bg-[#fffaf7] transition-all">
                <User size={18} /> Add Team Member
              </button>
            </div>
          </div>

          {/* Section 04: The Plan */}
          <div className="form-section border-b-0">
            <div className="form-section-heading">
              <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase">04 / The Plan</span>
              <span>Set early milestones</span>
            </div>

            <div className="space-y-3 mt-4">
              {milestones.map((ms, idx) => (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                  <button type="button" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                  <div className="font-medium text-[#2a2a2a] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">{idx + 1}</span>
                    {ms.title}
                  </div>
                  {ms.description && <div className="mt-1 text-sm text-slate-500 ml-7">{ms.description}</div>}
                  <div className="flex gap-4 ml-7 mt-2">
                    {ms.targetDate && <div className="text-xs font-medium text-[#7f1d3b]">Target: {new Date(ms.targetDate).toLocaleDateString()}</div>}
                    <div className="text-xs font-medium text-slate-500">
                      Status: {ms.status === 'NOT_STARTED' ? 'Not Started' : ms.status === 'IN_PROGRESS' ? 'Working' : ms.status === 'COMPLETED' ? 'Done' : 'Blocked'}
                    </div>
                  </div>
                </div>
              ))}

              {isAddingMilestone ? (
                <div className="p-4 bg-[#fffaf7] border border-[#7f1d3b]/20 rounded-xl space-y-3">
                  <input type="text" autoFocus placeholder="Milestone Title (e.g. MVP Launch)" value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} className="w-full p-2 border border-slate-200 rounded text-sm text-[#2a2a2a]" />
                  <textarea placeholder="Brief description (optional)" rows={2} value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} className="w-full p-2 border border-slate-200 rounded text-sm text-[#2a2a2a]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={newMilestone.targetDate} onChange={e => setNewMilestone({ ...newMilestone, targetDate: e.target.value })} className="w-full p-2 border border-slate-200 rounded text-sm text-[#2a2a2a]" />
                    <select 
                      value={newMilestone.status}
                      onChange={e => setNewMilestone({ ...newMilestone, status: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded text-sm text-[#2a2a2a] bg-white outline-none"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">Working</option>
                      <option value="COMPLETED">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddMilestone} className="px-4 py-2 bg-[#7f1d3b] text-white rounded-lg text-sm font-medium hover:bg-[#6a1730]">Add Milestone</button>
                    <button type="button" onClick={() => setIsAddingMilestone(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setIsAddingMilestone(true)} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[#2a2a2a]/10 rounded-xl text-slate-500 hover:text-[#7f1d3b] hover:border-[#7f1d3b]/30 hover:bg-[#fffaf7] transition-all">
                  <Plus size={18} /> Add Milestone
                </button>
              )}
            </div>
          </div>

          <div className="form-actions mt-8 pt-8 border-t border-slate-100">
            <button type="button" className="button button-quiet" onClick={() => alert("Draft saved locally.")}>
              <Sparkles size={15} /> Save draft
            </button>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Launch Project'} <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Right Side: Live Preview Card */}
        <aside className="project-preview surface-card hidden md:block">
          <div className="preview-topline">
            <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Discovery Card Preview</span>
            <span className="preview-live"><span className="pulse-dot" /> Live</span>
          </div>

          {/* Card matches standard Project Card UI intentionally minimal */}
          <div className="preview-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#7f1d3b]/5 to-transparent rounded-bl-full opacity-50" />
            
            <h2 className="text-xl font-bold text-[#2a2a2a] leading-tight mt-1">{title || "Your project title"}</h2>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
              {shortDescription || "A one-sentence hook that captures attention. Discovery cards are kept intentionally clean and minimal."}
            </p>

            <div className="tag-row flex flex-wrap gap-1.5 mt-2 min-h-[24px]">
              {(selectedSkills.length ? selectedSkills : ["Skill required", "Another skill"]).slice(0, 3).map((skill) => (
                <span className="px-2 py-1 rounded bg-slate-50 text-[10px] font-medium text-slate-600 border border-slate-100" key={skill}>
                  {skill}
                </span>
              ))}
              {selectedSkills.length > 3 && (
                <span className="px-2 py-1 rounded bg-slate-50 text-[10px] font-medium text-slate-400 border border-slate-100">
                  +{selectedSkills.length - 3}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/60">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#f4e0e2] text-[#7f1d3b] text-[9px] font-bold">
                  {getInitials(user?.full_name)}
                </span>
                <span className="text-xs text-slate-500">By <strong className="text-[#2a2a2a] font-medium">{user?.full_name || "You"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Team Avatar Stack */}
                {teamMembers.length > 0 && (
                  <div className="flex -space-x-1">
                    {teamMembers.slice(0, 2).map((m, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-white bg-slate-200 overflow-hidden">
                        {m.user.avatar_url ? <img src={m.user.avatar_url} className="w-full h-full object-cover" /> : null}
                      </div>
                    ))}
                  </div>
                )}
                <span className="text-[10px] font-medium text-slate-400">{teamMembers.length + 1} members</span>
              </div>
            </div>
          </div>

          <div className="preview-note mt-6 flex gap-3 text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Lightbulb size={20} className="text-[#7f1d3b] shrink-0" />
            <p><strong>Pro tip:</strong> Keep the short description punchy. People can click the card to read your detailed description, view milestones, and see open roles in the Project Modal.</p>
          </div>
        </aside>

      </div>

      {/* Modals */}
      <SkillPickerModal
        isOpen={isSkillPickerOpen}
        onClose={() => setIsSkillPickerOpen(false)}
        selectedSkills={selectedSkills}
        onSkillsChange={setSelectedSkills}
        title="Select Required Skills"
        commonOptions={DEFAULT_SKILL_OPTIONS}
      />

      <SkillPickerModal
        isOpen={isTechPickerOpen}
        onClose={() => setIsTechPickerOpen(false)}
        selectedSkills={techStack}
        onSkillsChange={setTechStack}
        title="Select Tech Stack"
        commonOptions={DEFAULT_TECH_OPTIONS}
      />

      <MemberPickerModal
        isOpen={isMemberPickerOpen}
        onClose={() => setIsMemberPickerOpen(false)}
        onAddMember={(member) => setTeamMembers([...teamMembers, member])}
        excludeUserIds={[user?.id, ...teamMembers.map(m => m.user_id)].filter(Boolean)}
      />

    </div>
  );
}
