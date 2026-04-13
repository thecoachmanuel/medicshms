'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labAPI, radiologyAPI } from '@/lib/api';
import { 
  Beaker, Camera, Search, Filter, ArrowLeft, 
  ChevronRight, CheckCircle2, Clock, 
  AlertCircle, RefreshCw, FileText, User as UserIcon,
  Activity, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function DoctorInvestigationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user?.doctorProfileId) return;
    try {
      const results = await Promise.allSettled([
        labAPI.getRequests({ doctorId: user.doctorProfileId }),
        radiologyAPI.getRequests({ doctorId: user.doctorProfileId })
      ]);

      const [labRes, radRes] = results;
      const combined = [];

      if (labRes.status === 'fulfilled') {
        combined.push(...(labRes.value.data || []).map((l: any) => ({ ...l, origin: 'Laboratory' })));
      }
      if (radRes.status === 'fulfilled') {
        combined.push(...(radRes.value.data || []).map((r: any) => ({ ...r, origin: 'Radiology' })));
      }

      setRequests(combined.sort((a, b) => 
        new Date(b.requested_at || b.created_at).getTime() - new Date(a.requested_at || a.created_at).getTime()
      ));
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to sync investigations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patient?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.lab_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesType = filterType === 'all' || req.origin === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return "bg-amber-100/50 text-amber-700 ring-amber-500/20";
      case 'Processing':
      case 'Sample Collected': return "bg-blue-100/50 text-blue-700 ring-blue-500/20";
      case 'Completed':
      case 'Authorized': return "bg-emerald-100/50 text-emerald-700 ring-emerald-500/20";
      default: return "bg-slate-100/50 text-slate-700 ring-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 opacity-50 animate-pulse">
        <div className="w-16 h-16 rounded-[2rem] bg-indigo-100 flex items-center justify-center">
            <Search className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Clinical Feed...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 pb-20">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Dashboard Overview
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20">
                <Activity className="w-6 h-6" />
            </div>
            INVESTIGATION TRACKER
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
            Monitor real-time progress of laboratory and radiology orders. Track samples, processing status, and verified clinical findings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
           onClick={() => { setRefreshing(true); fetchRequests(); }}
           className="btn-secondary px-6 group"
           disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? 'Syncing...' : 'Force Refresh'}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white p-2 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="lg:col-span-12 xl:col-span-5 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by test name, patient, or lab number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-none rounded-[2rem] text-sm font-medium outline-none focus:ring-8 focus:ring-indigo-600/5 focus:bg-white transition-all"
          />
        </div>

        <div className="lg:col-span-4 xl:col-span-2 px-4 py-1 flex items-center gap-3 border-x border-slate-100">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-slate-600"
          >
            <option value="all">Any Status</option>
            <option value="Pending">Pending</option>
            <option value="Sample Collected">Sample Collected</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Authorized">Authorized</option>
          </select>
        </div>

        <div className="lg:col-span-4 xl:col-span-2 px-4 py-1 flex items-center gap-3">
          <Beaker className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-slate-600"
          >
            <option value="all">All Channels</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Radiology">Radiology</option>
          </select>
        </div>

        <div className="lg:col-span-4 xl:col-span-3 pr-2 flex justify-end">
           <div className="px-6 py-4 rounded-3xl bg-indigo-50/50 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
              {filteredRequests.length} Clinical Orders
           </div>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-40">
            <Search className="w-20 h-20 text-slate-200 mb-6" />
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-900">Archive Empty</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">No investigations match your active clinical filters</p>
          </div>
        ) : filteredRequests.map((req) => (
          <div 
            key={req.id}
            className="group relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border border-slate-100 hover:border-indigo-100 overflow-hidden"
          >
            {/* Background Accent */}
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 -mr-16 -mt-16 transition-all duration-700 group-hover:scale-150",
              req.origin === 'Laboratory' ? "bg-emerald-500" : "bg-indigo-500"
            )} />

            <div className="flex items-center justify-between mb-8">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:rotate-6",
                req.origin === 'Laboratory' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-indigo-600 text-white shadow-indigo-600/20"
              )}>
                {req.origin === 'Laboratory' ? <Beaker className="w-7 h-7" /> : <Camera className="w-7 h-7" />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset shadow-sm",
                  getStatusStyle(req.status)
                )}>
                  {req.status}
                </span>
                {req.priority === 'Urgent' || req.priority === 'Stat' ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-xl text-rose-600 text-[9px] font-black uppercase tracking-widest ring-1 ring-rose-500/20">
                     <Zap className="w-3 h-3 fill-rose-600" />
                     {req.priority}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-2 min-h-[3.5rem]">
                  {req.test_name}
                </h3>
                <div className="mt-2 flex items-center gap-3">
                   <div className="flex -space-x-1.5 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                         <UserIcon className="w-3 h-3 text-slate-400" />
                      </div>
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">{req.patient?.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lab/Ref ID</p>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{req.lab_number || 'Internal Ref'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Requested</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    {new Date(req.requested_at || req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {req.requested_at ? new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit' }).format(new Date(req.requested_at)) : 'ASAP'}
                  </span>
                </div>
                
                <button 
                  onClick={() => router.push(`/${slug}/doctor/patients/${req.patient_id}?tab=investigations`)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-all group-hover:translate-x-1"
                >
                  Full History
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar (Visual indicator) */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-slate-100 w-full overflow-hidden">
               <div className={cn(
                 "h-full transition-all duration-1000 ease-out",
                 req.status === 'Pending' ? "w-1/4 bg-amber-400" :
                 req.status === 'Sample Collected' ? "w-1/2 bg-blue-400" :
                 req.status === 'Processing' ? "w-3/4 bg-blue-500" :
                 "w-full bg-emerald-500"
               )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
