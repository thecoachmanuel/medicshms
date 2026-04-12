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
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const results = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentAppointments(),
        dashboardAPI.getActivityFeed(),
        dashboardAPI.getChartData('monthly-appointments'),
      ]);

      const [statsRes, appointmentsRes, activityRes, monthlyAptRes] = results;

      if (statsRes.status === 'fulfilled') {
        // Ensure we handle both wrapped (data) and unwrapped responses safely
        const statsData = statsRes.value.data || statsRes.value;
        if (statsData && typeof statsData === 'object' && Object.keys(statsData).length > 0) {
          setStats(statsData);
        }
      } else {
        console.error('Stats fetch error:', statsRes.reason);
        setError('Partial data loading error. Some statistics may be missing.');
      }

      if (appointmentsRes.status === 'fulfilled') {
        const aptsData = appointmentsRes.value.data || appointmentsRes.value;
        setRecentAppointments(Array.isArray(aptsData) ? aptsData : []);
      }
      
      if (activityRes.status === 'fulfilled') {
        const feedData = activityRes.value.data || activityRes.value;
        setActivityFeed(Array.isArray(feedData) ? feedData : []);
      }

      if (monthlyAptRes.status === 'fulfilled') {
        const chartData = monthlyAptRes.value.data || monthlyAptRes.value;
        setMonthlyAppointments(Array.isArray(chartData) ? chartData : []);
      }

    } catch (err: any) {
      console.error('Critical Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please check your connection or contact support.');
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Monthly Velocity: {formatCurrency((stats?.cards.monthRevenue.value || 0) / (new Date().getDate() || 1))}/day</span>
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

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-rose-900 font-black uppercase tracking-tight text-sm">Data Synchronisation Issue</h4>
            <p className="text-rose-600/80 text-xs font-medium mt-1 uppercase tracking-wider leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-8 bg-slate-900 border-slate-800 text-white relative overflow-hidden shadow-2xl">
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
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-white transition-colors truncate">{dept.name}</span>
                  </div>
                  <p className="text-xs font-black text-white">{formatCurrency(dept.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-8 bg-white/90 backdrop-blur-xl border-white shadow-2xl shadow-indigo-100/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Revenue Intelligence</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">6-Month Financial Velocity (Actual vs Collected)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-indigo-500 shadow-lg shadow-indigo-200" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest uppercase tracking-widest">Billed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-lg shadow-emerald-200" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest uppercase tracking-widest">Collected</span>
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
      </div>

      <div className="card p-8 bg-white/90 backdrop-blur-xl border-white shadow-2xl shadow-indigo-100/30">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Clinical Efficiency</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">12-Month Operational Volume (Completed vs Cancelled)</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-indigo-500 shadow-lg shadow-indigo-200" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-lg shadow-emerald-200" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-rose-500 shadow-lg shadow-rose-200" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cancelled</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full ml--4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyAppointments}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: '900' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: '900' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              <Bar dataKey="total" name="Total Appointments" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} animationDuration={1000} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={20} animationDuration={1500} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} animationDuration={2000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden border-white shadow-xl shadow-slate-200/50">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Case Velocity</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Clinical appointment queue analytics</p>
            </div>
            <Link href={`/${slug}/admin/appointments`} className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-[0.2em] bg-primary-50 px-3 py-1.5 rounded-xl no-underline">View All Records</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Patient Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Clinical State</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Schedule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAppointments.slice(0, 5).map((apt, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors">{apt.patientName}{apt.age ? ` (${apt.age}y)` : ''}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{apt.appointmentId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight px-3 py-1.5 bg-gray-100 rounded-xl">{apt.department}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                        apt.status === 'Confirmed' ? "bg-emerald-500 text-white" : 
                        apt.status === 'Completed' ? "bg-indigo-500 text-white" :
                        apt.status === 'Cancelled' ? "bg-rose-500 text-white" :
                        "bg-amber-500 text-white"
                      )}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-900 font-black">{apt.appointmentTime}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{formatDate(apt.appointmentDate)}</p>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentAppointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No clinical records captured today</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 card p-8 bg-white/95 backdrop-blur-xl border-white shadow-2xl shadow-indigo-100/30">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Pulse Feed</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Real-time hospital signals</p>
            </div>
            <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
          </div>

          <div className="space-y-6">
            {activityFeed.slice(0, 5).map((activity, i) => (
              <div key={i} className="flex gap-4 group cursor-default">
                <div className="mt-1 shrink-0 relative">
                  <div className={cn(
                    "w-10 h-10 rounded-[1rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                    activity.type === 'appointment' ? "bg-indigo-50 text-indigo-500 shadow-indigo-100" :
                    activity.type === 'bill' ? "bg-emerald-50 text-emerald-500 shadow-emerald-100" :
                    activity.type === 'support' ? "bg-rose-50 text-rose-500 shadow-rose-100" :
                    "bg-amber-50 text-amber-500 shadow-amber-100"
                  )}>
                    {activity.type === 'appointment' ? <Calendar className="w-4 h-4" /> :
                     activity.type === 'bill' ? <Wallet className="w-4 h-4" /> :
                     activity.type === 'support' ? <AlertCircle className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  {i < activityFeed.slice(0, 5).length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-100" />
                  )}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{activity.title}</p>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">{timeAgo(activity.time)}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-relaxed">{activity.description}</p>
                </div>
              </div>
            ))}
            {activityFeed.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Silence. Listening for signals...</p>
              </div>
            )}
          </div>

          {stats?.appointmentStatus && (
            <div className="mt-12 pt-12 border-t border-slate-100">
               <div>
                  <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-[0.2em] mb-6">Operations Mix</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Pending Docs', value: stats.appointmentStatus.pending, color: 'bg-amber-500', percentage: Math.round((stats.appointmentStatus.pending / stats.appointmentStatus.total) * 100) || 0 },
                      { label: 'Confirmed Path', value: stats.appointmentStatus.confirmed, color: 'bg-emerald-500', percentage: Math.round((stats.appointmentStatus.confirmed / stats.appointmentStatus.total) * 100) || 0 },
                      { label: 'Closed Cases', value: stats.appointmentStatus.completed, color: 'bg-indigo-500', percentage: Math.round((stats.appointmentStatus.completed / stats.appointmentStatus.total) * 100) || 0 }
                    ].map((row, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                          <span>{row.label}</span>
                          <span>{row.value} ({row.percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-1000", row.color)}
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
