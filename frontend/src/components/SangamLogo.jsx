import React from 'react'

export function SangamEmblem({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Central Donut Ring */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 100 42 C 132.033 42 158 67.967 158 100 C 158 132.033 132.033 158 100 158 C 67.967 158 42 132.033 42 100 C 42 67.967 67.967 42 100 42 Z M 100 68 C 117.673 68 132 82.327 132 100 C 132 117.673 117.673 132 100 132 C 82.327 132 68 117.673 68 100 C 68 82.327 82.327 68 100 68 Z"
        fill="currentColor"
      />

      {/* Middle Top-Right Solid Quadrant */}
      <path
        d="M 100 22 A 78 78 0 0 1 178 100 L 165 100 A 65 65 0 0 0 100 35 Z"
        fill="currentColor"
      />

      {/* Middle Bottom-Left Solid Quadrant */}
      <path
        d="M 22 100 A 78 78 0 0 0 100 178 L 100 165 A 65 65 0 0 1 35 100 Z"
        fill="currentColor"
      />

      {/* Middle Concentric Thin Arc - Top Left */}
      <path
        d="M 100 35 A 65 65 0 0 0 35 100"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />

      {/* Middle Concentric Thin Arc - Bottom Right */}
      <path
        d="M 100 165 A 65 65 0 0 0 165 100"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />

      {/* Outer Floating Arc - Top Left */}
      <path
        d="M 76 10 A 90 90 0 0 0 10 76"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="butt"
        fill="none"
      />

      {/* Outer Floating Arc - Bottom Right */}
      <path
        d="M 124 190 A 90 90 0 0 0 190 124"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="butt"
        fill="none"
      />
    </svg>
  )
}

export default function SangamLogo({ emblemSize = 28, textClass = 'text-xl', className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex items-center justify-center text-slate-900">
        <SangamEmblem size={emblemSize} />
      </span>
      <span className={`font-sans font-extrabold tracking-tight text-slate-900 ${textClass}`}>
        Sangam
      </span>
    </div>
  )
}
