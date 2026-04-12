'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { appointmentsAPI, departmentAPI } from '@/lib/api';
import { 
  Megaphone, Clock, User, ArrowRight, Activity, 
  Volume2, VolumeX, Building2, Monitor
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DepartmentQueueDisplay({ params }: { params: Promise<{ slug: string; dept: string }> }) {
  const { slug, dept: deptSlug } = use(params);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);
  const [lastCalledTime, setLastCalledTime] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = (await appointmentsAPI.getAll({ 
        limit: 50,
        status: 'Arrived,Triaged', // Multi-status fetch
        hospitalSlug: slug
      })) as any;
      
      const all = res.data || [];
      // Filter by department slug if possible, or just exact name match for now
      // Since we have the dept slug from the URL
      const filtered = all.filter((a: any) => 
        a.department?.toLowerCase().replace(/\s+/g, '-') === deptSlug ||
        a.department === deptSlug
      );
      
      setAppointments(filtered);

      // Check for active call
      const calling = filtered.find((a: any) => a.is_calling && a.called_at);
      if (calling) {
        // If this is a new call (different ID or different timestamp)
        if (calling._id !== lastCalledId || calling.called_at !== lastCalledTime) {
          setActiveCall(calling);
          setLastCalledId(calling._id);
          setLastCalledTime(calling.called_at);
          
          if (isVoiceEnabled) {
            announcePatient(calling);
          }
        }
      }
    } catch (err) {
      console.error('Queue Sync Error:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, deptSlug, lastCalledId, lastCalledTime, isVoiceEnabled]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const announcePatient = (apt: any) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const text = `Attention please. ${apt.fullName}. Please proceed to ${apt.calling_station || apt.department || 'the consultation desk'}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Select a better voice if available (premium sounding)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.lang === 'en-GB');
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled && window.speechSynthesis) {
      // Permission trigger
      const utterance = new SpeechSynthesisUtterance("Audio announcements enabled");
      utterance.volume = 0; // Silent first one to unlock
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <Activity className="w-16 h-16 text-indigo-500 animate-pulse mb-4" />
        <h1 className="text-white text-2xl font-black uppercase tracking-[0.3em]">Initializing Queue Matrix...</h1>
      </div>
    );
  }

  const waitingPatients = appointments.filter(a => a._id !== activeCall?._id).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
      {/* Visual Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#312e81,_transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 p-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-3xl px-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none italic">{deptSlug.replace(/-/g, ' ')}</h1>
            <div className="flex items-center gap-3 mt-2">
               <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                 <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" /> Live Status
               </span>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={toggleVoice}
          className={cn(
            "p-5 rounded-3xl transition-all duration-500 border flex items-center gap-3",
            isVoiceEnabled 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/10" 
              : "bg-slate-800 border-white/5 text-slate-500"
          )}
        >
          {isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          <span className="hidden lg:inline text-[10px] font-black uppercase tracking-[0.2em]">{isVoiceEnabled ? 'Voice Online' : 'Voice Offline'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-5 relative z-10 overflow-hidden">
        {/* Left Section: Active Call (Major Display) */}
        <div className="lg:col-span-3 p-12 flex flex-col justify-center border-r border-white/5 bg-gradient-to-br from-slate-900/40 via-transparent to-transparent">
          <div className="mb-12">
             <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
                <Megaphone className="w-5 h-5 text-indigo-400 animate-bounce" />
                <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em]">Now Calling</span>
             </div>
             {activeCall ? (
               <div className="space-y-4 animate-in fade-in slide-in-from-left duration-700">
                 <h2 className="text-[120px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500 drop-shadow-2xl">
                   {activeCall.fullName}
                 </h2>
                 <p className="text-4xl font-black text-indigo-400 uppercase tracking-widest flex items-center gap-4">
                   Proceed to: <span className="text-white px-6 py-2 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-600/30">{activeCall.calling_station || 'Reception'}</span>
                 </p>
               </div>
             ) : (
               <div className="py-20 opacity-20">
                 <div className="text-[80px] font-black uppercase tracking-tighter text-indigo-200">System Ready</div>
                 <p className="text-xl font-bold uppercase tracking-[0.5em] mt-4">Awaiting next patient dispatch...</p>
               </div>
             )}
          </div>
        </div>

        {/* Right Section: Queue Status (Minor Display) */}
        <div className="lg:col-span-2 p-12 bg-slate-900/30 flex flex-col">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-slate-500 border-l-2 border-indigo-500 pl-4">Next in sequence</h3>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">{appointments.length} Total in Queue</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-4 no-scrollbar">
            {waitingPatients.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-4">
                <Clock className="w-16 h-16" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Queue Fully Synchronized</p>
              </div>
            ) : waitingPatients.map((apt, idx) => (
              <div 
                key={apt._id} 
                className="group p-6 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-center justify-between transition-all duration-500 hover:bg-indigo-600/10 hover:border-indigo-500/20"
              >
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                     {idx + 1}
                   </div>
                   <div>
                     <h4 className="text-2xl font-black tracking-tight group-hover:translate-x-1 transition-transform">{apt.fullName}</h4>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: #{apt.appointmentId}</p>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-45 transition-all">
                   <ArrowRight className="w-5 h-5 text-slate-700" />
                </div>
              </div>
            ))}
          </div>

          <footer className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4 opacity-40">
             <Building2 className="w-5 h-5" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Queue Management Cloud v2.4 • Dynamic Routing Enabled</p>
          </footer>
        </div>
      </main>

      {/* Footer Branding Overlay */}
      <div className="absolute bottom-12 left-12 p-8 rounded-[3rem] bg-indigo-600/10 backdrop-blur-3xl border border-indigo-500/20 flex items-center gap-6 animate-pulse">
         <Monitor className="w-6 h-6 text-indigo-400" />
         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-300 italic">Please watch the screen for your name</p>
      </div>
    </div>
  );
}
