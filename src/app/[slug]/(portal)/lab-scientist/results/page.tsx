'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Microscope, 
  Search, 
  Printer, 
  Eye, 
  Calendar, 
  Filter, 
  ArrowRight,
  ClipboardCheck,
  Activity,
  User,
  FlaskConical
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function LabResultsContent() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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

  const handlePrint = async (req: any) => {
    const { siteSettingsAPI } = await import('@/lib/api');
    const settingsRes = await siteSettingsAPI.get() as any;
    const settings = settingsRes.data || {};

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lab Report - ${req.patient?.full_name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; max-width: 900px; margin: 0 auto; background: #fff; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
              .hospital-info h1 { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; }
              .hospital-info p { font-size: 13px; color: #64748b; margin: 4px 0; font-weight: 500; }
              .report-title { text-align: center; margin-bottom: 40px; }
              .report-title h2 { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #1e293b; background: #f8fafc; display: inline-block; padding: 10px 30px; border-radius: 12px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
              .detail-item { border-left: 3px solid #e2e8f0; padding-left: 20px; }
              .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
              .value { font-size: 15px; font-weight: 600; color: #1e293b; }
              .results-section { background: #fff; border: 2px solid #f1f5f9; border-radius: 20px; padding: 40px; margin-bottom: 40px; min-height: 200px; position: relative; }
              .results-content { line-height: 1.8; font-size: 15px; white-space: pre-wrap; }
              .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: 900; color: #f1f5f9; z-index: -1; pointer-events: none; white-space: nowrap; }
              .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding-top: 30px; border-top: 2px solid #f1f5f9; }
              .signature-box { text-align: center; width: 200px; }
              .signature-line { border-top: 2px solid #e2e8f0; margin-top: 40px; padding-top: 10px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
              @media print { body { padding: 20px; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hospital-info">
                 ${settings.hospital_logo ? `<img src="${settings.hospital_logo}" style="height: 60px; margin-bottom: 15px;" />` : ''}
                 <h1>${settings.hospital_name || 'Laboratory Diagnostic Hub'}</h1>
                 <p>${settings.address || 'Clinic HQ Sector 4'}</p>
                 <p>Contact: ${settings.contact_email || 'diagnostics@hospital.com'}</p>
                 ${settings.cin_number ? `<p>CIN: ${settings.cin_number}</p>` : ''}
              </div>
              <div style="text-align: right;">
                 <div class="value" style="font-size: 12px; color: #64748b;">SPECIMEN #</div>
                 <div class="value" style="font-size: 18px;">#${req.id.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div class="report-title">
              <h2>Verified Laboratory Certificate</h2>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <p class="label">Patient Profile</p>
                <p class="value">${req.patient?.full_name || 'N/A'}</p>
                <p class="value" style="font-size: 12px; color: #94a3b8;">ID: ${req.patient?.patient_id || 'N/A'}</p>
              </div>
              <div class="detail-item">
                <p class="label">Investigation Protocol</p>
                <p class="value" style="color: #059669;">${req.test_name}</p>
              </div>
              <div class="detail-item">
                <p class="label">Inception Date</p>
                <p class="value">${new Date(req.requested_at).toLocaleString()}</p>
              </div>
              <div class="detail-item">
                <p class="label">Verification Date</p>
                <p class="value">${new Date(req.completed_at || req.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div class="results-section">
              <div class="watermark">LAB VERIFIED</div>
              <p class="label" style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Clinical Observations & Parameters</p>
              <div class="results-content">${req.results || 'No interpretive data recorded for this specimen.'}</div>
            </div>

            <div class="footer">
              <div style="font-size: 11px; color: #94a3b8; max-width: 300px;">
                This laboratory investigation has been verified and authorized by the department of clinical pathology. Verified using standardized diagnostic protocols.
              </div>
              <div class="signature-box">
                <div class="signature-line">Authorized Scientist</div>
                <p style="font-size: 14px; font-weight: 900; color: #1e293b; margin-top: 5px;">${req.handled_by_profile?.name || user?.name || 'Medical Scientist'}</p>
              </div>
            </div>

            <script>
              window.onload = () => {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
                <div key={req.id} className="group bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-[4rem] group-hover:bg-emerald-600 transition-colors duration-500 flex items-center justify-center -mr-4 -mt-4 pb-4 pl-4">
                      <Microscope className="w-6 h-6 text-emerald-200 group-hover:text-white transition-colors" />
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
                        onClick={() => handlePrint(req)}
                        className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center text-white hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                        title="Print Certified Certificate"
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
