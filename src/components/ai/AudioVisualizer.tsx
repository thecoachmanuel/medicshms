'use client';

import React, { useEffect, useState } from 'react';
import { speechEngine } from '@/lib/audio/speech-engine';
import { cn } from '@/lib/utils';

export default function AudioVisualizer({ isActive }: { isActive: boolean }) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    
    const update = () => {
      if (isActive) {
        setVolume(speechEngine.getVolumeData());
        animationFrame = requestAnimationFrame(update);
      } else {
        setVolume(0);
      }
    };

    if (isActive) {
      update();
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer Glow Layer */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-300 blur-2xl opacity-20",
          isActive ? "bg-indigo-400" : "bg-transparent"
        )}
        style={{
          width: isActive ? `${100 + volume * 200}%` : '0%',
          height: isActive ? `${100 + volume * 200}%` : '0%',
        }}
      />
      
      {/* Mid Pulse Layer */}
      <div 
        className={cn(
          "absolute rounded-full transition-all duration-200 border-2",
          isActive ? "border-indigo-400/30 scale-110" : "border-transparent"
        )}
        style={{
          width: isActive ? `${60 + volume * 150}%` : '0%',
          height: isActive ? `${60 + volume * 150}%` : '0%',
        }}
      />

      {/* Core Aura */}
      <div 
        className={cn(
          "relative rounded-full transition-all duration-100 shadow-2xl overflow-hidden",
          isActive ? "bg-slate-900 border-4 border-white/20" : "bg-slate-200"
        )}
        style={{
          width: isActive ? `${40 + volume * 100}%` : '40px',
          height: isActive ? `${40 + volume * 100}%` : '40px',
          boxShadow: isActive ? `0 0 ${20 + volume * 60}px rgba(99, 102, 241, ${0.3 + volume})` : 'none'
        }}
      >
        {/* Animated Interior Gradient */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-slate-900 to-rose-500 opacity-80 animate-spin-slow" />
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
           <div className={cn(
             "w-full h-full bg-slate-900/40 backdrop-blur-sm flex items-center justify-center transition-all",
             isActive ? "opacity-100" : "opacity-0"
           )}>
             {/* Center Glow Dot */}
             <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
           </div>
        </div>
      </div>
    </div>
  );
}
