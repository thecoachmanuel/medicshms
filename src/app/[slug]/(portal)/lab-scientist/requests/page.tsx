'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labAPI, usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { TestTubes, Search, CheckCircle, UploadCloud, Printer, Download, Eye, FileText, Clock, User, ChevronRight, X, AlertCircle, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSearchParams, useParams, useRouter, usePathname } from 'next/navigation';
import CreateLabRequestModal from '@/components/clinical/CreateLabRequestModal';
import LabResultEntryModal from '@/components/lab/LabResultEntryModal';
import LabReportPreviewModal from '@/components/lab/LabReportPreviewModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LabRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params?.slug as string;
  const pathname = usePathname();
  const currentTab = (searchParams.get('tab') || 'Pending') as 'Pending' | 'Collected' | 'Completed';
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const activeTab = currentTab;
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resultText, setResultText] = useState('');
  const [minRange, setMinRange] = useState<string>('');
  const [maxRange, setMaxRange] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [isCritical, setIsCritical] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New Request State
  const [showNewModal, setShowNewModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [assignedUnits, setAssignedUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showPreview, setShowPreview] = useState<any[] | null>(null);

  const filteredRequests = (requests || []).filter(req => {
    const searchLow = globalSearch.toLowerCase();
    const matchesSearch = (
      req.test_name?.toLowerCase().includes(searchLow) ||
      req.patient?.full_name?.toLowerCase().includes(searchLow) ||
      req.patient?.patient_id?.toLowerCase().includes(searchLow) ||
      req.lab_number?.toLowerCase().includes(searchLow)
    );

    const matchesDate = !selectedDate || new Date(req.requested_at).toISOString().split('T')[0] === selectedDate;

    return matchesSearch && matchesDate;
  });

  useEffect(() => {
    fetchAssignments();
    fetchRequests(activeTab);
  }, [activeTab, selectedUnitId]);

  const fetchAssignments = async () => {
    if (!user?.id) return;
    try {
      const res = await labAPI.getAssignments({ scientist_id: user.id }) as any;
      setAssignedUnits(res.data || []);
    } catch (e) { console.error('Failed to fetch assignments'); }
  };

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const params: any = { status };
      if (selectedUnitId !== 'all') {
        params.unit_id = selectedUnitId;
      } else if (assignedUnits.length > 0 && activeTab === 'Pending') {
        // Default to assigned units for pending jobs if not "All"
        // params.unit_ids = assignedUnits.map(a => a.unit_id).join(',');
      }
      const response: any = await labAPI.getRequests(params);
      setRequests(response.data || []);
    } catch (error) {
      toast.error('Failed to load lab requests');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (req: any) => {
    const { billingAPI } = await import('@/lib/api');
    try {
      await billingAPI.generateForLab(req.id, {});
      toast.success('Invoice generated and sent to patient billing');
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleOpenUpdate = (req: any) => {
    setSelectedRequest(req);
    setResultText(req.results || '');
    setMinRange(req.min_range?.toString() || '');
    setMaxRange(req.max_range?.toString() || '');
    setUnit(req.unit || '');
    setIsCritical(req.is_critical || false);
    setFileUrl(req.file_url || '');
  };

  const handleMarkCollected = async (requestId: string) => {
    try {
      await labAPI.updateResult({
        request_id: requestId,
        status: 'Collected',
        collected_at: new Date().toISOString()
      });
      toast.success('Specimen marked as collected - analysis in progress');
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to update specimen status');
    }
  };

  const handleUpdateSubmit = async () => {
    if (!resultText && !fileUrl) {
      toast.error('Please provide a result or upload a document');
      return;
    }
    setIsUpdating(true);
    try {
      await labAPI.updateResult({
        request_id: selectedRequest.id,
        status: 'Completed',
        results: resultText,
        min_range: minRange ? parseFloat(minRange) : undefined,
        max_range: maxRange ? parseFloat(maxRange) : undefined,
        unit: unit || undefined,
        is_critical: isCritical,
        file_url: fileUrl
      });
      toast.success('Lab result updated successfully');
      setSelectedRequest(null);
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to update result');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = (req: any) => {
    setShowPreview([req]);
  };
;

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm shadow-blue-100/20">
                <TestTubes className="w-6 h-6 text-blue-600" />
              </div>
              Diagnostics Hub
            </h1>
            <p className="text-gray-500 font-medium mt-1 ml-15">Advanced laboratory matrix for clinical investigation.</p>
          </div>
          
          {assignedUnits.length > 0 && (
            <div className="flex gap-2 p-1 bg-white/50 border border-gray-100 rounded-2xl w-fit ml-15 shadow-sm">
              <button 
                onClick={() => setSelectedUnitId('all')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  selectedUnitId === 'all' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Global Queue
              </button>
              {assignedUnits.map(a => (
                <button 
                  key={a.unit_id}
                  onClick={() => setSelectedUnitId(a.unit_id)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedUnitId === a.unit_id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {a.unit?.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-all" />
            <input 
              type="text"
              placeholder="Filter by Subject or Analysis..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
          <div className="relative group w-full md:w-auto">
             <input 
               type="date"
               className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all shadow-sm"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
             />
             {!selectedDate && (
               <div className="absolute inset-0 flex items-center pointer-events-none px-6 text-[9px] font-black uppercase text-gray-400 tracking-widest bg-white rounded-2xl">
                 Date Filter (Off)
               </div>
             )}
             {selectedDate && (
               <button 
                 onClick={() => setSelectedDate('')}
                 className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-500 transition-all"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
             )}
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="btn-primary bg-gray-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            Assign New Job
          </button>
        </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex p-2 gap-2 bg-gray-50/50 border-b border-gray-100 no-scrollbar overflow-x-auto">
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('tab', 'Pending');
              router.push(`${pathname}?${params.toString()}`);
            }}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
              activeTab === 'Pending' 
                ? "bg-white text-blue-600 shadow-sm border border-blue-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            Awaiting Specimen
          </button>
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('tab', 'Collected');
              router.push(`${pathname}?${params.toString()}`);
            }}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
              activeTab === 'Collected' 
                ? "bg-white text-amber-600 shadow-sm border border-amber-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            In Analysis
          </button>
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('tab', 'Completed');
              router.push(`${pathname}?${params.toString()}`);
            }}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
              activeTab === 'Completed' 
                ? "bg-white text-emerald-600 shadow-sm border border-emerald-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            Authorized Reports
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400 animate-pulse font-black uppercase tracking-widest text-[11px]">Synchronizing Diagnostics...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <TestTubes className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-black uppercase tracking-widest text-[10px]">No matches found in clinical index</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Investigation Definition</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Priority & Specimen</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Financials</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-[1rem] flex items-center justify-center border shadow-sm transition-all duration-300 font-black text-xs",
                            activeTab === 'Pending' ? "bg-blue-50 border-blue-100 text-blue-600" : 
                            activeTab === 'Collected' ? "bg-amber-50 border-amber-100 text-amber-600" :
                            "bg-emerald-50 border-emerald-100 text-emerald-600"
                          )}>
                            {(req.patient?.full_name || req.patient?.profile?.name)?.[0] || 'P'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{req.patient?.full_name || req.patient?.profile?.name || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none bg-gray-50 px-2 py-1 rounded-md border border-gray-100">#{req.patient?.patient_id || 'ID-REDACTED'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <div className="space-y-1.5">
                          <p className="font-black text-gray-900 tracking-tight">{req.test_name}</p>
                          <div className="flex flex-wrap gap-2">
                             {req.unit?.name && (
                               <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">{req.unit.name}</span>
                             )}
                             {req.clinical_notes && (
                               <div className="flex items-start gap-2 text-[10px] text-blue-600 font-bold leading-relaxed bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/20 max-w-xs">
                                 <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                 <span className="italic">"{req.clinical_notes}"</span>
                               </div>
                             )}
                          </div>
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
                             {req.priority || 'Routine'}
                           </span>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">{req.specimen_type || 'Venous Blood'}</p>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          {req.payment_status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-[10px] font-black uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3" /> Settled
                            </span>
                          ) : req.payment_status === 'Billed' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 text-[10px] font-black uppercase tracking-wider">
                              <Clock className="w-3 h-3" /> Invoiced
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100/50 text-[10px] font-black uppercase tracking-wider">
                                UNPAID
                              </span>
                              {req.is_critical && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white border border-rose-700 text-[10px] font-black uppercase tracking-wider animate-pulse">
                                  CRITICAL
                                </span>
                              )}
                              <button 
                                onClick={() => handleGenerateBill(req)}
                                className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-gray-100"
                                title="Generate Invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {req.test_price > 0 && (
                            <p className="text-[10px] font-bold text-gray-400 ml-1">Valuation: ₦ {req.test_price.toLocaleString()}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-900 tracking-widest">{new Date(req.requested_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {activeTab === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleMarkCollected(req.id)}
                              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center gap-2"
                            >
                              <TestTubes className="w-3.5 h-3.5" />
                              Receive Sample
                            </button>
                          </div>
                        ) : activeTab === 'Collected' ? (
                            <button 
                              onClick={() => handleOpenUpdate(req)}
                              className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
                            >
                              Input Result
                            </button>
                        ) : (
                          <div className="flex items-center justify-end gap-3 transition-all duration-300 group-hover:translate-x-[-4px]">
                            {req.file_url && (
                              <a 
                                href={req.file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                title="View Certificate"
                              >
                                <Eye className="w-5 h-5" />
                              </a>
                            )}
                            <button 
                              onClick={() => handlePrint(req)} 
                              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                              title="Print Report"
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Specialized Diagnostic Workstation */}
      {selectedRequest && (
        <LabResultEntryModal 
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => fetchRequests(activeTab)}
        />
      )}

      {/* Unified New Lab Request Modal */}
      <CreateLabRequestModal 
        isOpen={showNewModal} 
        onClose={() => setShowNewModal(false)}
        onSuccess={() => fetchRequests(activeTab)}
      />

      {/* Preview Modal for Consistency */}
      {showPreview && (
        <LabReportPreviewModal 
          requests={showPreview}
          slug={slug}
          onClose={() => setShowPreview(null)}
        />
      )}
    </div>
  );
}
