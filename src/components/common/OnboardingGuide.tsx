'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Settings, 
  Users, 
  Calendar, 
  ClipboardList, 
  Activity, 
  Stethoscope, 
  Pill,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: string;
  link: string;
}

export const OnboardingGuide = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getSteps = (role: string): Step[] => {
    const common = [
      { id: 'profile', title: 'Complete Profile', description: 'Add your photo and professional details', icon: Settings, action: 'Update Now', link: '/profile' },
    ];

    switch (role) {
      case 'Admin':
        return [
          { id: 'hosp', title: 'Hospital Branding', description: 'Upload logo and set hospital details', icon: Activity, action: 'Configure', link: '/admin/settings' },
          { id: 'staff', title: 'Onboard Staff', description: 'Create accounts for your clinical team', icon: Users, action: 'Add Staff', link: '/admin/staff' },
          { id: 'billing', title: 'Price Catalog', description: 'Set prices for consultations and tests', icon: ClipboardList, action: 'Set Prices', link: '/admin/billing' },
          ...common
        ];
      case 'Doctor':
        return [
          { id: 'availability', title: 'Set Availability', description: 'Configure your weekly consultation slots', icon: Calendar, action: 'Manage Schedule', link: '/doctor/availability' },
          { id: 'pref', title: 'Clinical Prefs', description: 'Set your default digital signature', icon: Stethoscope, action: 'Set Up', link: '/profile' },
          ...common
        ];
      case 'Receptionist':
        return [
          { id: 'schedule', title: 'Master Schedule', description: 'Verify hospital working hours', icon: Calendar, action: 'View Slots', link: '/receptionist/slot-management' },
          { id: 'patients', title: 'Patient Registry', description: 'Start registering new patients', icon: Users, action: 'Open Registry', link: '/receptionist/patients' },
          ...common
        ];
      default:
        return common;
    }
  };

  const steps = getSteps(user?.role || '');

  // Progress Detection Logic
  const isProfileComplete = user?.profilePhoto && user?.name;
  const isAvailabilitySet = user?.role === 'Doctor' ? true : true; // This would need an API check ideally
  const isPrefsSet = user?.clinical_preferences && Object.keys(user.clinical_preferences).length > 0;

  const isCompleted = (id: string) => {
    if (id === 'profile') return isProfileComplete;
    if (id === 'pref') return isPrefsSet;
    return false;
  };

  return (
    <div className="mb-0 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent rounded-[2.5rem] border border-indigo-100 shadow-sm" />
      
      <div className="relative p-8 md:p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Setup your Workstation
              </h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Professional Verification</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Let's get your workstation fully configured. Completing these steps ensures seamless clinical operations for your tenant hospital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {steps.map((step, idx) => {
            const done = isCompleted(step.id);
            return (
              <div 
                key={step.id}
                onClick={() => router.push(step.link.startsWith('/') ? `/${user?.hospital_slug}${step.link}` : step.link)}
                className={cn(
                  "bg-white/80 backdrop-blur-md border hover:border-indigo-200 p-5 rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer w-full sm:w-56 group/step",
                  done ? "border-emerald-100 bg-emerald-50/20" : "border-white"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                    done ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover/step:bg-indigo-600 group-hover/step:text-white"
                  )}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  {done ? (
                    <div className="px-2 py-1 rounded-lg bg-emerald-100 text-[8px] font-black text-emerald-600 uppercase tracking-widest">Done</div>
                  ) : (
                    <Circle className="w-4 h-4 text-slate-200 group-hover/step:text-indigo-200" />
                  )}
                </div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-2">
                  {step.title}
                </h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">
                  {step.description}
                </p>
                <div className={cn(
                  "mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                  done ? "text-emerald-600" : "text-indigo-600 group-hover/step:translate-x-1"
                )}>
                  {done ? 'View Details' : step.action}
                  {!done && <ArrowRight className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
