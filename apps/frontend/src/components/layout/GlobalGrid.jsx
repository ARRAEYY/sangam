import React from 'react'

/**
 * Fixed dashed blueprint grid shared by all full-bleed pages:
 * vertical lines at the content container edges plus two horizontal
 * lines framing the nav band (.nav-grid-line-1/2 positions live in index.css).
 * Pages can retint the lines by setting the --grid-line CSS variable.
 */
export default function GlobalGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none flex justify-center z-50 overflow-hidden">
      <div className="w-[min(1400px,calc(100%-8vw))] h-full relative border-l border-r border-dashed border-[color:var(--grid-line,rgba(24,34,50,0.15))] transition-colors duration-500">
        <div className="nav-grid-line-1 absolute w-[100vw] left-1/2 -translate-x-1/2 border-t border-dashed border-[color:var(--grid-line,rgba(24,34,50,0.15))] transition-colors duration-500"></div>
        <div className="nav-grid-line-2 absolute w-[100vw] left-1/2 -translate-x-1/2 border-t border-dashed border-[color:var(--grid-line,rgba(24,34,50,0.15))] transition-colors duration-500"></div>
      </div>
    </div>
  )
}
