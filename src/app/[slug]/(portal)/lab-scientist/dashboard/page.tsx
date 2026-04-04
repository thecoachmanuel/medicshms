'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { labAPI } from '@/lib/api';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { 
  Microscope, TestTube2, AlertCircle, CheckCircle2, 
  RefreshCw, ClipboardList, Clock, Activity, User
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LabScientistDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      setRefreshing(true);
      // Fetch today's lab requests - using standardized response handling
      const res = await labAPI.getRequests() as any;
      const data = res?.data || (Array.isArray(res) ? res : []);
      setRequests(data);
    } catch (err) {
      console.error('Lab dashboard fetch error:', err);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const stats = React.useMemo(() => {
    const safeRequests = Array.isArray(requests) ? requests : [];
    const pending = safeRequests.filter(r => r?.status === 'Pending').length;
    const completedToday = safeRequests.filter(r => r?.status === 'Completed' && new Date(r.completed_at || r.updated_at).toDateString() === new Date().toDateString()).length;
    const collected = safeRequests.filter(r => ['Collected', 'In Progress', 'Completed', 'Verified'].includes(r?.status)).length;
    const critical = safeRequests.filter(r => r?.is_critical).length;
    
    // Calculate TAT (Turnaround Time) in Minutes
    const completedRequests = safeRequests.filter(r => r?.completed_at && r?.requested_at);
    const avgTAT = completedRequests.length > 0 
      ? Math.round(completedRequests.reduce((acc, curr) => {
          const diff = new Date(curr.completed_at).getTime() - new Date(curr.requested_at).getTime();
          return acc + (diff / (1000 * 60));
        }, 0) / completedRequests.length)
      : 0;

    return { pending, completedToday, collected, critical, avgTAT };
  }, [requests]);

  const statCards = [
    { label: "Pending Tests", value: stats.pending, icon: Clock, color: 'amber', description: 'Tests awaiting specimen collection' },
    { label: 'Avg Turnaround', value: `${stats.avgTAT}m`, icon: Activity, color: 'indigo', description: 'Average time to result delivery' },
    { label: 'Samples Collected', value: stats.collected, icon: TestTube2, color: 'blue', description: 'Total specimens in laboratory' },
    { label: 'Critical Results', value: stats.critical, icon: AlertCircle, color: 'rose', description: 'Priority abnormal findings' },
  ];

  // Group by Test Name for Volume Chart
  const chartData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => {
      const name = r.test_name || 'Unofficial Test';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, tests]) => ({ name, tests }))
      .sort((a, b) => b.tests - a.tests)
      .slice(0, 5);
  }, [requests]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="relative min-h-screen space-y-8 pb-12">
      {/* Premium Diagnostic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-indigo-50/10 to-transparent -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100">
               <Microscope className="w-6 h-6 text-white" />
             </div>
             Informatics Matrix
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-16">Diagnostic insights for {user?.name || 'Chief Scientist'}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all" disabled={refreshing}>
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </button>
          <Link 
            href={`/${slug}/lab-scientist/requests`}
            className="btn-primary bg-gray-900 border-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3"
          >
            <ClipboardList className="w-4 h-4" />
            Enter Workstation
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card as any} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card bg-white/70 backdrop-blur-xl border-white/50 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Diagnostic Volume</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Top performing protocols</p>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 900 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 900 }} width={120} />
                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="tests" radius={[0, 8, 8, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-white/70 backdrop-blur-xl border-white/50 p-8 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Rapid Queue</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Live Diagnostic Stream</p>
             </div>
             <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-indigo-400" />
                  </div>
                ))}
             </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {requests.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-4 opacity-50">
                    <TestTube2 className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-relaxed">System Idle<br/>No active investigations</p>
               </div>
            ) : (
              requests.slice(0, 6).map((req, i) => (
                <div key={req.id || i} className="p-4 bg-white border border-gray-50 rounded-2xl hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex justify-between items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                       <TestTube2 className={cn(
                         "w-4 h-4 transition-colors",
                         req.status === 'Pending' ? "text-amber-500" : "text-indigo-500"
                       )} />
                       <h4 className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{req.test_name}</h4>
                    </div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                       <User className="w-3 h-3" />
                       {req.patient?.full_name || 'Anonymous Subject'}
                    </p>
                  </div>
                  <div className={cn(
                    "shrink-0 rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase tracking-tighter border transition-all group-hover:scale-105",
                    req.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    req.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}>
                    {req.status}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Link 
            href={`/${slug}/lab-scientist/requests`} 
            className="mt-6 w-full py-4 text-center bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-inner"
          >
            All Diagnostic Logs
          </Link>
        </div>
      </div>
    </div>
  );
}
