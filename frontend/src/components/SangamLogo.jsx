import React from 'react'

export function SangamEmblem({ size = 28, className = '' }) {
  // We use height for sizing to maintain aspect ratio since the new logo is horizontal
  return (
    <img 
      src="/logo-full.png" 
      alt="Sangam Logo" 
      height={size} 
      style={{ height: size, width: 'auto' }}
      className={`shrink-0 ${className}`} 
    />
  )
}

export default function SangamLogo({ emblemSize = 28, className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <SangamEmblem size={emblemSize} />
    </div>
  )
}
