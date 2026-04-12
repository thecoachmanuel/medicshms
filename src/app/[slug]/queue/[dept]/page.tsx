'use client';

import React, { useState, useEffect, useCallback, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { appointmentsAPI } from '@/lib/api';
import { 
  Volume2, VolumeX, Users, Clock, 
  ArrowRight, Activity, Monitor, Bell,
  ChevronRight, RefreshCw, Smartphone
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DepartmentQueueDisplay({ params }: { params: Promise<{ slug: string; dept: string }> }) {
  const { slug, dept: deptSlug } = use(params);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [nowCalling, setNowCalling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use refs to keep state accessible in the realtime listener
  const voiceActiveRef = useRef(voiceActive);
  const nowCallingRef = useRef(nowCalling);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    nowCallingRef.current = nowCalling;
  }, [nowCalling]);

  const announcePatient = useCallback((patient: any) => {
    if (!voiceActiveRef.current || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `Attention please. ${patient.fullName}, please proceed to ${patient.calling_station || 'the clinical station'}.`
    );
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    // Try to find a premium voice
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium'));
    if (premiumVoice) utterance.voice = premiumVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      // We fetch all "Arrived" or "Triaged" patients for this hospital
      const res = (await appointmentsAPI.getAll({ 
        status: 'Arrived,Triaged', 
        hospitalSlug: slug,
        limit: 100 
      })) as any;
      
      const all = res.data || [];
      
      // Filter by department slug or name
      const filtered = all.filter((a: any) => 
        a.department?.toLowerCase().replace(/\s+/g, '-') === deptSlug ||
        a.department === deptSlug
      );

      // Identify currently calling patient (most recent called_at that is_calling)
      const calling = filtered
        .filter((a: any) => a.is_calling)
        .sort((a: any, b: any) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())[0];

      setNowCalling((prev: any) => {
        // Only announce if a new patient is being called
        if (calling && (!prev || prev.id !== calling.id || prev.called_at !== calling.called_at)) {
          announcePatient(calling);
        }
        return calling || null;
      });

      // Show the rest of the queue
      setAppointments(filtered.filter((a: any) => !a.is_calling || a.id !== calling?.id));
    } finally {
      setLoading(false);
    }
  }, [slug, deptSlug, announcePatient]);

  useEffect(() => {
    fetchQueue();

    // 1. Supabase Realtime Subscription (Milliseconds Precision)
    const channel = supabase
      .channel('queue_updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'public_appointments'
        },
        (payload) => {
          console.log('Realtime Queue Packet Received:', payload);
          // Immediately re-fetch to ensure data consistency
          // This avoids complex local state reconciliation and is extremely fast
          fetchQueue();
        }
      )
      .subscribe();

    // 2. Polling Fallback (Resilience)
    const fallback = setInterval(fetchQueue, 60000); // 60s fallback

    const clock = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
      clearInterval(clock);
    };
  }, [fetchQueue]);

  const toggleVoice = () => {
    if (!voiceActive && window.speechSynthesis) {
      // Trigger a dummy utterance to unlock audio on user gesture
      const unlock = new SpeechSynthesisUtterance('Voice Online');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
    setVoiceActive(!voiceActive);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white animate-pulse">
        <Monitor className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Uplink Synchronization In Progress</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-1/4 w-[1000px] h-[1000px] bg-emerald-500/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Modern Header */}
      <header className="flex items-center justify-between px-10 py-8 bg-black/40 backdrop-blur-3xl border-b border-white/5 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-none truncate max-w-md">{deptSlug.replace(/-/g, ' ')}</h1>
            <p className="text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Realtime QMS Stream Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-right">
            <p className="text-4xl font-black tabular-nums tracking-tighter">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </p>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <button 
            onClick={toggleVoice}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-500 active:scale-95 group",
              voiceActive 
                ? "bg-emerald-500 text-black border-transparent shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
            )}
          >
            {voiceActive ? <Volume2 className="w-6 h-6 animate-bounce" /> : <VolumeX className="w-6 h-6 opacity-40" />}
            <span className="text-xs font-black uppercase tracking-widest">{voiceActive ? 'Voice Online' : 'Voice Offline'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex gap-0 p-0 overflow-hidden">
        {/* Left: Now Serving (Massive Focus) */}
        <section className="flex-[1.4] flex flex-col items-center justify-center p-20 border-r border-white/5 relative group">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none" />
           
           <div className="text-center relative z-10 w-full">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-12 animate-in slide-in-from-bottom duration-700">
                <Bell className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-[0.4em]">Attention Required</span>
              </div>

              {nowCalling ? (
                <div key={nowCalling.id} className="animate-in zoom-in-95 fade-in duration-500">
                   <h2 className="text-[12vw] font-black text-white tracking-tighter leading-[0.85] uppercase drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      {nowCalling.fullName.split(' ')[0]}
                   </h2>
                   <h3 className="text-[5vw] font-black text-emerald-400/80 tracking-tighter mt-4 uppercase">
                      {nowCalling.fullName.split(' ').slice(1).join(' ')}
                   </h3>
                   
                   <div className="mt-16 flex items-center justify-center gap-8">
                      <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl min-w-[300px]">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-3">Destination</p>
                         <p className="text-3xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-3">
                            <ArrowRight className="w-6 h-6 text-emerald-500" />
                            {nowCalling.calling_station || 'Room 1'}
                         </p>
                      </div>
                      <div className="p-8 bg-emerald-500 text-black rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(16,185,129,0.4)] min-w-[200px]">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Status</p>
                         <p className="text-3xl font-black uppercase tracking-tight">Now Serving</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="opacity-10 py-20 flex flex-col items-center select-none">
                   <Clock className="w-32 h-32 mb-8" />
                   <p className="text-xl font-bold uppercase tracking-[1em]">Queue Standby</p>
                </div>
              )}
           </div>

           {/* AI Transcription / History Bar */}
           <div className="absolute bottom-12 left-12 right-12 p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/30">
                 <RefreshCw className="w-4 h-4 animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Stream Control</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-emerald-500/20" />)}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Live Clinical Activity</span>
              </div>
           </div>
        </section>

        {/* Right: Upcoming Queue (Sleek List) */}
        <section className="flex-1 bg-black/30 backdrop-blur-2xl p-12 overflow-hidden flex flex-col relative">
           <div className="flex items-center justify-between mb-10 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-[0.5em] text-white/40 flex items-center gap-4">
                 <Users className="w-5 h-5" />
                 Next in Sequence
              </h3>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/30">
                 {appointments.length} Awaiting
              </span>
           </div>

           <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20">
              {appointments.map((apt, i) => (
                <div 
                  key={apt.id} 
                  className={cn(
                    "p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.05] transition-all duration-500 animate-in slide-in-from-right",
                    i === 0 && "bg-white/[0.06] border-white/10"
                  )}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-2xl group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight uppercase group-hover:translate-x-1 transition-transform">{apt.fullName}</p>
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Ref: {apt.appointmentId}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}

              {appointments.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-20 border-2 border-dashed border-white/10 rounded-[3rem]">
                    <Clock className="w-16 h-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Queue Cleared</p>
                 </div>
              )}
           </div>

           {/* Mobile Launch Support QR/Hint (Decorative) */}
           <div className="absolute bottom-10 left-12 right-12 text-center opacity-20 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-center gap-3">
                 <Smartphone className="w-4 h-4" />
                 <p className="text-[9px] font-black uppercase tracking-widest">Digital Ticket Support Active</p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
