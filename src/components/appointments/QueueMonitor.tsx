'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, User, ArrowRight, Zap, 
  RefreshCw, AlertCircle, ChevronRight, Activity,
  Stethoscope, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { appointmentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function QueueMonitor({ doctorId, hospitalId, compact = false }: { doctorId?: string; hospitalId?: string; compact?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    avgWaitTime: 0,
    peakArrival: 'N/A'
  });

  const fetchQueue = async () => {
    try {
      if (!compact) setLoading(true);
      
      const res = (await appointmentAPI.getAll({
        status: 'Arrived', // Show those checked in but not yet triaged/seen
        limit: 50,
        sort: 'arrived_at' // FIFO
      })) as any;
      
      const arrivedPatients = res.data || [];
      
      // Also get Triaged if we want the full clinical queue
      const triageRes = (await appointmentAPI.getAll({
        status: 'Triaged',
        limit: 50,
        sort: 'triaged_at'
      })) as any;
      
      const combined = [...arrivedPatients, ...(triageRes.data || [])].sort((a, b) => {
        const timeA = new Date(a.triaged_at || a.arrived_at).getTime();
        const timeB = new Date(b.triaged_at || b.arrived_at).getTime();
        return timeA - timeB;
      });

      setQueue(combined);
      
      // Calculate Stats
      if (combined.length > 0) {
        const totalWait = combined.reduce((sum, p) => {
          const wait = (new Date().getTime() - new Date(p.arrived_at || p.triaged_at).getTime()) / 60000;
          return sum + wait;
        }, 0);
        
        setStats({
          waiting: combined.length,
          avgWaitTime: Math.round(totalWait / combined.length),
          peakArrival: 'Morning'
        });
      }

    } catch (err) {
      console.error('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [doctorId, hospitalId]);

  const getWaitLevel = (minutes: number) => {
    if (minutes < 15) return 'text-emerald-500';
    if (minutes < 45) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (loading && queue.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Live Queue...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", compact ? "p-0" : "p-2")}>
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 border border-slate-100 p-4 rounded-3xl space-y-1 shadow-sm">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Waiting Room</p>
             <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-2xl font-black text-slate-900">{stats.waiting}</span>
             </div>
          </div>
          <div className="bg-white/50 border border-slate-100 p-4 rounded-3xl space-y-1 shadow-sm">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg. Wait Time</p>
             <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-2xl font-black text-slate-900">{stats.avgWaitTime}m</span>
             </div>
          </div>
          <div className="bg-indigo-600 p-4 rounded-3xl space-y-1 shadow-xl shadow-indigo-600/10">
             <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Next Patient</p>
             <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                   {queue[0]?.fullName || 'Ready for Intake'}
                </span>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-40">
            <Timer className="w-12 h-12 text-slate-200 mx-auto" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Queue Cleared</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">No patients are currently waiting for intake</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {!compact && (
              <div className="px-4 py-2 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                   <Activity className="w-3.5 h-3.5" /> FIFO Intake Sequence
                </h3>
              </div>
            )}
            
            {queue.map((pt, idx) => {
              const waitMins = Math.floor((new Date().getTime() - new Date(pt.arrived_at || pt.triaged_at).getTime()) / 60000);
              
              return (
                <div 
                  key={pt.id}
                  className={cn(
                    "group relative bg-white/60 backdrop-blur-md border border-slate-100 p-3 rounded-2xl flex items-center justify-between hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300",
                    idx === 0 && !compact && "border-l-4 border-l-indigo-500 ring-4 ring-indigo-500/5"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform group-hover:scale-110",
                      idx === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                         {pt.fullName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          pt.appointmentStatus === 'Triaged' ? "text-emerald-600" : "text-sky-600"
                        )}>
                          {pt.appointmentStatus}
                        </span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">#{pt.appointmentId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                       <p className={cn("text-[10px] font-black tabular-nums", getWaitLevel(waitMins))}>
                          {waitMins}m
                       </p>
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Wait Time</p>
                    </div>
                    {compact ? (
                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    ) : (
                      <button 
                        onClick={() => window.location.href = `/${pt.hospital_slug}/doctor/patients/${pt.patient_id}`}
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                         <Stethoscope className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!compact && queue.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50 flex items-start gap-3">
           <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
           <div>
              <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Queue Intelligence</p>
              <p className="text-[9px] font-medium text-amber-700 leading-relaxed uppercase tracking-tight">
                Current workload suggests {stats.avgWaitTime}m average wait. Consider opening an overflow station if queue exceeds 10 patients.
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
