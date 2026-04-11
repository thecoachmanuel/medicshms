'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Activity, Stethoscope, Microscope, Pill, FileText, 
  Search, Filter, ChevronRight, TrendingUp, TrendingDown,
  LineChart, CheckCircle2, AlertCircle, Clock, Scan
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ProductivityHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchProductivity();
  }, []);

  const fetchProductivity = async () => {
    setLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const res = await api.get('/productivity') as any;
      setStats(res.data);
    } catch (error) {
      toast.error('Failed to sync productivity metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-12 h-12 text-indigo-400 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Aggregating Global Productivity Metrics...</p>
      </div>
    );
  }

  const { summary, leaderBoard } = stats || { summary: {}, leaderBoard: [] };

  const filteredLeaderboard = activeTab === 'All' 
    ? leaderBoard 
    : leaderBoard.filter((p: any) => p.role === activeTab);

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
              <LineChart className="w-6 h-6 text-indigo-600" />
            </div>
            Productivity Hub
          </h1>
          <p className="text-gray-500 font-medium mt-1">Real-time tracking of clinical throughput and personnel efficiency.</p>
        </div>
        <div className="flex gap-4">
           <button onClick={fetchProductivity} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm">
             <Activity className="w-4 h-4" /> Refresh Matrix
           </button>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Completed Visits', value: summary.completedEncounters, trend: 'Daily Volume', icon: Stethoscope, color: 'indigo' },
          { label: 'Pending Labs', value: summary.pendingLabs, trend: 'Awaiting Result', icon: Microscope, color: 'blue' },
          { label: 'Pending Imaging', value: summary.pendingImaging, trend: 'In Queue', icon: Scan, color: 'rose' },
          { label: 'Total Scripts', value: summary.totalPrescriptions, trend: 'Pharmacy Flow', icon: Pill, color: 'emerald' }
        ].map((item, i) => (
          <div key={i} className="group bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
             <div className="flex items-center justify-between mb-4">
               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", 
                 item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 
                 item.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                 item.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
               )}>
                 <item.icon className="w-6 h-6" />
               </div>
               <Activity className="w-4 h-4 text-gray-200 group-hover:text-indigo-400" />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
             <h3 className="text-2xl font-black text-gray-900">{item.value?.toLocaleString() || '0'}</h3>
             <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">{item.trend}</p>
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
               <input type="text" placeholder="Filter personnel..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans placeholder:font-black tracking-widest uppercase" />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                 <tr className="bg-white border-b border-gray-100">
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel Profile</th>
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Designation</th>
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions Completed</th>
                   <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Throughput Rank</th>
                   <th className="px-8 py-5 text-right w-24"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 bg-white">
                 {filteredLeaderboard.map((p: any, i: number) => (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-xs uppercase">
                            {p.name?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-tight">{p.name || 'Staff Member'}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">ID: {p.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{p.role}</span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                               <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (p.totalActions / 50) * 100)}%` }} />
                            </div>
                            <span className="text-xs font-black text-gray-900">{p.totalActions}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-xs font-black text-indigo-600">
                            {Math.round((p.totalActions / (summary.completedEncounters || 1)) * 100)}%
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                 ))}
                 {filteredLeaderboard.length === 0 && (
                    <tr>
                       <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">No personnel activity records found in this segment</td>
                    </tr>
                 )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
