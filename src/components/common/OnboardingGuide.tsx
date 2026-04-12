'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  TestTubes,
  Microscope,
  Package,
  Scan,
  ImageIcon,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: string;
  link: string;
  isCompleted?: (user: any) => boolean;
}

export const OnboardingGuide = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if onboarding is already dismissed or completed
  useEffect(() => {
    setMounted(true);
    const prefs = user?.clinical_preferences;
    
    // Logic for "First Time User":
    // 1. Must NOT be a Platform Admin (they have their own tools)
    // 2. Must NOT have dismissed or completed onboarding already
    // 3. Must have a valid role (handled by steps lookup)
    const isPlatformAdmin = user?.role === 'Platform Admin' || user?.role === 'platform_admin';
    const isReturningUser = prefs?.has_completed_onboarding || prefs?.dismissed_onboarding;
    
    if (user && !isPlatformAdmin && !isReturningUser) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  const steps = useMemo((): Step[] => {
    const role = user?.role || '';
    const common = [
      { 
        id: 'profile', 
        title: 'Complete Profile', 
        description: 'Add photo and professional details', 
        icon: Settings, 
        action: 'Update Now', 
        link: '/profile',
        isCompleted: (u: any) => !!(u?.profilePhoto && u?.phone)
      },
    ];

    switch (role) {
      case 'Admin':
        return [
          { 
            id: 'hosp', 
            title: 'Hospital Branding', 
            description: 'Set hospital logo and details', 
            icon: ShieldCheck, 
            action: 'Configure', 
            link: '/admin/settings',
            isCompleted: () => false // Placeholder for more complex checks
          },
          { 
            id: 'staff', 
            title: 'Onboard Staff', 
            description: 'Create accounts for your team', 
            icon: Users, 
            action: 'Add Staff', 
            link: '/admin/staff',
            isCompleted: () => false
          },
          { 
            id: 'billing', 
            title: 'Price Catalog', 
            description: 'Set prices for services', 
            icon: TrendingUp, 
            action: 'Set Prices', 
            link: '/admin/billing',
            isCompleted: () => false
          },
          ...common
        ];
      case 'Doctor':
        return [
          { 
            id: 'availability', 
            title: 'Set Availability', 
            description: 'Configure your duty schedule', 
            icon: Calendar, 
            action: 'Manage Schedule', 
            link: '/doctor/availability',
            isCompleted: () => false
          },
          { 
            id: 'pref', 
            title: 'Digital Signature', 
            description: 'Set up your clinical defaults', 
            icon: Stethoscope, 
            action: 'Set Up', 
            link: '/profile',
            isCompleted: (u: any) => !!(u?.clinical_preferences && Object.keys(u.clinical_preferences).length > 2)
          },
          ...common
        ];
      case 'Nurse':
        return [
          { 
            id: 'vitals', 
            title: 'Vitals Recording', 
            description: 'Learn to capture patient vitals', 
            icon: Activity, 
            action: 'Take Vitals', 
            link: '/nurse/vitals',
            isCompleted: () => false
          },
          { 
            id: 'schedule', 
            title: 'Appointment Queue', 
            description: 'Management patient arrivals', 
            icon: Users, 
            action: 'View Queue', 
            link: '/nurse/appointments',
            isCompleted: () => false
          },
          ...common
        ];
      case 'Lab Scientist':
        return [
          { 
            id: 'lab-req', 
            title: 'Lab Requests', 
            description: 'Process incoming test requests', 
            icon: TestTubes, 
            action: 'View Requests', 
            link: '/lab-scientist/requests',
            isCompleted: () => false
          },
          { 
            id: 'lab-results', 
            title: 'Result Verification', 
            description: 'Practice result authorization', 
            icon: Microscope, 
            action: 'Auth Results', 
            link: '/lab-scientist/results',
            isCompleted: () => false
          },
          ...common
        ];
      case 'Pharmacist':
        return [
          { 
            id: 'inventory', 
            title: 'Drug Inventory', 
            description: 'Manage medicine stock levels', 
            icon: Package, 
            action: 'Update Stock', 
            link: '/pharmacist/inventory',
            isCompleted: () => false
          },
          { 
            id: 'dispense', 
            title: 'Dispensing', 
            description: 'Process patient prescriptions', 
            icon: Pill, 
            action: 'View Orders', 
            link: '/pharmacist/prescriptions',
            isCompleted: () => false
          },
          ...common
        ];
      case 'Radiologist':
        return [
          { 
            id: 'scans', 
            title: 'Scan Requests', 
            description: 'Review imaging requests', 
            icon: Scan, 
            action: 'View Scans', 
            link: '/radiologist/requests',
            isCompleted: () => false
          },
          { 
            id: 'reports', 
            title: 'Imaging Reports', 
            description: 'Authorize radiology findings', 
            icon: ImageIcon, 
            action: 'Write Reports', 
            link: '/radiologist/reports',
            isCompleted: () => false
          },
          ...common
        ];
      case 'Receptionist':
        return [
          { 
            id: 'patients', 
            title: 'Patient Registry', 
            description: 'Register new clinic patients', 
            icon: Users, 
            action: 'Register', 
            link: '/receptionist/patients',
            isCompleted: () => false
          },
          { 
            id: 'booking', 
            title: 'Master Booking', 
            description: 'Manage center appointments', 
            icon: Calendar, 
            action: 'Book Slots', 
            link: '/receptionist/appointments',
            isCompleted: () => false
          },
          ...common
        ];
      default:
        return common;
    }
  }, [user]);

  const completedCount = steps.filter(s => s.isCompleted?.(user)).length;
  const progressPercent = (completedCount / steps.length) * 100;

  const handleDismiss = async (type: 'dismiss' | 'complete') => {
    try {
      const currentPrefs = user?.clinical_preferences || {};
      const newPrefs = {
        ...currentPrefs,
        [type === 'dismiss' ? 'dismissed_onboarding' : 'has_completed_onboarding']: true
      };

      await authAPI.updateProfile({ clinical_preferences: newPrefs });
      updateUser({ clinical_preferences: newPrefs });
      setIsVisible(false);
      
      if (type === 'complete') {
        toast.success('Onboarding completed! Welcome aboard.');
      }
    } catch (error) {
      console.error('Failed to update onboarding state:', error);
      setIsVisible(false); // Hide anyway to not annoy user
    }
  };

  // Auto-hide when steps are all complete
  useEffect(() => {
    if (mounted && steps.length > 0 && completedCount === steps.length && !user?.clinical_preferences?.has_completed_onboarding) {
       handleDismiss('complete');
    }
  }, [completedCount, steps.length, user, mounted]);

  if (!isVisible || !mounted) return null;

  return (
    <div className="mb-8 relative overflow-hidden group animate-onboarding">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-white to-purple-600/10 rounded-[2.5rem] border border-indigo-100/50 shadow-2xl shadow-indigo-500/5" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative p-8 md:p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                CONFIGURE YOUR WORKSPACE
              </h2>
              <div className="flex items-center gap-3 mt-2">
                 <div className="flex -space-x-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-300 animate-pulse delay-75" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-100 animate-pulse delay-150" />
                 </div>
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{user?.role} Onboarding Guide</p>
              </div>
            </div>
          </div>
          <p className="text-base text-slate-600 leading-relaxed font-medium mb-8">
            Let's get your workstation fully configured. Completing these steps ensures seamless clinical operations for your hospital.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <span>Setup Progress</span>
              <span className="text-indigo-600">{Math.round(progressPercent)}% Complete</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {steps.map((step, idx) => {
            const done = step.isCompleted?.(user);
            return (
              <div 
                key={step.id}
                onClick={() => router.push(`/${user?.hospital_slug}${step.link}`)}
                className={cn(
                  "bg-white/90 backdrop-blur-xl border-2 p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer w-full sm:w-60 group/step border-transparent",
                  done ? "bg-emerald-50/50 border-emerald-100" : "hover:border-indigo-200"
                )}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={cn(
                    "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shadow-lg",
                    done ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-slate-50 text-indigo-600 group-hover/step:bg-indigo-600 group-hover/step:text-white"
                  )}>
                    {done ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                  </div>
                  {done ? (
                    <div className="px-3 py-1 rounded-xl bg-emerald-100 text-[9px] font-black text-emerald-600 uppercase tracking-widest ring-1 ring-emerald-500/20">Verified</div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover/step:border-indigo-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-slate-100 group-hover/step:bg-indigo-100" />
                    </div>
                  )}
                </div>
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-tight mb-2 group-hover/step:text-indigo-600 transition-colors flex items-center gap-2">
                  {step.title}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover/step:opacity-100 transition-all -translate-x-2 group-hover/step:translate-x-0" />
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wide h-8 line-clamp-2">
                  {step.description}
                </p>
                <div className={cn(
                  "mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  done ? "text-emerald-600" : "text-indigo-600 group-hover/step:gap-3"
                )}>
                  {done ? 'View Overview' : step.action}
                  {!done && <ArrowRight className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => handleDismiss('dismiss')}
          className="absolute top-6 right-6 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[1.25rem] transition-all group/close"
          title="Skip Tutorial"
        >
          <X className="w-6 h-6 group-hover/close:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};
