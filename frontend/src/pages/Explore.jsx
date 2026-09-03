import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Search, Check, SlidersHorizontal } from 'lucide-react';
import { ProjectCard } from './Dashboard.jsx';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

// Helpers (Same as Dashboard for consistency)
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .trim()
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function timeAgo(dateString) {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Recently'
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return 'Just now'
  let interval = seconds / 86400
  if (interval >= 1) return Math.floor(interval) + 'd ago'
  interval = seconds / 3600
  if (interval >= 1) return Math.floor(interval) + 'h ago'
  interval = seconds / 60
  if (interval >= 1) return Math.floor(interval) + 'm ago'
  return 'Just now'
}

// --- 1. Shared Design System Components for Explore ---
export function PageHeader({ eyebrow, title, description, index }) {
  return (
    <header className={`page-header reveal-in ${!index ? '!grid-cols-1 !gap-0' : ''}`}>
      {index && <div className="page-header-index">{index}</div>}
      <div className="page-header-copy">
        {eyebrow && <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function SearchToolbar({ value, onChange, placeholder, filters = ["All projects", "My skills", "Recently added"], roleFilter, onRoleFilterChange }) {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  return (
    <div className="search-toolbar reveal-in delay-1">
      <label className="search-field flex items-center gap-3 bg-white border border-slate-200 rounded-full h-[52px] px-5 shadow-sm flex-1 cursor-text focus-within:border-[#7f1d3b] focus-within:ring-1 focus-within:ring-[#7f1d3b] transition-all">
        <Search size={18} className="text-slate-400" />
        <input 
          value={value} 
          onChange={(event) => onChange(event.target.value)} 
          placeholder={placeholder} 
          className="flex-1 bg-transparent outline-none text-[14px] text-slate-800 placeholder:text-slate-400"
        />
        {onRoleFilterChange && (
          <select 
            value={roleFilter} 
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="hidden md:block bg-slate-50 border-none outline-none text-[12px] text-slate-600 rounded px-2 py-1 cursor-pointer"
          >
            <option value="">Any Role</option>
            <option value="Frontend Developer">Frontend</option>
            <option value="Backend Developer">Backend</option>
            <option value="Full Stack Developer">Full Stack</option>
            <option value="UI/UX Designer">UI/UX</option>
            <option value="Product Designer">Product</option>
            <option value="Marketing">Marketing</option>
            <option value="AI/ML Engineer">AI/ML</option>
            <option value="Researcher">Researcher</option>
            <option value="Content Writer">Content</option>
          </select>
        )}
        <kbd className="hidden md:flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-[10px] text-slate-400 font-mono border border-slate-200">/</kbd>
      </label>
      
      <div className="filter-row flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar" aria-label="Filters">
        {filters.map((filter) => (
          <button 
            key={filter} 
            className={`filter-chip h-[38px] px-4 rounded-full text-[12px] font-bold whitespace-nowrap flex items-center gap-2 border transition-all ${
              activeFilter === filter 
                ? "bg-[#fffaf7] border-[#f4e4e4] text-[#7f1d3b]" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`} 
            onClick={() => setActiveFilter(filter)}
          >
            {activeFilter === filter && <Check size={14} />}
            {filter}
          </button>
        ))}
        <button className="filter-chip h-[38px] w-[38px] flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shrink-0">
          <SlidersHorizontal size={15} />
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ type, onReset }) {
  const isProject = type === "projects";
  return (
    <div className="empty-state surface-card bg-white border border-slate-100 rounded-[24px] p-8 md:p-12 shadow-sm text-center md:text-left">
      <div className="empty-symbol text-[40px] font-display text-slate-200 leading-none mb-6 md:mb-0">{isProject ? "01" : "∞"}</div>
      <div>
        <span className="eyebrow block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">A quieter corner</span>
        <h3 className="font-display text-[32px] text-slate-800 leading-tight mb-2">{isProject ? "No builds here yet." : "No one matches that signal."}</h3>
        <p className="text-[14px] text-slate-500">{isProject ? "Be the first team to start something worth sharing." : "Try another skill, or open the full campus talent index."}</p>
      </div>
      <button className="button button-secondary mt-6 md:mt-0 ml-auto" onClick={onReset}>
        {isProject ? "Clear search" : "Explore everyone"}
      </button>
    </div>
  );
}

export function useFilteredItems(items, query) {
  return useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => 
      [
        item.title, 
        item.name, 
        item.summary, 
        item.creator,
        item.looking_for,
        item.bio,
        item.degree,
        item.year,
        ...(item.skills ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [items, query]);
}

// --- 2. Main Explore Page Component ---
export default function Explore() {
  const { token } = useAuth()
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        const data = await api.listProjects({}, token);
        const mapped = (data || []).map((p, i) => ({
          id: p.id,
          title: p.title,
          summary: stripMarkdown(p.description),
          creator: p.owner?.full_name || 'Anonymous',
          initials: getInitials(p.owner?.full_name),
          status: p.status === 'OPEN' ? 'Open' : p.status === 'IN_PROGRESS' ? 'In progress' : 'Completed',
          looking_for: p.looking_for,
          team: p.member_count > 0 ? `${p.member_count} member${p.member_count > 1 ? 's' : ''}` : 'Seeking members',
          time: timeAgo(p.created_at),
          skills: (p.required_skills || []).map(s => s.name),
          accent: ['maroon', 'blue', 'sand'][i % 3]
        }));
        if (isMounted) setProjectsData(mapped);
      } catch (e) {
        console.error("Failed to load projects", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProjects();
    return () => { isMounted = false; };
  }, [token]);

  const baseFiltered = useFilteredItems(projectsData, query);
  const filtered = useMemo(() => {
    if (!roleFilter) return baseFiltered;
    return baseFiltered.filter(p => p.looking_for === roleFilter);
  }, [baseFiltered, roleFilter]);

  return (
    <div className="page-stack discovery-page w-full max-w-[1200px] mx-auto pb-20">
      
      {/* Header */}
      <PageHeader 
        title="Open projects" 
        description="Teams on campus looking for their next builder." 
      />
      
      {/* Intro Editorial Strip */}
      <section className="discovery-intro surface-strip reveal-in delay-1 bg-white border border-slate-100">
        <div>
          <h2>Good rooms are
        <br /><em className="not-italic text-[#7f1d3b]">worth finding.</em></h2>
        </div>
        <div className="discovery-art">
          <img src="/manus-storage/sangam-discovery-forms_2790f846.png" alt="Abstract paper forms assembling into a project" />
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <SearchToolbar 
        value={query} 
        onChange={setQuery} 
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        placeholder="Search projects, skills, or people..." 
      />

      {/* Grid or Empty State */}
      {loading ? (
        <section className="reveal-in delay-2 py-20 text-center text-slate-400 border border-slate-100 rounded-[24px] bg-white">
          Discovering campus signals...
        </section>
      ) : filtered.length > 0 ? (
        <section className="project-grid reveal-in delay-2">
          {filtered.map((project) => (
            <ProjectCard key={project.id || project.title} project={project} />
          ))}
          
          {/* Post a project card (last card in grid) */}
          <Link to="/create" className="create-card">
            <span className="create-card-mark"><Plus size={20} className="text-[#7f1d3b]" /></span>
            <span>
              <span className="eyebrow block text-[10px] font-bold tracking-widest text-[#7f1d3b]/70 uppercase mb-2">Have an idea?</span>
              <strong className="block text-[#182232] mb-1">Start a project</strong>
              <small className="block text-[13px] text-slate-500">Make space for the right people.</small>
            </span>
            <ArrowUpRight size={20} className="text-[#7f1d3b] ml-auto" />
          </Link>
        </section>
      ) : (
        <section className="reveal-in delay-2">
          <EmptyState type="projects" onReset={() => setQuery("")} />
        </section>
      )}
    </div>
  );
}
