import React, { useState, useEffect } from 'react';
import { Linkedin, Github, Globe, ArrowUpRight } from 'lucide-react';
import { PageHeader, SearchToolbar, EmptyState, useFilteredItems } from './Explore.jsx';
import { TalentModal } from '../components/TalentModal.jsx';
import { api } from '../api';

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

// --- 1. Talent Card Component ---
export function TalentCard({ talent, index, onClick }) {
  return (
    <article 
      onClick={onClick}
      className={`talent-card surface-card bg-white border border-slate-100 rounded-[20px] shadow-sm hover:shadow-md transition-all cursor-pointer accent-${talent.tone}`}
    >
      
      {/* Top Header Row */}
      <div className="talent-card-head flex items-start justify-between gap-3">
        <div className={`avatar avatar-large w-12 h-12 rounded-full flex items-center justify-center font-bold text-[14px] avatar-${talent.tone}`}>
          {talent.initials}
        </div>
        <div className="talent-identity flex-1 pt-1 min-w-0">
          <h3 className="text-[17px] font-bold text-slate-800 leading-tight m-0 truncate">{talent.name}</h3>
          <p className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-500">
            <span className="truncate">{talent.degree}</span>
            {talent.year && (
              <>
                <span className="text-slate-300">·</span>
                <span className="whitespace-nowrap">{talent.year}</span>
              </>
            )}
          </p>
        </div>
        <span className="talent-index text-[9px] font-bold tracking-widest text-slate-400 uppercase pt-1 shrink-0">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      </div>
      
      {/* Bio / Description */}
      {talent.bio && (
        <p className="talent-bio text-[16px] font-display text-slate-600 leading-snug my-5 line-clamp-2 min-h-[44px]">
          {talent.bio}
        </p>
      )}
      
      {/* Skills Tags */}
      {talent.skills && talent.skills.length > 0 && (
        <div className="tag-row flex flex-wrap gap-1.5 min-h-[24px]">
          {talent.skills.slice(0, 3).map((skill) => (
            <span className="skill-tag px-3 py-1.5 rounded-full bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100" key={skill}>
              {skill}
            </span>
          ))}
          {talent.skills.length > 3 && (
            <span className="skill-tag px-3 py-1.5 rounded-full bg-slate-50 text-[11px] font-medium text-slate-600 border border-slate-100">
              +{talent.skills.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* Footer Links & Actions */}
      <div 
        className="talent-card-footer mt-auto pt-5 border-t border-slate-100 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="social-links flex gap-1.5">
          {talent.links?.linkedin && (
            <a href={talent.links.linkedin.startsWith('http') ? talent.links.linkedin : `https://linkedin.com/in/${talent.links.linkedin}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-[#7f1d3b] hover:bg-[#fffaf7] transition-all">
              <Linkedin size={14} />
            </a>
          )}
          {talent.links?.website && (
            <a href={talent.links.website.startsWith('http') ? talent.links.website : `https://${talent.links.website}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-[#7f1d3b] hover:bg-[#fffaf7] transition-all">
              <Globe size={14} />
            </a>
          )}
          {talent.links?.github && (
            <a href={talent.links.github.startsWith('http') ? talent.links.github : `https://github.com/${talent.links.github}`} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-[#7f1d3b] hover:bg-[#fffaf7] transition-all">
              <Github size={14} />
            </a>
          )}
        </div>
        <button className="text-[11px] font-bold text-[#7f1d3b] hover:underline flex items-center gap-1">
          Connect <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

// --- 2. Main Talent Page Component ---
export default function TalentSearch() {
  const [query, setQuery] = useState("");
  const [talentData, setTalentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalent, setSelectedTalent] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await api.searchTalent({});
        const mapped = (data || []).map((t, i) => {
          // Attempt to extract degree from education if available
          let degree = "Student";
          let year = "";
          if (t.educations && t.educations.length > 0) {
            degree = t.educations[0].degree || degree;
            if (t.educations[0].graduation_year) {
              year = `Class of ${t.educations[0].graduation_year}`;
            }
          } else if (t.branch) {
            degree = t.branch;
            if (t.graduation_year) year = `Class of ${t.graduation_year}`;
          }

          const socialLinks = {};
          if (t.social_links) {
            if (t.social_links.linkedin) socialLinks.linkedin = t.social_links.linkedin;
            if (t.social_links.github) socialLinks.github = t.social_links.github;
            if (t.social_links.website) socialLinks.website = t.social_links.website;
            if (t.social_links.portfolio) socialLinks.website = t.social_links.portfolio;
          }

          return {
            id: t.id,
            name: t.full_name || "Unknown",
            initials: getInitials(t.full_name),
            degree,
            year,
            bio: t.headline || "",
            skills: (t.skills || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean),
            links: socialLinks,
            tone: ['maroon', 'blue', 'sand'][i % 3]
          };
        });
        if (isMounted) setTalentData(mapped);
      } catch (err) {
        console.error("Failed to load talent", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const filtered = useFilteredItems(talentData, query);

  return (
    <div className="page-stack discovery-page talent-page w-full max-w-[1200px] mx-auto pb-20">
      
      {/* Header */}
      <PageHeader
        title="Find talent" 
        description="Opportunity feels different when the right people are already nearby." 
      />
      
      {/* Intro Editorial Strip (Slightly different background than Explore) */}
      <section className="discovery-intro talent-intro surface-strip reveal-in delay-1 bg-[#f7f5ef] border border-[#eeebe2]">
        <div>
          <h2>The missing piece<br /><em className="not-italic text-[#8f5b36]">might be closer.</em></h2>
        </div>
        <div className="discovery-art">
          {/* Missing the orbit art image but we'll use a placeholder or assume it's supplied soon */}
          <img src="/manus-storage/sangam-talent-orbit_30186115.png" alt="Abstract orbit linking a network of people" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

      </section>

      {/* Search & Filter Toolbar */}
      <SearchToolbar 
        value={query} 
        onChange={setQuery} 
        placeholder="Search by name, skill, or course..." 
        filters={["Everyone", "Design", "Technology", "Community"]} 
      />

      {/* Grid or Empty State */}
      {loading ? (
        <section className="reveal-in delay-2 py-20 text-center text-slate-400 border border-[#eeebe2] rounded-[24px] bg-[#f7f5ef]/50">
          Mapping campus talent...
        </section>
      ) : filtered.length > 0 ? (
        <section className="talent-grid reveal-in delay-2">
          {filtered.map((person, i) => (
            <TalentCard 
              key={person.id || person.name} 
              talent={person} 
              index={i} 
              onClick={() => setSelectedTalent(person.id)} 
            />
          ))}
        </section>
      ) : (
        <section className="reveal-in delay-2">
          <EmptyState type="talent" onReset={() => setQuery("")} />
        </section>
      )}

      {/* Profile Detail Modal */}
      <TalentModal 
        isOpen={!!selectedTalent} 
        onClose={() => setSelectedTalent(null)} 
        talentId={selectedTalent} 
      />
    </div>
  );
}
