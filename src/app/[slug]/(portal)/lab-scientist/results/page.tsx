'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { labAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Microscope, Search, Printer, Eye, Calendar, Filter, ArrowRight, ClipboardCheck, Activity, User, FlaskConical, CheckSquare, Square } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import LabReportPreviewModal from '@/components/lab/LabReportPreviewModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function LabResultsContent() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewRequests, setPreviewRequests] = useState<any[] | null>(null);

  useEffect(() => {
    fetchVerifiedResults();
  }, []);

  const fetchVerifiedResults = async () => {
    setLoading(true);
    try {
      const response: any = await labAPI.getRequests({ status: 'Completed' });
      setResults(response.data || []);
    } catch (error) {
      toast.error('Failed to synchronize laboratory archive');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(req => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (
      req.test_name?.toLowerCase().includes(s) ||
      req.patient?.full_name?.toLowerCase().includes(s) ||
      req.patient?.patient_id?.toLowerCase().includes(s)
    );
    
    if (dateRange.start && new Date(req.completed_at) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(req.completed_at) > new Date(dateRange.end)) return false;
    
    return matchesSearch;
  });

  const handlePrint = (req: any) => {
    console.log('💎 Authorizing Print Preview for:', req?.test_name);
    if (!req) {
      toast.error('Invalid request data for certificate');
      return;
    }
    toast.success('Preparing Clinical Certificate...');
    setPreviewRequests([req]);
  };

  const handleBulkPrint = () => {
    const selected = results.filter(r => selectedIds.includes(r.id));
    if (selected.length === 0) return;
    
    // Check if multiple patients are selected
    const patientIds = new Set(selected.map(r => r.patient?.id));
    if (patientIds.size > 1) {
      toast.error('Please select results for a single patient to consolidate.');
      return;
    }
    
    setPreviewRequests(selected);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 shadow-sm shadow-emerald-100/20">
              <Microscope className="w-6 h-6 text-emerald-600" />
            </div>
            Clinical Archives
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Historical laboratory investigation records and verified results.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5 bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-white/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search verified subjects or diagnostic logs..." 
            className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl text-xs focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-gray-400 font-black uppercase tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50/50 px-4 py-2 rounded-2xl border border-gray-100">
             <Calendar className="w-4 h-4 text-gray-400" />
             <input 
               type="date" 
               className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
               value={dateRange.start}
               onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
             />
             <ArrowRight className="w-3 h-3 text-gray-300" />
             <input 
               type="date" 
               className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
               value={dateRange.end}
               onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
             />
          </div>
          <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-95 shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/50">
        <div className="p-8">
          {loading ? (
             <div className="text-center py-20 animate-pulse font-black uppercase tracking-widest text-gray-400 text-xs">Querying Laboratory Archive...</div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-32 text-gray-400">
              <FlaskConical className="w-16 h-16 mx-auto mb-6 opacity-10" />
              <p className="font-black uppercase tracking-widest text-[10px]">No historical investigations found in this segment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredResults.map(req => (
                <div 
                  key={req.id} 
                  className={cn(
                    "group bg-white border rounded-3xl p-6 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 relative overflow-hidden cursor-pointer",
                    selectedIds.includes(req.id) ? "border-emerald-500 bg-emerald-50/10 shadow-xl" : "border-gray-100"
                  )}
                  onClick={() => toggleSelect(req.id)}
                >
                   <div className={cn(
                     "absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] transition-colors duration-500 flex items-center justify-center -mr-4 -mt-4 pb-4 pl-4",
                     selectedIds.includes(req.id) ? "bg-emerald-600" : "bg-emerald-50/50 group-hover:bg-emerald-600"
                   )}>
                      {selectedIds.includes(req.id) ? (
                        <CheckSquare className="w-6 h-6 text-white" />
                      ) : (
                        <Microscope className="w-6 h-6 text-emerald-200 group-hover:text-white transition-colors" />
                      )}
                   </div>
                   
                   <div className="mb-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subject</p>
                      <h3 className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase truncate pr-16">{req.patient?.full_name}</h3>
                      <p className="text-[10px] font-bold text-gray-500">#{req.patient?.patient_id}</p>
                   </div>

                   <div className="p-4 bg-gray-50 rounded-2xl mb-6 group-hover:bg-emerald-50/30 transition-colors">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Protocol Verified</p>
                      <p className="text-sm font-black text-gray-800">{req.test_name}</p>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Verified</p>
                         <p className="text-xs font-bold text-gray-700">{new Date(req.completed_at || req.updated_at).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(req);
                        }}
                        className="relative z-20 w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white hover:bg-emerald-600 transition-all shadow-lg active:scale-95 cursor-pointer"
                        title="Preview & Print Certificate"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-gray-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Protocol Selection</span>
                <span className="text-white font-black text-sm">{selectedIds.length} Result(s) Prepared</span>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setSelectedIds([])}
                   className="px-6 py-3 rounded-2xl text-xs font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                 >
                   Clear Selection
                 </button>
                 <button 
                   onClick={handleBulkPrint}
                   className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                 >
                   <Printer className="w-4 h-4" />
                   Generate Consolidated Report
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewRequests && (
        <LabReportPreviewModal 
          requests={previewRequests}
          slug={slug as string}
          onClose={() => setPreviewRequests(null)}
        />
      )}
    </div>
  );
}

export default function LabResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse font-black uppercase tracking-widest text-xs text-gray-400">Loading Laboratory Informatics...</div>}>
      <LabResultsContent />
    </Suspense>
  );
}
