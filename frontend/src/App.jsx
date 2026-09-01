import React from 'react'
import { SangamEmblem } from './components/SangamLogo.jsx'

export default function App() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f8f7f3] p-6 text-center antialiased">
      <div className="max-w-md rounded-[18px] bg-white p-12 shadow-soft border border-[rgba(24,34,50,.08)] relative overflow-hidden">
        <SangamEmblem size={56} className="mx-auto mb-6 text-[#7f1d3b]" />
        
        <h1 className="font-display text-4xl font-normal text-[#202a39] mb-4 tracking-tight">
          Under Development
        </h1>
        
        <p className="text-[#667182] text-sm leading-relaxed">
          Sangam is currently undergoing scheduled maintenance. We are building something exciting and will be back shortly.
        </p>
        
        <div className="mt-8 flex justify-center relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f4e4e4] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7f1d3b]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7f1d3b] animate-pulse"></span>
            System Offline
          </span>
        </div>
      </div>
    </div>
  )
}
