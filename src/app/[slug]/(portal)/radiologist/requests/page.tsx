'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { radiologyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Scan, Search, CheckCircle, UploadCloud, Printer, Download, Eye, Link as LinkIcon, Clock, User, ChevronRight, X, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RadiologyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resultText, setResultText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [dicomUrl, setDicomUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const response: any = await radiologyAPI.getRequests({ status });
      setRequests(response.data || []);
    } catch (error) {
      toast.error('Failed to load radiology requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdate = (req: any) => {
    setSelectedRequest(req);
    setResultText(req.results || '');
    setFileUrl(req.file_url || '');
    setDicomUrl(req.dicom_url || '');
  };

  const handleUpdateSubmit = async () => {
    if (!resultText && !fileUrl && !dicomUrl) {
      toast.error('Please provide a report, upload a document, or link DICOM images');
      return;
    }
    setIsUpdating(true);
    try {
      await radiologyAPI.updateResult({
        request_id: selectedRequest.id,
        status: 'Completed',
        results: resultText,
        file_url: fileUrl,
        dicom_url: dicomUrl
      });
      toast.success('Radiology report submitted successfully');
      setSelectedRequest(null);
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = (req: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Radiology Report - ${req.patient?.full_name}</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
              .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold; }
              .value { font-size: 16px; font-weight: 500; }
              .results-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
              .footer { margin-top: 50px; text-align: right; font-size: 14px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Radiology Diagnostic Report</h1>
              <p class="subtitle">Requested by: Dr. ${req.doctor?.id ? 'Doctor' : 'Hospital Staff'}</p>
            </div>
            
            <div class="details-grid">
              <div>
                <p class="label">Patient Name</p>
                <p class="value">${req.patient?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p class="label">Patient ID</p>
                <p class="value">${req.patient?.patient_id || 'N/A'}</p>
              </div>
              <div>
                <p class="label">Study Requested</p>
                <p class="value">${req.test_name}</p>
              </div>
              <div>
                <p class="label">Date Interpreted</p>
                <p class="value">${new Date(req.completed_at || req.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div class="results-box">
              <p class="label" style="margin-bottom: 10px;">Interpretive Findings & Impression</p>
              <div style="white-space: pre-wrap; line-height: 1.6;">${req.results || 'No interpretive text provided. Please refer to attachments.'}</div>
            </div>

            ${req.dicom_url ? `<p style="margin-top:20px; color:#3b82f6;">🖥️ Digital Dicom Imaging Link: available in portal.</p>` : ''}
            ${req.file_url ? `<p style="margin-top:20px; color:#3b82f6;">📎 Detailed PDF Report attached.</p>` : ''}

            <div class="footer">
              <p>Electronically Signed By</p>
              <p style="color: #0ea5e9;">${req.handled_by_profile?.name || user?.name || 'Radiologist'}</p>
            </div>
            
            <script>
              window.onload = () => window.print();
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
              <Scan className="w-6 h-6 text-indigo-600" />
            </div>
            Imaging Informatics
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Advanced radiological study management and interpretation.</p>
        </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex p-2 gap-2 bg-gray-50/50 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('Pending')}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
              activeTab === 'Pending' 
                ? "bg-white text-indigo-600 shadow-sm border border-indigo-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            Pending Modalities
          </button>
          <button 
            onClick={() => setActiveTab('Completed')}
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
            <div className="text-center py-12 text-gray-400 animate-pulse">Loading studies...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Scan className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No {activeTab.toLowerCase()} requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Study Protocol</th>
                    <th className="px-6 py-5 text-[11px) font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(req => (
                    <tr key={req.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-[1rem] flex items-center justify-center border shadow-sm transition-all duration-300 font-black text-xs",
                            activeTab === 'Pending' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                          )}>
                            {req.patient?.full_name?.[0] || 'P'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{req.patient?.full_name || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none bg-gray-50 px-2 py-1 rounded-md border border-gray-100">#{req.patient?.patient_id || 'ID-REDACTED'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <div className="space-y-1.5">
                          <p className="font-black text-gray-900 tracking-tight">{req.test_name}</p>
                          {req.clinical_notes && (
                            <div className="flex items-start gap-2 text-[10px] text-amber-600 font-bold leading-relaxed bg-amber-50/50 px-2 py-1 rounded-lg border border-amber-100/20 max-w-xs">
                              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="italic">"{req.clinical_notes}"</span>
                            </div>
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
                          <button 
                            onClick={() => handleOpenUpdate(req)}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
                          >
                            Read & Report
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-3 transition-all duration-300 group-hover:translate-x-[-4px]">
                            {req.dicom_url && (
                              <a 
                                href={req.dicom_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                                title="View DICOM Archive"
                              >
                                <LinkIcon className="w-5 h-5" />
                              </a>
                            )}
                            {req.file_url && (
                              <a 
                                href={req.file_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                title="View PDF Report"
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

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl overflow-hidden border border-white/20">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                  <Scan className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Study Interpretation</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Clinical Imaging Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-[2rem] mb-10 grid grid-cols-2 gap-8 border border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Subject</p>
                <p className="font-black text-gray-900">{selectedRequest.patient?.full_name}</p>
                <p className="text-xs text-gray-500 mt-1">Ref: #{selectedRequest.patient?.patient_id}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Study Protocol</p>
                <p className="font-black text-indigo-600">{selectedRequest.test_name}</p>
              </div>
            </div>

            <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
              <div className="group">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">Findings & Impression</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-50 border border-gray-200/50 rounded-[1.5rem] p-5 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 shadow-inner" 
                  placeholder="Record interpretive findings and diagnostic impressions..."
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">PDF Report URI</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                      <UploadCloud className="w-4 h-4 text-indigo-500" />
                    </div>
                    <input 
                      type="text" 
                      className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-gray-200/50 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 shadow-inner" 
                      placeholder="Report link..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">DICOM Link (PACS)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                      <LinkIcon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <input 
                      type="text" 
                      className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-gray-200/50 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 shadow-inner" 
                      placeholder="DICOM viewer link..."
                      value={dicomUrl}
                      onChange={(e) => setDicomUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-4">
              <button 
                onClick={handleUpdateSubmit}
                disabled={isUpdating}
                className="w-full py-4 rounded-[1.25rem] font-black text-white bg-gray-900 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 hover:shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:bg-gray-900 group"
              >
                {isUpdating ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 group-hover:animate-bounce" />}
                <span className="uppercase tracking-[0.2em] text-xs">{isUpdating ? 'Electronically Signing...' : 'Finalize & Sign Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
