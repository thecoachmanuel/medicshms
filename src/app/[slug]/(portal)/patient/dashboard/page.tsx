'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patientAPI } from '@/lib/api';
import { 
  Heart, Calendar, FileText, Activity, Clock, 
  ChevronRight, AlertCircle, CheckCircle2, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PatientDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await patientAPI.getMe();
        if (res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        toast.error('Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-12 h-12 text-indigo-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Health Metadata...</p>
      </div>
    );
  }

  const latestVitals = data?.vitals?.[0];
  const upcomingAppointments = data?.appointments?.filter((a: any) => a.status === 'Confirmed' || a.status === 'Pending') || [];
  const recentRequests = data?.requests?.slice(0, 3) || [];
  const pendingBills = data?.bills?.filter((b: any) => b.payment_status === 'Pending') || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize">Welcome back, {user?.name?.split(' ')?.[0]}!</h1>
            <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">Your Personal Health Architecture</p>
          </div>
          <div className="flex gap-4">
             <div className="px-6 py-3 bg-gray-900 text-white rounded-2xl flex items-center gap-3">
               <span className="text-[10px] font-black uppercase tracking-widest">Patient ID:</span>
               <span className="text-sm font-bold font-mono text-indigo-300">{data?.profile?.patientId}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">{latestVitals?.blood_pressure || '--/--'}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Latest BP</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">{upcomingAppointments.length}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Visits</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">{data?.requests?.filter((r: any) => r.status === 'Completed').length || 0}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Medical Reports</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-2">{pendingBills.length}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending Bills</p>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
             <div className="p-8 border-b border-gray-100 flex items-center justify-between">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Recent Investigations</h3>
               <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">View All Records</button>
             </div>
             <div className="divide-y divide-gray-50">
               {recentRequests.map((req: any, idx: number) => {
                 const isPaid = req.bills?.payment_status === 'Paid';
                 return (
                   <div key={idx} className="p-6 flex items-center justify-between hover:bg-indigo-50/20 transition-colors group">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                         <Activity className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="text-sm font-black text-gray-900 underline decoration-indigo-200 decoration-2 underline-offset-4">{req.test_name}</p>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Requested: {new Date(req.requested_at).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-6">
                       <div className="flex flex-col items-end">
                         <span className={cn(
                           "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                           req.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                         )}>
                           {req.status}
                         </span>
                         {!isPaid && req.status === 'Completed' && (
                           <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                             <AlertCircle className="w-2 h-2" /> Awaiting Payment
                           </span>
                         )}
                         {isPaid && (
                           <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                             <CheckCircle2 className="w-2 h-2" /> Result Available
                           </span>
                         )}
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                     </div>
                   </div>
                 );
               })}
               {recentRequests.length === 0 && (
                 <div className="p-12 text-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">No recent investigations found</p>
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
             <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-6">Latest Vitals Summary</h3>
             {latestVitals ? (
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Weight</p>
                   <p className="text-lg font-black">{latestVitals.weight || '--'} <span className="text-xs text-gray-400">kg</span></p>
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Height</p>
                   <p className="text-lg font-black">{latestVitals.height || '--'} <span className="text-xs text-gray-400">cm</span></p>
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Temperature</p>
                   <p className="text-lg font-black">{latestVitals.temperature || '--'} <span className="text-xs text-gray-400">°C</span></p>
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Heart Rate</p>
                   <p className="text-lg font-black">{latestVitals.heart_rate || '--'} <span className="text-xs text-gray-400">bpm</span></p>
                 </div>
               </div>
             ) : (
               <p className="text-xs font-bold text-gray-500">No vitals recorded yet</p>
             )}
             <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Recorded on</p>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{latestVitals ? new Date(latestVitals.recorded_at).toLocaleDateString() : '--'}</p>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                 <Clock className="w-4 h-4" />
               </div>
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Upcoming Visits</h3>
             </div>
             <div className="space-y-4">
               {upcomingAppointments.length > 0 ? upcomingAppointments.slice(0, 2).map((apt: any, i: number) => (
                 <div key={apt.id} className="flex gap-4">
                   <div className="flex flex-col items-center">
                     <p className="text-xs font-black text-gray-900">{new Date(apt.appointment_date).getDate()}</p>
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}</p>
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[11px] font-black text-gray-900 truncate">{apt.department}</p>
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{apt.appointment_time}</p>
                   </div>
                 </div>
               )) : (
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center py-4">No upcoming visits</p>
               )}
             </div>
             <button className="w-full mt-6 py-3 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
               Book Appointment
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
