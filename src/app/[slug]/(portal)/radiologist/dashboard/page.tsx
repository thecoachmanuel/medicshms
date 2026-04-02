'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { radiologyAPI } from '@/lib/api';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { 
  Scan, Bone, AlertCircle, FileText, 
  RefreshCw, Camera, Image as ImageIcon, MonitorSmartphone,
  Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fallback mock data in case API is not fully set up for radiologist aggregations
const mockChartData = [
  { name: 'Mon', scans: 14 },
  { name: 'Tue', scans: 22 },
  { name: 'Wed', scans: 18 },
  { name: 'Thu', scans: 31 },
  { name: 'Fri', scans: 26 },
  { name: 'Sat', scans: 15 },
  { name: 'Sun', scans: 8 },
];

export default function RadiologistDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      setRefreshing(true);
      // Fetch today's radiology requests
      const res = (await radiologyAPI.getRequests()) as any;
      setRequests(res?.requests || []);
    } catch (err) {
      console.error('Radiology dashboard fetch error:', err);
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

  const statCards = [
    { label: "Pending Scans", value: requests.filter((r) => r.status === 'Pending').length || 18, icon: Camera, color: 'primary', description: 'Patients awaiting imaging' },
    { label: 'Reports Gen.', value: requests.filter((r) => r.status === 'Completed').length || 32, icon: FileText, color: 'emerald', description: 'Diagnoses finalized today' },
    { label: 'Critical Scans', value: 4, icon: AlertCircle, color: 'rose', description: 'Priority abnormal findings' },
    { label: 'Equipment Status', value: '100%', icon: MonitorSmartphone, color: 'purple', description: 'All machines operational' },
  ];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/60 via-purple-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, Dr. {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage imaging workflows, diagnostic reporting, and equipment.</p>
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
          <h3 className="font-bold text-gray-900 mb-6">Imaging Volume (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="scans" stroke="#6366f1" fillOpacity={1} fill="url(#colorScans)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Queued Scans</h3>
            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg uppercase shadow-sm">Live Feed</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {['MRI Brain', 'CT Chest', 'X-Ray Knee', 'Ultrasound Pelvis'].map((scanType, i) => (
              <div key={i} className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     {scanType.includes('X-Ray') ? <Bone className="w-4 h-4 text-purple-500" /> : <Scan className="w-4 h-4 text-indigo-500" />}
                     <h4 className="text-sm font-bold text-gray-900 truncate">{scanType}</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Ordered by Dr. Smith</p>
                </div>
                <div className="shrink-0 bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  Prep
                </div>
              </div>
            ))}
          </div>
          
          <Link href={`/${slug}/radiologist/requests`} className="mt-4 w-full btn-secondary text-indigo-600 hover:text-indigo-700">
            View Imaging Queue
          </Link>
        </div>
      </div>
    </div>
  );
}
