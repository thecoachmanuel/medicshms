'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { dashboardAPI } from '@/lib/api';
import { formatDate, getLagosDate, formatCurrency } from '@/lib/utils';
import {
  Calendar, Users, Stethoscope, IndianRupee, UserPlus,
  FileWarning, RefreshCw, CalendarDays, Activity,
  Wallet, ListChecks, UserCog
} from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ReceptionistDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, aptsRes, dailyRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentAppointments(),
        dashboardAPI.getChartData('daily-appointments'),
      ]) as [any, any, any];
      setStats(statsRes);
      setRecentAppointments(aptsRes);
      setDailyAppointments(dailyRes);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'Receptionist') {
      router.push(`/${slug}/${user.role.toLowerCase()}/dashboard`);
    }
    fetchAll(); 
  }, [fetchAll, user, authLoading, router, slug]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const statCards = stats ? [
    { label: "Today's Appointments", value: stats.cards.todayAppointments.value, icon: Calendar, color: 'purple', description: 'Appointments scheduled for today' },
    { label: 'Total Patients', value: stats.cards.totalPatients.value, icon: Users, color: 'blue', description: 'Total patients in system' },
    { label: 'Active Doctors', value: stats.cards.totalDoctors.value, icon: Stethoscope, color: 'emerald', description: 'Doctors currently on duty' },
    { label: 'New Patients', value: stats.cards.newPatients.value, icon: UserPlus, color: 'cyan', description: 'New registrations this month' },
    { label: 'Monthly Revenue', value: formatCurrency(stats.cards.monthRevenue.value), icon: Wallet, color: 'amber', description: 'Total revenue this month' },
    { label: 'Pending Bills', value: stats.cards.pendingBills.value, icon: FileWarning, color: 'rose', description: 'Unpaid or partial bills' },
  ] : [];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-50/40 via-purple-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Hello, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage patient registrations and appointments.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
            <CalendarDays className="w-4 h-4" />
            {formatDate(getLagosDate())}
          </span>
          <button onClick={() => { setRefreshing(true); fetchAll(); }} className="btn-secondary" disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <DashboardCard key={i} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-6">Daily Appointments Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyAppointments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Appointments</h3>
            <button className="text-xs font-bold text-primary-600 hover:text-primary-700">View Queue</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Doctor</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAppointments.slice(0, 6).map((apt, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm font-bold text-gray-900">{apt.patientName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{apt.patientId}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{apt.doctorName}</td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        apt.status === 'Confirmed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
