import React from 'react'

export function SangamEmblem({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Central bold concentric ring */}
      <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="12" fill="none" />
      
      {/* Outer concentric segmented arcs */}
      <path
        d="M 50 4 A 46 46 0 0 0 4 50"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 4 50 A 46 46 0 0 0 68 93"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 50 4 A 46 46 0 0 1 96 50"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 96 50 A 46 46 0 0 1 78 86"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      
      {/* Precision concentric accent notches */}
      <path
        d="M 12 36 A 40 40 0 0 0 12 64"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 88 36 A 40 40 0 0 1 88 64"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SangamLogo({ emblemSize = 26, textClass = 'text-lg', className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex items-center justify-center text-slate-900">
        <SangamEmblem size={emblemSize} />
      </span>
      <span className={`font-sans font-bold tracking-tight text-slate-900 ${textClass}`}>
        Sangam
      </span>
    </div>
  )
}
