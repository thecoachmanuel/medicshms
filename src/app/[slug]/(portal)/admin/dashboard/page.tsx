'use client';

import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { dashboardAPI } from '@/lib/api';
import { getLagosDate, formatDate, formatCurrency } from '@/lib/utils';
import {
  RefreshCw, Calendar, Building2, AlertCircle,
  Wallet, UserCheck, Activity, Users as UsersIcon,
  Stethoscope, BarChart3, PieChart as PieChartIcon, TrendingUp
} from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
const BAR_COLORS = { total: '#6366f1', completed: '#22c55e', cancelled: '#f87171' };

const timeAgo = (date: string) => {
  const now = getLagosDate();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(date);
};

export default function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, appointmentsData, activityData, monthlyAptData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentAppointments(),
        dashboardAPI.getActivityFeed(),
        dashboardAPI.getChartData('monthly-appointments'),
      ]) as [any, any, any, any];

      setStats(statsData as any);
      setRecentAppointments(appointmentsData as any);
      setActivityFeed(activityData as any);
      setMonthlyAppointments(monthlyAptData as any);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'Admin') {
      router.push(`/${slug}/${user.role.toLowerCase()}/dashboard`);
    }
    fetchAll();
  }, [fetchAll, user, authLoading, router, slug]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Patients', value: stats.cards.totalPatients.value, icon: UsersIcon, color: 'blue', description: 'Overall registered patients' },
    { label: "Today's Appointments", value: stats.cards.todayAppointments.value, icon: Calendar, color: 'purple', description: 'Scheduled for follow-up/consult' },
    { label: 'Active Doctors', value: stats.cards.totalDoctors.value, icon: Stethoscope, color: 'emerald', description: 'Doctors currently enabled' },
    { 
      label: 'Monthly Revenue', 
      value: formatCurrency(stats.cards.monthRevenue.value), 
      icon: Wallet, 
      color: 'amber', 
      description: `Target: ${formatCurrency(stats.cards.monthRevenue.projected)} (Forecast)`,
      trend: { value: stats.cards.monthRevenue.change, isPositive: stats.cards.monthRevenue.change >= 0 }
    },
    { 
      label: 'Collection Rate', 
      value: `${stats.cards.monthRevenue.collectionRate}%`, 
      icon: TrendingUp, 
      color: 'rose', 
      description: 'Efficiency of billed vs collected',
      progress: stats.cards.monthRevenue.collectionRate
    },
  ] : [];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/40 via-purple-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening at your hospital today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Monthly Velocity: {formatCurrency(stats?.cards.monthRevenue.value / (new Date().getDate() || 1))}/day</span>
            </div>
          </div>
          <button 
            onClick={() => { setRefreshing(true); fetchAll(); }}
            className="btn-secondary whitespace-nowrap bg-white/50 backdrop-blur-md"
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-8 bg-white/90 backdrop-blur-xl border-white shadow-2xl shadow-indigo-100/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Revenue Intelligence</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">6-Month Financial Velocity (Actual vs Collected)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-indigo-500 shadow-lg shadow-indigo-200" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Billed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-lg shadow-emerald-200" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Collected</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full ml--4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: '900' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: '900' }}
                  tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                  itemStyle={{ padding: '0px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Total Billed"
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="paid" 
                  name="Total Collected"
                  stroke="#22c55e" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPaid)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 bg-slate-900 border-slate-800 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-white text-lg uppercase tracking-tight flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-400" />
                Yield Map
              </h3>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">By Dept</span>
            </div>

            <div className="h-64 w-full relative mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.departmentRevenue || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {(stats?.departmentRevenue || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', background: '#0f172a', color: '#f8fafc', fontSize: '11px', fontWeight: '900' }}
                    formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Yield']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Efficiency</p>
                <p className="text-xl font-black text-white">{stats?.cards.monthRevenue.collectionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(stats?.departmentRevenue || []).slice(0, 4).map((dept: any, index: number) => (
                <div key={index} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-white transition-colors">{dept.name}</span>
                  </div>
                  <p className="text-xs font-black text-white">{formatCurrency(dept.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Latest Appointments</h3>
          <Link href={`/${slug}/admin/appointments`} className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentAppointments.slice(0, 5).map((apt, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{apt.patientName}{apt.age ? ` (${apt.age}y)` : ''}</p>
                    <p className="text-xs text-gray-500">{apt.patientId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{apt.department}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      apt.status === 'Confirmed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 font-medium">{apt.appointmentTime}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{formatDate(apt.appointmentDate)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
