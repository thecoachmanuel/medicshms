import React from 'react';

interface Props {
  className?: string;
  size?: number;
}

export default function NairaSign({ className, size = 24 }: Props) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 19V5l12 14V5" />
      <path d="M4 10h16" />
      <path d="M4 14h16" />
    </svg>
  );
}
