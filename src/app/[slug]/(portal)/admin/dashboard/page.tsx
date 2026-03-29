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
  Stethoscope
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
    { label: 'Monthly Revenue', value: formatCurrency(stats.cards.monthRevenue.value), icon: Wallet, color: 'amber', description: 'Total revenue this month' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening at your hospital today.</p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); fetchAll(); }}
          className="btn-secondary whitespace-nowrap"
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Appointments Overview</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#6366f1]" /> Total
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Completed
              </span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAppointments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {activityFeed.slice(0, 6).map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{timeAgo(item.time)}</p>
                </div>
              </div>
            ))}
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
