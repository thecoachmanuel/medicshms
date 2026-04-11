'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Activity, Stethoscope, Microscope, Pill, FileText, 
  Search, Filter, ChevronRight, TrendingUp, TrendingDown,
  LineChart, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import HospitalLogo from '@/components/common/HospitalLogo';

export default function ProductivityHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  function ProductivityContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
    { id: 4, name: 'Mary Adesuwa', role: 'Nurse', dept: 'Triage', score: 99, metric: '1,204 Vitals Logged', trend: '+20%', status: 'optimal' },
    { id: 5, name: 'David Smith', role: 'Pharmacist', dept: 'Main Pharmacy', score: 91, metric: '540 Prescriptions', trend: '+1%', status: 'optimal' },
  ];

  useEffect(() => {
    // Simulate real API load
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredStaff = activeTab === 'All' ? performanceData : performanceData.filter(d => d.role === activeTab);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-12 h-12 text-indigo-200 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Aggregating Global Productivity Metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <LineChart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Productivity Hub</h1>
            <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">Holistic Staff Performance Architecture</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm">
             <Download className="w-4 h-4" /> Export Report
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
         {[
           { label: 'Network Efficiency', value: '94%', sub: 'Optimal Range', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
           { label: 'Active Personnel', value: '42', sub: 'On Duty Today', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
           { label: 'Avg Turnaround', value: '14m', sub: 'Across All Depts', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
           { label: 'Critical Tasks', value: '3', sub: 'Requires Attention', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-indigo-100 transition-all">
             <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full pointer-events-none" />
             <div className={cn("w-12 h-12 rounded-[1rem] flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
               <stat.icon className="w-6 h-6" />
             </div>
             <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">{stat.value}</p>
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
             <p className="text-[10px] font-bold text-gray-400 mt-1">{stat.sub}</p>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full">
               {['All', 'Doctor', 'Nurse', 'Lab Scientist', 'Radiologist', 'Pharmacist'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setActiveTab(t)}
                   className={cn(
                     "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                     activeTab === t ? "bg-gray-900 text-white shadow-md shadow-gray-900/20" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                   )}
                 >
                   {t}
                 </button>
               ))}
            </div>
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search personnel..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans placeholder:font-black tracking-widest uppercase" />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                 <tr className="bg-white border-b border-gray-100">
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel ID</th>
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Department</th>
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Output Metric</th>
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Efficiency Score</th>
                   <th className="px-8 py-5 text-right w-24"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 bg-white">
                 {filteredStaff.map((staff) => (
                   <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors group">
                     <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-200">
                           {staff.name.charAt(0)}{staff.name.split(' ')?.[1]?.charAt(0) || ''}
                         </div>
                         <div>
                           <p className="text-sm font-black text-gray-900 leading-tight">{staff.name}</p>
                           <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{staff.role}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-5">
                       <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{staff.dept}</span>
                     </td>
                     <td className="px-8 py-5">
                       <p className="text-xs font-black text-gray-900">{staff.metric}</p>
                       <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1", staff.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500')}>
                         {staff.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                         {staff.trend} vs last week
                       </p>
                     </td>
                     <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                         <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div className={cn(
                             "h-full rounded-full",
                             staff.score > 90 ? "bg-emerald-500" : staff.score > 80 ? "bg-indigo-500" : "bg-rose-500"
                           )} style={{ width: `${staff.score}%` }} />
                         </div>
                         <span className="text-sm font-black text-gray-900 w-8">{staff.score}</span>
                       </div>
                     </td>
                     <td className="px-8 py-5 text-right">
                       <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-all">
                         <ChevronRight className="w-4 h-4" />
                       </button>
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

// Download icon helper
function Download(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
