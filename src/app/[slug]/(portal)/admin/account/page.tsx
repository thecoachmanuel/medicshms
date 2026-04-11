'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  CreditCard, ShieldCheck, Zap, Download, FileText, 
  ChevronRight, Calendar, AlertTriangle, CheckCircle2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/context/SettingsContext';

export default function AccountManagementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate real API load
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading || settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CreditCard className="w-12 h-12 text-indigo-200 animate-spin-slow" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing Enterprise Billing Hub...</p>
      </div>
    );
  }

  // Display data based on hospital details - static for presentation, mapped to DB in prod
  const currentPlan = "Enterprise Scale";
  const status = "Active";
  const renewalDate = "Oct 24, 2026";
  const cost = 249;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Account & Billing</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your SaaS deployment and subscription infrastructure</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Subscription Status Card */}
           <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 shadow-xl shadow-gray-900/10 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-indigo-500/30 transition-all" />
             
             <div className="flex justify-between items-start relative z-10">
               <div>
                 <div className="flex items-center gap-3 mb-4">
                   <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {status}
                   </span>
                   <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                     Annual Billing
                   </span>
                 </div>
                 <h2 className="text-4xl font-black tracking-tighter mb-2">{currentPlan} Plan</h2>
                 <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Next renewal on {renewalDate}</p>
               </div>
               <div className="text-right">
                 <p className="text-4xl font-black tracking-tighter">${cost}<span className="text-lg text-gray-500">/mo</span></p>
               </div>
             </div>

             <div className="mt-12 grid sm:grid-cols-3 gap-4 relative z-10 border-t border-white/10 pt-8">
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Patients Limit</p>
                 <div className="flex items-center justify-between text-sm font-black">
                   <span>24,500</span>
                   <span className="text-gray-500">Unlimited</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full w-[40%] bg-indigo-500 rounded-full" /></div>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Staff Seats</p>
                 <div className="flex items-center justify-between text-sm font-black">
                   <span>42</span>
                   <span className="text-gray-500">200</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full w-[21%] bg-emerald-500 rounded-full" /></div>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Storage</p>
                 <div className="flex items-center justify-between text-sm font-black">
                   <span>48 GB</span>
                   <span className="text-gray-500">500 GB</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full w-[10%] bg-amber-500 rounded-full" /></div>
               </div>
             </div>
           </div>

           {/* Invoices */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                 <FileText className="w-4 h-4 text-gray-400" /> Billing History
               </h3>
               <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">View All</button>
             </div>
             <div>
               {[
                 { date: 'Oct 24, 2025', desc: 'Enterprise Annual Renewal', amount: '$2,988.00', status: 'Paid', id: 'INV-2025-10-001' },
                 { date: 'Oct 24, 2024', desc: 'Enterprise Annual Subscription', amount: '$2,988.00', status: 'Paid', id: 'INV-2024-10-045' },
                 { date: 'Nov 01, 2023', desc: 'Server Migration Assistance', amount: '$500.00', status: 'Paid', id: 'INV-2023-11-200' },
               ].map((inv, idx) => (
                 <div key={idx} className="flex items-center justify-between p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                       <FileText className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="text-sm font-black text-gray-900">{inv.desc}</p>
                       <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{inv.date} &bull; {inv.id}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                     <div className="text-right">
                       <p className="text-sm font-black text-gray-900">{inv.amount}</p>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">{inv.status}</p>
                     </div>
                     <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                       <Download className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           {/* Payment Method */}
           <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden border-t-4 border-t-indigo-600">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Method</h3>
               <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Update</button>
             </div>
             <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[10px] font-black italic text-gray-500 tracking-tighter">VISA</div>
                 <div>
                   <p className="text-xs font-black text-gray-900 tracking-widest">•••• 4242</p>
                   <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Expires 12/28</p>
                 </div>
               </div>
             </div>
             <div className="flex gap-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed bg-emerald-50 text-emerald-700 p-3 rounded-xl">
               <Lock className="w-4 h-4 shrink-0 mt-0.5" /> Data protected by AES-256 bank-grade encryption.
             </div>
           </div>

           {/* Enterprise Support Add-on */}
           <div className="p-8 bg-gradient-to-b from-indigo-50 to-white rounded-[2rem] border border-indigo-100/50 shadow-sm text-center">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 mx-auto mb-6">
               <Zap className="w-8 h-8 text-indigo-500" />
             </div>
             <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-2">Dedicated Infrastructure</h3>
             <p className="text-xs font-bold text-gray-500 leading-relaxed mb-6">Need a fully isolated private cloud instance with HIPAA/SOC2 compliance guarantees and SLA?</p>
             <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors shadow-lg active:scale-95">
               Contact Enterprise Sales
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
