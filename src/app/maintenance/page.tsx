'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Hammer, Clock, Phone, Mail } from 'lucide-react';
import { useSiteSettings } from '@/context/SettingsContext';
import HospitalLogo from '@/components/common/HospitalLogo';

export default function MaintenancePage() {
  const { settings, loading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl shadow-secondary-600/5 overflow-hidden border border-gray-100 p-8 md:p-16 text-center space-y-10 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-600 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex justify-center">
          <HospitalLogo size="lg" className="h-20" hideName />
        </div>

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest mx-auto">
            <Settings className="w-3 h-3 animate-spin" />
            System Maintenance
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            We're improving your <span className="text-primary-600">healthcare experience.</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-lg mx-auto">
            {settings?.hospital_name || 'MedicsHMS'} is currently undergoing scheduled maintenance to bring you new features and a smoother portal. We'll be back shortly!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-3">
            <Clock className="w-6 h-6 text-secondary-600" />
            <h3 className="font-bold text-gray-900">Estimated Downtime</h3>
            <p className="text-sm text-gray-500">Usually back within 2-4 hours</p>
          </div>
          <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center gap-3">
            <Hammer className="w-6 h-6 text-secondary-600" />
            <h3 className="font-bold text-gray-900">What's Changing?</h3>
            <p className="text-sm text-gray-500">Security updates & Performance tweaks</p>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6 relative z-10">
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Contact Support for Emergencies</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <a href={`tel:${settings?.emergency_phone}`} className="flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-colors font-bold">
              <Phone className="w-5 h-5" />
              {settings?.emergency_phone || '+1 (800) 123-4567'}
            </a>
            <a href={`mailto:${settings?.contact_email}`} className="flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-colors font-bold">
              <Mail className="w-5 h-5" />
              {settings?.contact_email || 'care@medicshms.com'}
            </a>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
          © {new Date().getFullYear()} {settings?.hospital_name || 'MedicsHMS'} • All Rights Reserved
        </p>
      </div>
    </div>
  );
}
