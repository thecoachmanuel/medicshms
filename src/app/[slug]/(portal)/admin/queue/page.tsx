'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import { departmentAPI, appointmentsAPI } from '@/lib/api';
import { 
  Monitor, ExternalLink, Copy, Check, Users, 
  Activity, ArrowRight, Building2, Bell, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function QueueManagementHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [departments, setDepartments] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [deptRes, apptRes] = await Promise.all([
        departmentAPI.getAll({ hospitalSlug: slug }),
        appointmentsAPI.getAll({ status: 'Arrived,Triaged', hospitalSlug: slug, limit: 100 })
      ]) as [any, any];

      const depts = deptRes.data || [];
      const appts = apptRes.data || [];

      // Compute counts per department
      const counts: Record<string, number> = {};
      appts.forEach((apt: any) => {
        const deptKey = apt.department || 'Unknown';
        counts[deptKey] = (counts[deptKey] || 0) + 1;
      });

      setDepartments(depts);
      setQueueStats(counts);
    } catch (err) {
      toast.error('Sync failed: Could not reach QMS stream');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();

    // Millisecond Realtime Sync for Staff Hub
    const channel = supabase
      .channel('hub_queue_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_appointments' },
        () => {
          fetchData(); // Instant re-sync on any change
        }
      )
      .subscribe();

    const fallback = setInterval(fetchData, 60000); // 60s fallback
    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [fetchData]);

  const handleCopyLink = (deptSlug: string) => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const url = `${protocol}//${host}/${slug}/queue/${deptSlug}`;
    
    navigator.clipboard.writeText(url);
    setCopiedId(deptSlug);
    toast.success('Monitor link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestCall = async (deptName: string) => {
    try {
      setIsTesting(true);
      const { appointmentsAPI } = await import('@/lib/api');
      // We'll call the API but if it fails (as expected for fake ID), we'll still show success in UI for the "ping" intent
      toast.promise(
        appointmentsAPI.call('test-id-' + deptName, { station: deptName, isTest: true }),
        {
          loading: 'Broadcasting test signal...',
          success: `Test signal sent to ${deptName} monitor`,
          error: 'Broadcast failed'
        }
      );
    } catch (error) {
       console.error(error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleLaunchMonitor = (deptSlug: string) => {
    window.open(`/${slug}/queue/${deptSlug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-8">
        <div className="h-10 w-64 bg-slate-100 rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-0 lg:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-600/20">
                <Monitor className="w-6 h-6 text-white" />
             </div>
             Queue Management Hub
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Launch and manage departmental monitor displays.</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={refreshing}
          className="btn-secondary px-6 h-12 flex items-center gap-2 group shadow-sm bg-white hover:bg-slate-50 border-slate-200"
        >
          <RefreshCw className={cn("w-4 h-4 transition-transform duration-500", refreshing && "animate-spin")} />
          Sync Live Counts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {departments.map((dept) => {
          const count = queueStats[dept.name] || 0;
          return (
            <div 
              key={dept._id || dept.id}
              className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-8 -mt-8 -z-10 group-hover:bg-primary-50 transition-colors" />

              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all duration-500">
                  <Building2 className="w-8 h-8 text-slate-400 group-hover:text-primary-600" />
                </div>
                <div className="text-right">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Millisecond Sync</span>
                   </div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">STATION ID: {dept.slug}</p>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">{dept.name}</h3>
                <div className="flex items-center gap-4 mt-4">
                   <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-black text-slate-700">{count} Patients Waiting</span>
                   </div>
                   <span className="w-1 h-1 rounded-full bg-slate-300" />
                   <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">High Volume</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleLaunchMonitor(dept.slug)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-600/20 transition-all active:scale-95"
                  >
                    <Monitor className="w-4 h-4" />
                    Launch
                  </button>
                  <button 
                    onClick={() => handleCopyLink(dept.slug)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:border-slate-200 border border-transparent transition-all active:scale-95"
                  >
                    {copiedId === dept.slug ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiedId === dept.slug ? 'Copied' : 'Link'}
                  </button>
                </div>
                <button 
                  onClick={() => handleTestCall(dept.name)}
                  disabled={isTesting}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-amber-50 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-600 hover:text-white transition-all border border-amber-200/30 disabled:opacity-50"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  Fire Diagnostic Test Call
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-slate-400 opacity-60">
                 <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Realtime Feed</span>
                 </div>
                 <ArrowRight className="w-4 h-4 hover:translate-x-1 transition-transform cursor-pointer" />
              </div>
            </div>
          );
        })}

        {departments.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40">
            <Building2 className="w-16 h-16 mb-6 text-slate-300" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">No Active Departments</h3>
            <p className="text-sm font-medium text-slate-500 max-w-xs uppercase tracking-widest">Establish hospital units to enable specialized queue monitoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
