import React from 'react'
import { Link } from 'react-router-dom'
import { SangamEmblem } from '../ui/SangamLogo.jsx'

/**
 * Shared glassmorphism nav bar for all full-bleed pages (Landing, Auth, VerifyEmail, ResetPassword).
 * The brand sits in the nav band between the two dashed grid lines (see GlobalGrid);
 * optional `children` render on the right side (links / actions / mobile menu trigger).
 */
export default function GlobalNav({ children }) {
  return (
    <header className="site-nav">
      <div className="site-nav-glass">
        <div className="site-nav-inner">
          <Link to="/" aria-label="Sangam home" className="site-brand transition-opacity hover:opacity-80">
            <SangamEmblem size={32} />
          </Link>
          {children}
        </div>
      </div>
    </header>
  )
}
