'use client';

import React, { use } from 'react';
import PublicBookingForm from '@/components/public/PublicBookingForm';
import { useSettings } from '@/hooks/useSettings';
import { Loader2, Calendar, ShieldCheck, Heart } from 'lucide-react';

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { settings, loading } = useSettings(slug);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Left Side: Info */}
          <div className="lg:w-1/3 space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">Appointments</h2>
              <h1 className="text-5xl font-black text-gray-900 leading-tight">
                Your Health, <br />
                <span className="text-primary-600">On Your Schedule.</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Book a consultation with our world-class specialists in just a few clicks. Fast, secure, and compassionate care.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, title: "Secure & Confidential", desc: "Your medical data is encrypted and handled with care." },
                { icon: Calendar, title: "Instant Confirmation", desc: "Receive immediate email confirmation of your slot." },
                { icon: Heart, title: "Specialist Matching", desc: "Choose the department that fits your specific needs." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-primary-600 transition-colors">
                    <item.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[2rem] bg-gray-900 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
               <h4 className="text-xl font-black mb-2">Need Help?</h4>
               <p className="text-gray-400 text-sm font-medium mb-4">Our support team is available 24/7 for urgent inquiries.</p>
               <p className="text-2xl font-black text-primary-400">0800-MEDICS-HMS</p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="lg:w-2/3 w-full animate-in fade-in slide-in-from-right-8 duration-700">
            <PublicBookingForm 
              hospitalId={settings?.id || ''} 
              slug={slug} 
            />
          </div>

        </div>
      </div>
    </div>
  );
}
