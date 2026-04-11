'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patientAPI } from '@/lib/api';
import { 
  Calendar, Clock, MapPin, User, ChevronRight, 
  Search, Plus, Activity, CheckCircle2, History,
  Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PatientAppointmentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await patientAPI.getMe();
        if (res.data) setData(res.data);
      } catch (err) {
        toast.error('Failed to load appointment history');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-12 h-12 text-indigo-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Clinical Encounter History...</p>
      </div>
    );
  }

  const appointments = data?.appointments || [];
  const upcoming = appointments.filter((a: any) => new Date(a.appointment_date) >= new Date() && a.status !== 'Cancelled');
  const past = appointments.filter((a: any) => new Date(a.appointment_date) < new Date() || a.status === 'Cancelled');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase whitespace-pre-line">Visit\nArchitecture</h1>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">Managed Encounter Lifecycle</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-900/10 active:scale-95">
          <Plus className="w-4 h-4" /> Book New Appointment
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Upcoming Visits</h3>
          </div>
          
          {upcoming.length > 0 ? upcoming.map((apt: any) => (
             <div key={apt.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all border-l-8 border-l-indigo-600">
                <div className="flex justify-between items-start">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 italic">Confirmed</span>
                         <span className="text-xs font-black text-gray-900">{new Date(apt.appointment_date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight">{apt.department}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">With Specialist &bull; {apt.appointment_time}</p>
                      </div>
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Awaiting Doctor Assignment</span>
                   </div>
                   <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors">Reschedule</button>
                </div>
             </div>
          )) : (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No upcoming clinical encounters</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center">
                <History className="w-4 h-4" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Clinical History</h3>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
             {past.length > 0 ? past.map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[1.5rem] hover:bg-gray-50 transition-colors group">
                   <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex flex-col items-center justify-center">
                      <p className="text-xs font-black text-gray-900">{new Date(apt.appointment_date).getDate()}</p>
                      <p className="text-[8px] font-black uppercase">{new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}</p>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{apt.department}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{apt.status} &bull; {apt.appointment_time}</p>
                   </div>
                   <div className="w-8 h-8 bg-white border border-gray-100 text-gray-300 rounded-full flex items-center justify-center group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                      <ChevronRight className="w-4 h-4" />
                   </div>
                </div>
             )) : (
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center py-20 px-8 border border-dashed border-gray-200 rounded-[2rem]">History clean. No past visits found</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
