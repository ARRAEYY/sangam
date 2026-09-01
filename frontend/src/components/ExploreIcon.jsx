import React from 'react';

export default function ExploreIcon({ size = 24, strokeWidth = 2, className = '' }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* 4-pointed star */}
      <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
      {/* Center circle */}
      <circle cx="12" cy="12" r="2.5" />
      {/* 4 Corner Arcs */}
      <path d="M 5.24 10.19 A 7 7 0 0 1 10.19 5.24" />
      <path d="M 13.81 5.24 A 7 7 0 0 1 18.76 10.19" />
      <path d="M 18.76 13.81 A 7 7 0 0 1 13.81 18.76" />
      <path d="M 10.19 18.76 A 7 7 0 0 1 5.24 13.81" />
    </svg>
  );
}
