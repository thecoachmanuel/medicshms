'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pharmacyAPI } from '@/lib/api';
import { 
  Pill, Clock, FileText, CheckCircle2, 
  AlertCircle, Activity, ChevronRight,
  Stethoscope, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PatientPrescriptionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await pharmacyAPI.getPrescriptions();
        if (res.data) setPrescriptions(res.data);
      } catch (err) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-12 h-12 text-amber-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Prescribed Regimens...</p>
      </div>
    );
  }

  const active = prescriptions.filter(p => p.status === 'Pending' || p.status === 'Partial');
  const dispensed = prescriptions.filter(p => p.status === 'Dispensed');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Prescription\nLedger</h1>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-2">Active Pharmacotherapy Records</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3">
             <Pill className="w-5 h-5 text-amber-500" />
             <span className="text-xs font-bold text-gray-900">{active.length} Active Prescriptions</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Active Prescriptions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Awaiting Dispensing</h3>
          </div>
          
          <div className="space-y-4">
            {active.length > 0 ? active.map((presc: any) => (
              <div key={presc.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-amber-100 transition-all border-l-8 border-l-amber-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Prescribed {new Date(presc.prescribed_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 tracking-tight">
                      Order #{presc.id.slice(-6).toUpperCase()}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                      By Dr. {presc.doctor?.profile?.name || 'Authorized Physician'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                    {presc.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  {presc.medications?.map((med: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{med.item_name}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                          {med.dosage} &bull; {med.frequency} &bull; {med.duration}
                        </p>
                      </div>
                      <Pill className="w-4 h-4 text-amber-200" />
                    </div>
                  ))}
                  {!presc.medications?.length && presc.notes && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <p className="text-xs font-medium text-gray-600 leading-relaxed italic">{presc.notes}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between font-black text-[9px] uppercase tracking-widest">
                  <div className="flex items-center gap-2 text-rose-500">
                    <AlertCircle className="w-3 h-3" />
                    Awaiting Pharmacist
                  </div>
                  <button className="text-indigo-600 hover:underline">View Instructions</button>
                </div>
              </div>
            )) : (
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active prescriptions</p>
              </div>
            )}
          </div>
        </div>

        {/* Prescription History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Dispensed History</h3>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
            {dispensed.length > 0 ? dispensed.map((presc: any) => (
              <div key={presc.id} className="flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[1.5rem] hover:bg-gray-50 transition-colors group">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                   <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">
                    {presc.medications?.[0]?.item_name || 'Pharmacotherapy'} {presc.medications?.length > 1 && `+ ${presc.medications.length - 1} more`}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    Dispensed: {presc.dispensed_at ? new Date(presc.dispensed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-white border border-gray-100 text-gray-300 rounded-full flex items-center justify-center group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )) : (
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center py-20 px-8 border border-dashed border-gray-200 rounded-[2rem]">No historical prescriptions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
