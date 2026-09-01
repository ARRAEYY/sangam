import React, { useState, useMemo } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';

const DEFAULT_SKILLS = [
  "Product", "Design", "Engineering", "Research", 
  "Community", "Storytelling", "Climate", "Data",
  "Frontend", "Backend", "Full Stack", "Mobile",
  "AI/ML", "Data Science", "DevOps", "Cloud",
  "UI/UX", "Graphic Design", "Marketing", "Sales",
  "Operations", "Finance", "Legal", "HR"
];

export function SkillPickerModal({ isOpen, onClose, selectedSkills, onSkillsChange, title = "Select Skills", commonOptions = DEFAULT_SKILLS }) {
  const [query, setQuery] = useState("");

  const filteredSkills = useMemo(() => {
    if (!query) return commonOptions;
    return commonOptions.filter(s => s.toLowerCase().includes(query.toLowerCase()));
  }, [query, commonOptions]);

  const showAddCustom = query.trim() !== "" && !commonOptions.some(s => s.toLowerCase() === query.trim().toLowerCase());

  if (!isOpen) return null;

  function toggleSkill(skill) {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter(s => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-[#2a2a2a]/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[#2a2a2a]/10 flex items-center justify-between bg-[#fffaf7]">
          <h2 className="text-lg font-medium text-[#2a2a2a]">{title}</h2>
          <button onClick={onClose} className="p-2 text-[#2a2a2a]/60 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-[#2a2a2a]/10 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2a2a2a]/40" size={18} />
            <input
              type="text"
              placeholder="Search or add custom..."
              className="w-full pl-10 pr-4 py-2 bg-[#fffaf7] border border-[#2a2a2a]/10 rounded-xl focus:outline-none focus:border-[#7f1d3b]/30 focus:ring-1 focus:ring-[#7f1d3b]/30 text-[#2a2a2a] placeholder-[#2a2a2a]/40 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          {selectedSkills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSkills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#7f1d3b] text-[#fffaf7] text-sm rounded-full">
                  {skill}
                  <button onClick={() => toggleSkill(skill)} className="hover:bg-[#fffaf7]/20 rounded-full p-0.5">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {showAddCustom && (
            <button
              onClick={() => {
                toggleSkill(query.trim());
                setQuery("");
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fffaf7] rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#7f1d3b]/10 flex items-center justify-center text-[#7f1d3b]">
                <Plus size={16} />
              </div>
              <span className="text-[#2a2a2a] font-medium">Add "{query.trim()}"</span>
            </button>
          )}

          {filteredSkills.length > 0 ? (
            filteredSkills.map(skill => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fffaf7] rounded-xl transition-colors text-left group"
                >
                  <span className={`text-[#2a2a2a] ${isSelected ? 'font-medium' : ''}`}>{skill}</span>
                  {isSelected && <Check size={18} className="text-[#7f1d3b]" />}
                </button>
              );
            })
          ) : !showAddCustom && (
            <div className="py-8 text-center text-[#2a2a2a]/40">
              No results found.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#2a2a2a]/10 bg-[#fffaf7]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#7f1d3b] text-[#fffaf7] rounded-xl font-medium hover:bg-[#6a1730] transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
