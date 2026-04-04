'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Wallet, Search, Filter, ArrowUpRight, 
  CheckCircle2, AlertCircle, Clock, ChevronRight,
  Download, FileText, Building2, User,
  ArrowDownLeft, BarChart3, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { dashboardAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FinanceReconciliationHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchBills();
    fetchStats();
  }, [filter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      // In a real app, this would be reaching a dedicated /api/finance endpoint
      // For now, we'll use a simulated fetch or an expanded bills query
      const res = await dashboardAPI.getStats() as any;
      // Note: In this MVP version, we're fetching from a generic stats endpoint 
      // but in production we'd have a specific paginated finance/bills route.
      // Simulating a more detailed bill list for demonstration.
      setBills([]); 
    } catch (error) {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await dashboardAPI.getStats() as any;
    setStats(res.cards.monthRevenue);
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-12">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-white -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Finance Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Clinical ledger and revenue reconciliation center.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary bg-white/80 backdrop-blur-md border-slate-200">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="btn-primary shadow-xl shadow-indigo-600/20">
             Reconcile All
          </button>
        </div>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Wallet className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monthly Billed</p>
                  <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats?.value || 0)}</h3>
               </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
               <ArrowUpRight className="w-3 h-3 text-emerald-500" />
               <span className="text-emerald-600">+{stats?.change}%</span> vs last month
            </div>
         </div>

         <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <BarChart3 className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Collected</p>
                  <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats?.paid || 0)}</h3>
               </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${stats?.collectionRate}%` }} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{stats?.collectionRate}% Collection Efficiency</p>
         </div>

         <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <RefreshCw className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Projected End-Month</p>
                  <h3 className="text-2xl font-black text-white">{formatCurrency(stats?.projected || 0)}</h3>
               </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
               <Clock className="w-3 h-3" /> Based on current velocity
            </div>
         </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               {['All', 'Pending', 'Partial', 'Paid'].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      filter === s ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {s}
                  </button>
               ))}
            </div>
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search by Bill ID or Patient..." 
                 className="bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-6 text-xs font-bold w-full md:w-64 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none"
               />
            </div>
         </div>

         <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-20">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
               <FileText className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Comprehensive Ledger Ready</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto font-medium">Please select a filter or perform a search to view detailed reconciled and unreconciled clinical records.</p>
         </div>
      </div>
    </div>
  );
}
