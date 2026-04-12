'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { pharmacyAPI } from '@/lib/api';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { 
  Pill, Stethoscope, AlertTriangle, Package, 
  RefreshCw, FileWarning, CheckCircle, TrendingDown 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dispensing Volume Chart Data will be computed from live data if possible

export default function PharmacistDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      setRefreshing(true);
      // Fetch today's prescriptions
      const res = await pharmacyAPI.getPrescriptions() as any;
      setPrescriptions(res?.prescriptions || []);
    } catch (err) {
      console.error('Pharmacist dashboard fetch error:', err);
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
    { label: "New Prescriptions", value: prescriptions.filter((p) => p.status === 'Pending').length, icon: FileWarning, color: 'amber', description: 'Awaiting fulfillment' },
    { label: 'Dispensed Today', value: prescriptions.filter((p) => p.status === 'Dispensed').length, icon: CheckCircle, color: 'emerald', description: 'Successfully processed' },
    { label: 'Low Stock Items', value: 0, icon: TrendingDown, color: 'rose', description: 'Inventory running low' },
    { label: 'Total Inventory', value: 0, icon: Package, color: 'blue', description: 'Active pharmaceutical items' },
  ];

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/40 via-amber-50/20 to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, Pharmacist {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage pharmacy operations, prescriptions, and inventory stock.</p>
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
          <h3 className="font-bold text-gray-900 mb-6">Weekly Drugs Dispensed Trend</h3>
          <div className="h-80 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] opacity-40">
            <Package className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest">Inventory trends will appear here as data accumulates</p>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Live Prescriptions</h3>
            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg uppercase shadow-sm">Review Needed</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {prescriptions.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-30">
                 <Pill className="w-12 h-12 mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">System Synchronized<br/>No Active Prescriptions</p>
               </div>
            ) : (prescriptions || []).slice(0, 5).map((p, i) => (
              <div key={p.id || i} className="p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 truncate">RX-{p.id?.slice(-6).toUpperCase()}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3 h-3 text-gray-400" /> {p.patient?.full_name || 'Subject'}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "shrink-0 w-2 h-2 rounded-full",
                  p.status === 'Pending' ? "bg-amber-500" : "bg-emerald-500"
                )}></div>
              </div>
            ))}
          </div>
          
          <Link href={`/${slug}/pharmacist/prescriptions`} className="mt-4 w-full btn-secondary text-orange-600 hover:text-orange-700">
            View Dispense Queue
          </Link>
        </div>
      </div>

    </div>
  );
}
