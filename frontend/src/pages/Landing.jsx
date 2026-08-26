import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Users,
  ShieldCheck,
  ArrowRight,
  Target,
  Sparkles,
  Award,
  Crown,
  CheckCircle2,
  FolderGit2,
  Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { SangamEmblem } from '../components/SangamLogo.jsx'
import { api } from '../api'

export default function Landing() {
  const { user } = useAuth()
  const [teaserProjects, setTeaserProjects] = useState([])

  useEffect(() => {
    api.getTeaserProjects()
      .then((data) => setTeaserProjects(data.projects || []))
      .catch(() => setTeaserProjects([]))
  }, [])

  return (
    <div className="mx-auto max-w-[92%] max-w-6xl px-3 pb-24 pt-8 sm:px-6">
      {/* ─── Hero Section ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-[#3d0012] via-[#5c0019] to-[#800023] px-6 py-16 text-center shadow-card sm:px-12 sm:py-20">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="glow" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#e97a45" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e97a45" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="400" fill="url(#glow)" />
          {[...Array(6)].map((_, i) => (
            <path
              key={i}
              d={`M -50 ${120 + i * 28} Q 400 ${60 + i * 10} 850 ${140 + i * 24}`}
              stroke="#f7ac7d"
              strokeOpacity={0.18 - i * 0.02}
              strokeWidth="1.5"
              fill="none"
            />
          ))}
        </svg>

        <div className="relative z-10 max-w-3xl mx-auto">
          <SangamEmblem size={48} className="mx-auto mb-6 text-white" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200 border border-white/15 backdrop-blur-sm mb-4">
            <Lock size={11} /> Rishihood Campus Network
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Where campus builders connect, form teams, and ship.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] sm:text-base leading-relaxed text-brand-100/90">
            Sangam is the private collaboration layer for Rishihood University. Discover peers across CS, AI, Design, and Business, assemble project teams with defined roles, and track milestone progress end-to-end.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={user ? '/explore' : '/auth'}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-md transition hover:bg-brand-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {user ? 'Go to Explore' : 'Join Sangam with Campus Email'} <ArrowRight size={16} />
            </Link>
            {!user && (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in to your account
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─── Core Q&A: What is Sangam? ───────────────────────── */}
      <div className="mt-16 text-center max-w-2xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
          Everything you need to turn ideas into real projects
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Built strictly for Rishihood students — verified campus emails only, no spam, no recruiters, just builders.
        </p>
      </div>

      {/* ─── 4 Pillar Capabilities ───────────────────────────── */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 text-left">
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Users size={20} />
            </span>
            <h3 className="font-display font-semibold text-slate-900 text-base">Project Teams & Rosters</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Create projects, pitch to join, or have leads directly add teammates. Clear roles for Frontend, Backend, AI, Design, and Product.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-semibold text-brand-600 flex items-center gap-1">
            <Crown size={12} className="text-amber-500" /> Lead controls included
          </span>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Target size={20} />
            </span>
            <h3 className="font-display font-semibold text-slate-900 text-base">Milestone Progress</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Break down project goals into clear deliverables. Real-time progress bars show what's complete, in progress, or next.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> Stage visibility
          </span>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Search size={20} />
            </span>
            <h3 className="font-display font-semibold text-slate-900 text-base">Talent Directory</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Search students by skills (React, PyTorch, Figma, SQL), academic branch, or graduation batch to find the ideal collaborator.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <Sparkles size={12} /> Filter by stack
          </span>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FolderGit2 size={20} />
            </span>
            <h3 className="font-display font-semibold text-slate-900 text-base">Verified Project History</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Every project you work on automatically builds your portfolio profile with verified tenure, role badges, and achievements.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-semibold text-purple-700 flex items-center gap-1">
            <Award size={12} /> Auto-documented
          </span>
        </div>
      </div>

      {/* ─── Live Teaser Social Proof ────────────────────────── */}
      {teaserProjects.length > 0 && (
        <div className="mt-16 card p-6 sm:p-8 bg-gradient-to-b from-white to-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-brand-600" /> Active Campus Projects
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">A glimpse into what students are currently building on Sangam.</p>
            </div>
            <Link to="/explore" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all on Explore →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teaserProjects.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between gap-3">
                <h4 className="font-semibold text-slate-900 text-sm">{p.title}</h4>
                <div className="flex flex-wrap gap-1">
                  {(p.required_skills || []).slice(0, 3).map((s, i) => (
                    <span key={i} className="pill bg-slate-100 text-slate-600 text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── How It Works (4 Steps) ─────────────────────────── */}
      <div className="mt-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">How Sangam Works</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          From first sign-in to delivering your project with a squad.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
          <div className="card p-5 border-l-4 border-l-brand-600">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Step 1</span>
            <h4 className="font-semibold text-slate-900 mt-1">Create Profile</h4>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Verify your campus email, pick your course, add your tech skills, and complete your builder portfolio.
            </p>
          </div>

          <div className="card p-5 border-l-4 border-l-amber-500">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Step 2</span>
            <h4 className="font-semibold text-slate-900 mt-1">Discover & Match</h4>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Browse open projects needing your skillset or search the student directory to find specific talents.
            </p>
          </div>

          <div className="card p-5 border-l-4 border-l-emerald-500">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 3</span>
            <h4 className="font-semibold text-slate-900 mt-1">Build Your Team</h4>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Accept pitches or directly invite peers with assigned roles and categories to form a balanced roster.
            </p>
          </div>

          <div className="card p-5 border-l-4 border-l-purple-500">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Step 4</span>
            <h4 className="font-semibold text-slate-900 mt-1">Track & Showcase</h4>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Check off milestones, complete projects, and showcase verified team experience on your public profile.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Bottom CTA ─────────────────────────────────────── */}
      <div className="mt-20 rounded-3xl bg-slate-900 p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold">Ready to start building?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">
          Join your fellow Rishihood University students today. All you need is your college email address.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to={user ? '/explore' : '/auth'}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 hover:scale-105 active:scale-95"
          >
            {user ? 'Explore Projects' : 'Get Started with Campus Email'} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
