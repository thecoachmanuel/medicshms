'use client';

import React, { use } from 'react';
import { Settings, Hammer, Clock, Phone, Mail, ArrowLeft, Globe } from 'lucide-react';
import Link from 'next/link';
import { useSiteSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

export default function MaintenancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/4 bg-primary-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/4 bg-primary-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-10 relative z-10">
        {/* Animated Icon Container */}
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto relative z-10 animate-bounce-short">
             <Settings className="w-12 h-12 text-primary-600 animate-spin-slow" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shadow-lg animate-pulse delay-700">
             <Hammer className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
             {settings?.hospital_name || 'Hospital'} is <br />
             <span className="text-primary-600">Under Maintenance</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            We are currently upgrading our systems to provide you with an even better healthcare experience. Please check back shortly.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
           <div className="card p-6 border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                 <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Back</p>
                 <p className="text-sm font-bold text-slate-900 italic">Within 60 minutes</p>
              </div>
           </div>
           
           <div className="card p-6 border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                 <Phone className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency</p>
                 <p className="text-sm font-bold text-slate-900">{settings?.emergency_phone || 'Call 911'}</p>
              </div>
           </div>
        </div>

        {/* Quick Links / Footer */}
        <div className="space-y-6 pt-8 border-t border-slate-200/50">
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href={`/${slug}/login`} className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-colors">
                 <ArrowLeft className="w-4 h-4" /> Go to Portal Login
              </Link>
           </div>
           
           <div className="flex flex-col items-center gap-2 opacity-40">
              <p className="text-[10px] font-black uppercase tracking-widest italic">Powered by</p>
              <div className="flex items-center gap-2 grayscale">
                 <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
                    <span className="text-white text-[10px] font-black">M</span>
                 </div>
                 <span className="font-black text-xs tracking-tighter">medicsHMS</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
