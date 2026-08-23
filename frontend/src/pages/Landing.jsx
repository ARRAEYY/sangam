import React from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { SangamEmblem } from '../components/SangamLogo.jsx'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      {/* Signature hero: dark maroon panel with radiating glow lines */}
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

        <div className="relative">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur shadow-inner">
            <SangamEmblem size={34} className="text-white" />
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Find your next co-founder,
            <br className="hidden sm:block" /> teammate, or hackathon squad.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-brand-100/90">
            A talent board built only for your campus. Post a project, tag the skills you need,
            and get matched with students who actually want to build.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              Explore projects <ArrowRight size={16} />
            </Link>
            {!user && (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign up with your campus email
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-5 text-left sm:grid-cols-3">
        <div className="card p-6">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Search size={19} />
          </span>
          <h3 className="font-display font-semibold text-slate-900">Discover by skill</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Filter open projects or fellow students by exactly the tech stack you care about.
          </p>
        </div>
        <div className="card p-6">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck size={19} />
          </span>
          <h3 className="font-display font-semibold text-slate-900">Verified campus network</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Every account is locked to a college email address — no spam, no strangers.
          </p>
        </div>
        <div className="card p-6">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Users size={19} />
          </span>
          <h3 className="font-display font-semibold text-slate-900">Built for teams</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Post a role, review applicants, and accept teammates — all in one place.
          </p>
        </div>
      </div>
    </div>
  )
}
