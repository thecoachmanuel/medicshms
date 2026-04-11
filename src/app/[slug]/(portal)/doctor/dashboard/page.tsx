'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { OnboardingGuide } from '@/components/common/OnboardingGuide';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doctorDashboardAPI, labAPI, radiologyAPI } from '@/lib/api';
import { getLagosDate } from '@/lib/utils';
import {
  Calendar, Users, Stethoscope, TrendingUp,
  CheckCircle, Clock, RefreshCw, Activity, Heart,
  ClipboardList, Users as UsersIcon, LayoutDashboard,
  ArrowRight, Beaker, Camera
} from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const timeAgo = (date: string) => {
  const diff = Math.floor((getLagosDate().getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export default function DoctorDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, apptsRes, activityRes, labRes, radRes, monthlyData] = await Promise.all([
        doctorDashboardAPI.getStats(),
        doctorDashboardAPI.getTodayAppointments(),
        doctorDashboardAPI.getActivity(),
        labAPI.getRequests({ doctorId: user?.id, limit: 10 }),
        radiologyAPI.getRequests({ doctorId: user?.id, limit: 10 }),
        doctorDashboardAPI.getChartData('monthly-trend'),
      ]);

      setStats(statsRes.data || {});
      setTodayAppointments(apptsRes.data || []);
      setActivities(activityRes.data || []);
      setMonthlyTrend(monthlyData);
      
      const combined = [
        ...(labRes.data || []).map((l: any) => ({ ...l, origin: 'Laboratory' })),
        ...(radRes.data || []).map((r: any) => ({ ...r, origin: 'Radiology' }))
      ].sort((a: any, b: any) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
      
      setInvestigations(combined.slice(0, 10));
    } catch (err) {
      console.error('Doctor dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'Doctor') {
      router.push(`/${slug}/${user.role.toLowerCase()}/dashboard`);
    }
    if (user) fetchAll();
  }, [fetchAll, user, authLoading, router, slug]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const statCards = stats ? [
    { label: "Today's Queue", value: stats.cards.todayAppointments, icon: Clock, color: 'primary', description: 'Patients waiting for consultation' },
    { label: 'Completed', value: stats.cards.totalCompleted, icon: CheckCircle, color: 'emerald', description: 'Total successful consultations' },
    { label: 'My Patients', value: stats.cards.uniquePatients, icon: UsersIcon, color: 'purple', description: 'Unique patients treated overall' },
    { label: 'Consultations', value: stats.cards.monthConsultations, icon: Activity, color: 'amber', description: 'Consultations this month' },
  ] : [];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-cyan-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, Dr. {user?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Check your schedule and patient updates.</p>
        </div>
        <button onClick={() => { setRefreshing(true); fetchAll(); }} className="btn-secondary" disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Sync Schedule
        </button>
      </div>

      <OnboardingGuide />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 mb-6">Patient Consultation Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="card p-6 flex flex-col h-full bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                    Investigation Tracker
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Clinical Sync</p>
                </div>
                <button 
                  onClick={() => router.push(`/${slug}/doctor/investigations`)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all group/btn"
                >
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {investigations.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-30">
                    <Beaker className="w-12 h-12 mb-4 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No active orders<br/>found in clinical feed</p>
                  </div>
                ) : investigations.map((inv) => (
                  <div key={inv.id} className="p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-2xl transition-all duration-300 group/inv flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        inv.origin === 'Laboratory' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      )}>
                        {inv.origin === 'Laboratory' ? <Beaker className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{inv.test_name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <p className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[100px]">{inv.patient?.full_name}</p>
                           <span className="w-1 h-1 rounded-full bg-slate-300" />
                           <p className="text-[9px] text-slate-400 font-bold uppercase">{inv.origin}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-end gap-1">
                       <span className={cn(
                         "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                         inv.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                         inv.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                         "bg-indigo-100 text-indigo-700"
                       )}>
                         {inv.status}
                       </span>
                       {inv.status === 'Completed' && (
                         <CheckCircle className="w-3 h-3 text-emerald-500 animate-in fade-in zoom-in" />
                       )}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
