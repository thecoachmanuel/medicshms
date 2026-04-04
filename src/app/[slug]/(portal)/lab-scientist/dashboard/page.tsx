'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { labAPI } from '@/lib/api';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { 
  Microscope, TestTube2, AlertCircle, CheckCircle2, 
  RefreshCw, ClipboardList, Clock, Activity 
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
      // Fetch today's lab requests
      const res = await labAPI.getRequests() as any;
      setRequests(res?.requests || []);
    } catch (err) {
      console.error('Lab dashboard fetch error:', err);
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
    const pending = requests.filter(r => r.status === 'Pending').length;
    const completedToday = requests.filter(r => r.status === 'Completed' && new Date(r.completed_at).toDateString() === new Date().toDateString()).length;
    const collected = requests.filter(r => ['Collected', 'In Progress', 'Completed'].includes(r.status)).length;
    const critical = requests.filter(r => r.is_critical).length;
    
    // Calculate TAT (Turnaround Time) in Minutes
    const completedRequests = requests.filter(r => r.completed_at && r.requested_at);
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
      counts[r.test_name] = (counts[r.test_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, tests]) => ({ name, tests }))
      .sort((a, b) => b.tests - a.tests)
      .slice(0, 5);
  }, [requests]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-indigo-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage laboratory analyses, samples, and results.</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary" disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card as any} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 mb-6">Test Volume by Department</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="tests" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Recent Requests</h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg uppercase">Live</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <Microscope className="w-4 h-4 text-primary-500" />
                     <h4 className="text-sm font-bold text-gray-900 truncate">Complete Blood Count</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Patient #{3055 + i}</p>
                </div>
                <div className="shrink-0 bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
                  Pending
                </div>
              </div>
            ))}
          </div>
          
          <Link href={`/${slug}/lab-scientist/requests`} className="mt-4 w-full btn-secondary text-primary-600 hover:text-primary-700">
            View All Lab Requests
          </Link>
        </div>
      </div>
    </div>
  );
}
