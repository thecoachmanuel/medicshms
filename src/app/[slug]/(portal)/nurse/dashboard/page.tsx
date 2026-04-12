'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appointmentsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { getLagosDate, formatDate } from '@/lib/utils';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { 
  Activity, Calendar, HeartPulse, Stethoscope, 
  RefreshCw, ClipboardList, Thermometer, UserCheck, Megaphone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Triage Volume Chart Data will be computed from live data if possible, or shown as empty

export default function NurseDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ arrived: 0, triaged: 0, total: 0 });

  const handleCall = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setCallingId(id);
      const res = await appointmentsAPI.call(id, { station: 'Triage Room' }) as any;
      const appointment = res.data;

      // Broadcast high-speed signal to monitor
      if (slug && appointment) {
        const channel = supabase.channel(`hospital:${slug}:queue`);
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'PATIENT_CALLED',
          payload: { 
            id: appointment.id, 
            fullName: appointment.full_name || appointment.fullName, 
            station: appointment.calling_station,
            department: appointment.department
          }
        });
        await supabase.removeChannel(channel);
      }

      toast.success('Patient called to triage');
    } catch (error) {
      toast.error('Failed to call patient');
    } finally {
      setCallingId(null);
    }
  };

  useEffect(() => {
    fetchAll();

    // Millisecond Realtime Sync for Nurse Dashboard
    const channel = supabase
      .channel('nurse_dashboard_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_appointments' },
        (payload) => {
          console.log('Realtime Update Received:', payload);
          fetchAll(); // Instant re-sync on any change
        }
      )
      .subscribe();

    const fallback = setInterval(fetchAll, 60000); // 60s fallback instead of 30s
    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  }, [fetchAll]);

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const statCards = [
    { label: "Today's Clinical Volume", value: stats.total, icon: Calendar, color: 'blue', description: 'Total encounters scheduled today' },
    { label: 'Successfully Triaged', value: stats.triaged, icon: HeartPulse, color: 'emerald', description: 'Patients verified for consultation' },
    { label: 'Awaiting Triage', value: stats.arrived, icon: UsersIcon, color: 'amber', description: 'Patients in checked-in queue' },
    { label: 'Critical Overwatch', value: 0, icon: Activity, color: 'rose', description: 'Requiring immediate intervention' },
  ];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/40 via-teal-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, Nurse {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage triage, vitals, and patient care workflows.</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary" disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card as any} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 mb-6">Clinical Activity Overview</h3>
          <div className="h-80 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] opacity-40">
            <Activity className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest">Real-time throughput metrics will appear here</p>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Pending Vitals</h3>
            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg uppercase">Action Needed</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {appointments.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-40">
                  <UserCheck className="w-10 h-10 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Queue Synchronized • No Pending Triage</p>
               </div>
            ) : appointments.map((apt) => (
              <Link 
                key={apt._id} 
                href={`/${slug}/nurse/vitals?patientId=${apt.patientId || apt._id}&appointmentId=${apt._id}`}
                className="block p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{apt.fullName}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{apt.department} • {apt.appointmentTime}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleCall(e, apt._id)}
                      disabled={callingId === apt._id}
                      className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-colors disabled:opacity-50"
                      title="Call to Triage"
                    >
                      {callingId === apt._id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Thermometer className="w-4 h-4 animate-bounce" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 group-hover:text-gray-600">
                    <ClipboardList className="w-3 h-3" />
                    Ref: {apt.appointmentId}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          <Link href={`/${slug}/nurse/vitals`} className="mt-4 w-full btn-secondary">
            View All Patients
          </Link>
        </div>
      </div>
    </div>
  );
}

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
