'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Sparkles, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const DEFAULT_STEPS: TourStep[] = [
  {
    targetId: 'nav-dashboard',
    title: 'YOUR DASHBOARD',
    content: 'Get a holistic view of your hospital operations, revenue, and patient flow here.',
    position: 'right'
  },
  {
    targetId: 'nav-patients',
    title: 'Patient Records',
    content: 'Manage all patient biodata and clinical histories in one central registry.',
    position: 'right'
  },
  {
    targetId: 'nav-appointments',
    title: 'Master Scheduler',
    content: 'Manage doctor availability and book clinical slots for patients.',
    position: 'right'
  },
  {
    targetId: 'nav-billing',
    title: 'Financial Management',
    content: 'Generate invoices, track payments, and manage your service price catalog.',
    position: 'right'
  },
  {
    targetId: 'nav-profile',
    title: 'Account Settings',
    content: 'Configure your professional profile and digital signature defaults.',
    position: 'right'
  }
];

export const InteractiveTour = () => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoAdvance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNext();
    }, 8000); // 8 seconds per step as requested (auto-progress)
  }, [currentStep]);

  useEffect(() => {
    setMounted(true);
    const prefs = user?.clinical_preferences;
    // Show only if not completed and not dismissed
    if (user && !prefs?.has_completed_tour && !prefs?.dismissed_tour) {
      // Delay start slightly to allow page to settle
      const timeout = setTimeout(() => {
        setIsVisible(true);
        startAutoAdvance();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user]);

  const updateTargetPos = useCallback(() => {
    const step = DEFAULT_STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-primary-500/50', 'ring-offset-2', 'transition-all', 'duration-500');
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (isVisible) {
      updateTargetPos();
      window.addEventListener('resize', updateTargetPos);
      window.addEventListener('scroll', updateTargetPos);
      return () => {
        window.removeEventListener('resize', updateTargetPos);
        window.removeEventListener('scroll', updateTargetPos);
        // Cleanup highlight
        const step = DEFAULT_STEPS[currentStep];
        const el = document.getElementById(step.targetId);
        if (el) el.classList.remove('ring-4', 'ring-primary-500/50', 'ring-offset-2');
      };
    }
  }, [isVisible, updateTargetPos]);

  const handleNext = () => {
    // Cleanup current highlight
    const step = DEFAULT_STEPS[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) el.classList.remove('ring-4', 'ring-primary-500/50', 'ring-offset-2');

    if (currentStep < DEFAULT_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      startAutoAdvance();
    } else {
      completeTour();
    }
  };

  const completeTour = async () => {
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    try {
      const currentPrefs = user?.clinical_preferences || {};
      const newPrefs = { ...currentPrefs, has_completed_tour: true };
      await authAPI.updateProfile({ clinical_preferences: newPrefs });
      updateUser({ clinical_preferences: newPrefs });
    } catch (e) {
      console.error('Failed to save tour progress');
    }
  };

  const skipTour = async () => {
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    try {
      const currentPrefs = user?.clinical_preferences || {};
      const newPrefs = { ...currentPrefs, dismissed_tour: true };
      await authAPI.updateProfile({ clinical_preferences: newPrefs });
      updateUser({ clinical_preferences: newPrefs });
    } catch (e) {
      console.error('Failed to skip tour');
    }
  };

  if (!mounted || !isVisible || !targetRect || typeof document === 'undefined' || !document.body) return null;

  const step = DEFAULT_STEPS[currentStep];
  
  // Calculate tooltip position with safety
  const tooltipHeight = 300;
  const tooltipWidth = 320;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

  const top = targetRect.top + targetRect.height / 2;
  const left = targetRect.right + 20;

  return createPortal(
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Overlay Backdrop - selective */}
      <div className="absolute inset-0 bg-transparent pointer-events-none" />
      
      {/* Tooltip */}
      <div 
        className="absolute w-72 bg-white rounded-[2rem] shadow-2xl border border-primary-100 p-6 pointer-events-auto animate-in zoom-in-95 fade-in duration-300 shadow-primary-900/10"
        style={{ 
          top: Math.max(20, Math.min(window.innerHeight - 300, top - 100)), 
          left: Math.min(window.innerWidth - 320, left) 
        }}
      >
        <div className="absolute -left-2 top-24 w-4 h-4 bg-white border-l border-b border-primary-100 rotate-45" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase text-primary-600 tracking-widest">Guide • {currentStep + 1}/{DEFAULT_STEPS.length}</span>
          </div>
          <button onClick={skipTour} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-tight">{step.title}</h3>
        <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-6">
          {step.content}
        </p>

        <div className="flex items-center justify-between gap-4">
          <button onClick={skipTour} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Skip</button>
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
          >
            {currentStep === DEFAULT_STEPS.length - 1 ? 'Finish' : 'Next'}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 flex gap-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          {DEFAULT_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-full flex-1 transition-all duration-500",
                i <= currentStep ? "bg-primary-500" : "bg-gray-200"
              )} 
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
