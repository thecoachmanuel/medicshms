'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doctorDashboardAPI } from '@/lib/api';
import {
  Calendar, Users, Stethoscope, TrendingUp,
  CheckCircle, Clock, RefreshCw, Activity, Heart,
  ClipboardList, Users as UsersIcon, LayoutDashboard
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
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
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
  const [activity, setActivity] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, todayData, activityData, monthlyData] = await Promise.all([
        doctorDashboardAPI.getStats(),
        doctorDashboardAPI.getTodayAppointments(),
        doctorDashboardAPI.getActivity(),
        doctorDashboardAPI.getChartData('monthly-trend'),
      ]) as [any, any, any, any];

      setStats(statsData);
      setTodayAppointments(todayData);
      setActivity(activityData);
      setMonthlyTrend(monthlyData);
    } catch (err) {
      console.error('Doctor dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'Doctor') {
      router.push(`/${slug}/${user.role.toLowerCase()}/dashboard`);
    }
    fetchAll();
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
    { label: "Today's Queue", value: stats.cards.todayAppointments, icon: Clock, color: 'indigo', description: 'Patients waiting for consultation' },
    { label: 'Completed', value: stats.cards.totalCompleted, icon: CheckCircle, color: 'emerald', description: 'Total successful consultations' },
    { label: 'My Patients', value: stats.cards.uniquePatients, icon: UsersIcon, color: 'purple', description: 'Unique patients treated overall' },
    { label: 'Consultations', value: stats.cards.monthConsultations, icon: Activity, color: 'amber', description: 'Consultations this month' },
  ] : [];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-6">Today's Appointments</h3>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? todayAppointments.map((apt, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{apt.patientName}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{apt.appointmentTime}</p>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  apt.status === 'Confirmed' ? "text-blue-600" : "text-emerald-600"
                )}>
                  {apt.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No appointments for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
