'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  TestTubes, Search, CheckCircle, UploadCloud, 
  Clock, AlertCircle, RefreshCw, FileText, 
  ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CreateLabRequestModal from '@/components/clinical/CreateLabRequestModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ReceptionistLabRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response: any = await labAPI.getRequests({ status: activeTab });
      setRequests(response.data || response.requests || []);
    } catch (error) {
      toast.error('Failed to load clinical queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const filteredRequests = (requests || []).filter(req => {
    const s = globalSearch.toLowerCase();
    return (
      req.test_name?.toLowerCase().includes(s) ||
      req.patient?.full_name?.toLowerCase().includes(s) ||
      req.patient?.patient_id?.toLowerCase().includes(s) ||
      req.priority?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            Diagnostics Intake
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-16">Administrative management of laboratory investigations.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            New Investigation
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative group flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-all" />
            <input 
              type="text"
              placeholder="Filter by Subject, Protocol or Urgency..."
              className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
         </div>
         <div className="flex p-1.5 bg-gray-100/50 rounded-[1.5rem] border border-gray-100 w-fit">
            <button 
              onClick={() => setActiveTab('Pending')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === 'Pending' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Current Queue
            </button>
            <button 
              onClick={() => setActiveTab('Completed')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === 'Completed' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Archived Reports
            </button>
         </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-indigo-100/20 overflow-hidden">
        <div className="p-6 overflow-x-auto">
          {loading ? (
             <div className="py-24 text-center">
                <RefreshCw className="w-10 h-10 text-indigo-100 animate-spin mx-auto mb-4" />
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">Synchronizing Registry...</p>
             </div>
          ) : filteredRequests.length === 0 ? (
             <div className="py-32 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-gray-100">
                  <TestTubes className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No diagnostics active in current cycle</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Account</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Definition</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority / Specimen</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-indigo-600 text-xs shadow-sm">
                          {req.patient?.full_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{req.patient?.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{req.patient?.patient_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900">{req.test_name}</p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Info className="w-3 h-3" /> {req.service_category || 'Laboratory'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider w-fit border",
                          req.priority === 'Stat' ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" :
                          req.priority === 'Urgent' ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                          {req.priority}
                        </span>
                        <p className="text-[10px] text-gray-500 font-bold ml-1 italic">{req.specimen_type || 'TBD'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-1.5">
                          <p className="text-xs font-black text-gray-900">₦ {req.test_price?.toLocaleString()}</p>
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase border",
                            req.payment_status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {req.payment_status || 'Unpaid'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          req.status === 'Completed' ? "bg-emerald-600 text-white border-emerald-700" :
                          req.status === 'Collected' ? "bg-amber-500 text-white border-amber-600" : "bg-gray-100 text-gray-400 border-gray-200"
                        )}>
                          {req.status}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateLabRequestModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
