'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  CreditCard, ShieldCheck, Zap, Download, FileText, 
  ChevronRight, Calendar, AlertTriangle, CheckCircle2,
  Lock, DollarSign, Clock, LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AccountManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.get('/account') as any;
      setData(res.data);
    } catch (error) {
      toast.error('Failed to sync financial data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CreditCard className="w-12 h-12 text-indigo-200 animate-spin-slow" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing Enterprise Billing Hub...</p>
      </div>
    );
  }

  const { revenueStats, hospital, recentTransactions } = data || { revenueStats: {}, hospital: {}, recentTransactions: [] };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-10 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            Account & Billing
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Manage your hospital's platform subscription and financial oversight.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Subscription Card */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                       <ShieldCheck className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                       {hospital?.subscription_status || 'Active'}
                    </div>
                 </div>
                 
                 <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.2em] mb-2">Current Plan</p>
                 <h2 className="text-3xl font-black tracking-tight mb-8">{hospital?.plan_name || 'Enterprise Scale'}</h2>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between text-sm py-4 border-t border-white/10">
                       <span className="text-indigo-300 font-medium">Next Renewal</span>
                       <span className="font-bold">{hospital?.trial_end_date ? new Date(hospital.trial_end_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                 </div>

                 <button className="w-full mt-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Zap className="w-4 h-4" />
                    Upgrade Infrastructure
                 </button>
              </div>
           </div>

           <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Revenue Summary</h3>
              <div className="space-y-4">
                 <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                    <div>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Collected</p>
                       <p className="text-xl font-black text-gray-900">₦ {revenueStats.totalRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                       <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                    <div>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Awaiting Payment</p>
                       <p className="text-xl font-black text-gray-900">₦ {revenueStats.pendingRevenue?.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                       <Clock className="w-5 h-5 text-rose-500" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm overflow-hidden min-h-[600px]">
              <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Financial Ledger</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Live Transaction History</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors">
                       <FileText className="w-5 h-5" />
                    </button>
                 </div>
              </div>

              <div className="p-4 overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Timestamp</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4 text-right">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {recentTransactions.map((tx: any, i: number) => (
                          <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                             <td className="px-6 py-6">
                                <p className="text-sm font-black text-gray-900 uppercase">TXN-{tx.id?.slice(0, 8)}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Reference UID</p>
                             </td>
                             <td className="px-6 py-6">
                                <p className="text-xs font-bold text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(tx.created_at).toLocaleTimeString()}</p>
                             </td>
                             <td className="px-6 py-6">
                                <p className="text-sm font-black text-gray-900">₦ {tx.amount?.toLocaleString()}</p>
                             </td>
                             <td className="px-6 py-6 text-right">
                                <div className={cn(
                                   "inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                   tx.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                   {tx.status}
                                </div>
                             </td>
                          </tr>
                       ))}
                       {recentTransactions.length === 0 && (
                          <tr>
                             <td colSpan={4} className="px-6 py-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">No transaction records found</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
