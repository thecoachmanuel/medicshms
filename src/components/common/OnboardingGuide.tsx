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

  return (
    <div className="mb-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-indigo-600/5 to-transparent rounded-[2.5rem] border border-primary-100 shadow-sm" />
      
      <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-200">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Welcome to Your Dashboard
            </h2>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2 opacity-60">Hospital Onboarding System</p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Let's get your workstation fully configured. Completing these steps ensures seamless clinical operations for your tenant hospital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              onClick={() => router.push(`/${user?.hospital_slug}${step.link}`)}
              className="bg-white/80 backdrop-blur-md border border-white hover:border-primary-200 p-4 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full sm:w-48 group/step"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 group-hover/step:bg-primary-50 group-hover/step:text-primary-600 flex items-center justify-center transition-colors">
                  <step.icon className="w-4 h-4" />
                </div>
                <Circle className="w-4 h-4 text-slate-200" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1">{step.title}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight mb-3 opacity-0 group-hover/step:opacity-100 transition-opacity">
                {step.description}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                {step.action}
                <ArrowRight className="w-3 h-3 group-hover/step:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
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
