'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { radiologyAPI, billingAPI, servicesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Scan, Search, CheckCircle, UploadCloud, 
  Clock, AlertCircle, RefreshCw, FileText, 
  ArrowRight, ShieldCheck, Info, Activity
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CreateRadiologyRequestModal from '@/components/clinical/CreateRadiologyRequestModal';
import ViewInvoiceModal from '@/components/billing/ViewInvoiceModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ReceptionistRadiologyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const [catalog, setCatalog] = useState<any[]>([]);
  const [mappingRequest, setMappingRequest] = useState<any | null>(null);
  const [showInvoiceId, setShowInvoiceId] = useState<string | null>(null);
  const [showInvoicePatient, setShowInvoicePatient] = useState<any | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response: any = await radiologyAPI.getRequests({ status: activeTab });
      setRequests(response.data || []);
      
      const svcRes = await servicesAPI.getAll() as any;
      const allSvc = svcRes.data || svcRes || [];
      setCatalog(allSvc.filter((s: any) => s.category?.toLowerCase() === 'radiology'));
    } catch (error) {
      toast.error('Failed to load imaging queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleAuthorizeBilling = async (req: any, mappedItem?: any) => {
    try {
      let targetPrice = req.test_price || 0;
      let targetName = req.test_name;
      let targetServiceId = req.service_id;

      if (mappedItem) {
        targetPrice = mappedItem.price;
        targetName = mappedItem.name;
        targetServiceId = mappedItem.id || mappedItem._id;
      } else if (targetPrice === 0) {
        const match = catalog.find((c: any) => c.name.toLowerCase() === req.test_name.toLowerCase());
        if (!match) {
          setMappingRequest(req);
          return;
        }
        targetPrice = match.price;
        targetName = match.name;
        targetServiceId = match.id || match._id;
      }

      setLoading(true);
      // Generate Invoice via Billing Service (Radiology logic usually auto-bills, but this is a fallback/manual auth)
      // The radiology API POST already auto-bills, but if it fails or needs re-auth:
      // We can use a unified billing generator or the radiology-specific one if it exists.
      
      // For consistency with lab portal:
      await billingAPI.generateForLab(req.id, {}); // Backend handles source_type correctly usually
      
      toast.success(`Imaging authorized: ${targetName} (₦${targetPrice.toLocaleString()})`);
      setMappingRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to authorize billing');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = (requests || []).filter(req => {
    const s = globalSearch.toLowerCase();
    const p = req.patient || {};
    return (
      req.test_name?.toLowerCase().includes(s) ||
      (p.full_name || p.fullName)?.toLowerCase().includes(s) ||
      (p.patient_id || p.patientId)?.toLowerCase().includes(s) ||
      req.priority?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-100">
              <Scan className="w-6 h-6 text-white" />
            </div>
            Radiology Intake
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-16">Administrative management of imaging investigations.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100 flex items-center gap-3 active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            New Job
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative group flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-600 transition-all" />
            <input 
              type="text"
              placeholder="Filter by Subject, Protocol or Priority..."
              className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-violet-500/10 outline-none transition-all shadow-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
         </div>
         <div className="flex p-1.5 bg-gray-100/50 rounded-[1.5rem] border border-gray-100 w-fit">
            <button 
              onClick={() => setActiveTab('Pending')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === 'Pending' ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Imaging Queue
            </button>
            <button 
              onClick={() => setActiveTab('Completed')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === 'Completed' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Finalized Reports
            </button>
         </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-violet-100/20 overflow-hidden">
        <div className="p-6 overflow-x-auto">
          {loading ? (
             <div className="py-24 text-center">
                <RefreshCw className="w-10 h-10 text-violet-100 animate-spin mx-auto mb-4" />
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">Synchronizing Registry...</p>
             </div>
          ) : filteredRequests.length === 0 ? (
             <div className="py-32 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-gray-100">
                  <Activity className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No imaging studies active in current cycle</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Account</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Imaging Job</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority / Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="group hover:bg-violet-50/30 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-violet-600 text-xs shadow-sm">
                          {(req.patient?.full_name || req.patient?.fullName)?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{req.patient?.full_name || req.patient?.fullName || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{req.patient?.patient_id || req.patient?.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900">{req.test_name}</p>
                        <p className="text-[10px] text-violet-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <Info className="w-3 h-3" /> Imaging Study
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
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest ml-1",
                          req.status === 'Completed' ? "text-emerald-500" : "text-gray-400"
                        )}>{req.status}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          {req.payment_status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-[10px] font-black uppercase tracking-wider w-fit">
                              <CheckCircle className="w-3 h-3" /> Paid
                            </span>
                          ) : (req.payment_status === 'Billed' || req.bill_id) ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 text-[10px] font-black uppercase tracking-wider">
                                <Clock className="w-3 h-3" /> Billed
                              </span>
                              <button 
                                onClick={() => {
                                  setShowInvoiceId(req.bill_id);
                                  setShowInvoicePatient({
                                    ...req.patient,
                                    fullName: req.patient?.full_name || req.patient?.fullName,
                                    patientId: req.patient?.patient_id || req.patient?.patientId
                                  });
                                }}
                                className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-blue-100"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100/50 text-[10px] font-black uppercase tracking-wider">
                                UNPAID
                              </span>
                              <button 
                                onClick={() => handleAuthorizeBilling(req)}
                                className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-violet-600 hover:shadow-sm border border-transparent hover:border-gray-100"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <p className="text-[10px] font-bold text-gray-400 ml-1">Val: ₦ {req.test_price?.toLocaleString() || 0}</p>
                       </div>
                    </td>
                     <td className="px-6 py-5">
                       <div className="flex flex-col items-end gap-1.5">
                         {req.payment_status === 'Unpaid' && activeTab === 'Pending' && (
                           <button 
                             onClick={() => handleAuthorizeBilling(req)}
                             className="px-4 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                           >
                             Authorize Bill
                           </button>
                         )}
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateRadiologyRequestModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchRequests}
      />

      {showInvoiceId && (
        <ViewInvoiceModal 
          billId={showInvoiceId}
          appointment={showInvoicePatient}
          onClose={() => {
            setShowInvoiceId(null);
            setShowInvoicePatient(null);
          }}
          onUpdated={() => fetchRequests()}
        />
      )}

      {/* Protocol Mapping Modal */}
      {mappingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setMappingRequest(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] max-w-lg w-full p-10 shadow-2xl animate-in zoom-in-95">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                  <RefreshCw className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight">Sync Protocol</h3>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Imaging Catalog Alignment</p>
                </div>
             </div>

             <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Requested Protocol:</p>
                <p className="text-lg font-black text-gray-900">"{mappingRequest.test_name}"</p>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">Select Official Study</label>
                <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar p-1">
                   {catalog.map(c => (
                     <button 
                       key={c.id || c._id}
                       onClick={() => handleAuthorizeBilling(mappingRequest, c)}
                       className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/30 transition-all group text-left"
                     >
                        <div>
                          <p className="font-black text-gray-900 text-sm group-hover:text-violet-600">{c.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{c.category}</p>
                        </div>
                        <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-widest group-hover:bg-violet-100">₦{c.price.toLocaleString()}</span>
                     </button>
                   ))}
                </div>
             </div>

             <button 
               onClick={() => setMappingRequest(null)}
               className="w-full mt-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
             >
                Cancel
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
