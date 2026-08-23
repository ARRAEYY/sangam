import React from 'react'

export function SangamEmblem({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Central heavy ring */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 250 72 A 178 178 0 1 0 250 428 A 178 178 0 1 0 250 72 Z M 250 142 A 108 108 0 1 1 250 358 A 108 108 0 1 1 250 142 Z"
        fill="currentColor"
      />

      {/* Top-Right solid quadrant block */}
      <path
        d="M 250 0 A 250 250 0 0 1 500 250 L 452 250 A 202 202 0 0 0 250 48 Z"
        fill="currentColor"
      />

      {/* Bottom-Left solid quadrant block */}
      <path
        d="M 0 250 A 250 250 0 0 0 250 500 L 250 452 A 202 202 0 0 1 48 250 Z"
        fill="currentColor"
      />

      {/* Middle concentric thin guide arcs */}
      <path
        d="M 250 54 A 196 196 0 0 0 54 250"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="square"
        fill="none"
      />
      <path
        d="M 250 446 A 196 196 0 0 0 446 250"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="square"
        fill="none"
      />

      {/* Top-Left floating outer arc */}
      <path
        d="M 188 12 A 236 236 0 0 0 28 190"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="square"
        fill="none"
      />

      {/* Bottom-Right floating outer arc */}
      <path
        d="M 312 488 A 236 236 0 0 0 472 310"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="square"
        fill="none"
      />

      {/* Stepped transition notch lines */}
      <path
        d="M 250 48 L 250 72"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="square"
      />
      <path
        d="M 250 428 L 250 452"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="square"
      />
      <path
        d="M 48 250 L 72 250"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="square"
      />
      <path
        d="M 428 250 L 452 250"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="square"
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
