'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { TestTubes, Search, CheckCircle, UploadCloud, Printer, Download, Eye, FileText, Clock, User, ChevronRight, X, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LabRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resultText, setResultText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New Request State
  const [showNewModal, setShowNewModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [labServices, setLabServices] = useState<any[]>([]);
  const [newRequest, setNewRequest] = useState({
    patient_id: '',
    test_name: '',
    service_id: '',
    test_price: 0,
    clinical_notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab]);

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const response: any = await labAPI.getRequests({ status });
      setRequests(response.data || []);
    } catch (error) {
      toast.error('Failed to load lab requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      // Use imported APIs directly as they are available globally or imported
      const { patientsAPI, servicesAPI } = await import('@/lib/api');
      const [patientsRes, servicesRes] = await Promise.all([
        patientsAPI.getAll(),
        servicesAPI.getAll()
      ]) as any;
      setPatients(patientsRes.data || patientsRes || []);
      // Filter for laboratory services
      const allServices = servicesRes.data || servicesRes || [];
      setLabServices(allServices.filter((s: any) => 
        s.name.toLowerCase().includes('test') || 
        s.department?.name?.toLowerCase().includes('lab')
      ));
    } catch (error) {
      console.error('Metadata fetch error:', error);
    }
  };

  useEffect(() => {
    if (showNewModal) fetchMetadata();
  }, [showNewModal]);

  const handleCreateRequest = async () => {
    if (!newRequest.patient_id || !newRequest.test_name) {
      return toast.error('Patient and Test Name are required');
    }
    setIsCreating(true);
    try {
      await labAPI.createRequest(newRequest);
      toast.success('Lab request assigned successfully');
      setShowNewModal(false);
      setNewRequest({ patient_id: '', test_name: '', service_id: '', test_price: 0, clinical_notes: '' });
      fetchRequests(activeTab);
    } catch (error) {
      toast.error('Failed to assign test');
    } finally {
      setIsCreating(false);
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
    setFileUrl(req.file_url || '');
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

  const handlePrint = async (req: any) => {
    // Fetch hospital settings for branding
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
              .report-title h2 { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #334155; background: #f8fafc; display: inline-block; padding: 10px 30px; border-radius: 12px; }
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
                 ${settings.hospital_logo ? `<img src="${settings.hospital_logo}" style="height: 60px; margin-bottom: 15px; object-fit: contain;" />` : ''}
                 <h1>${settings.hospital_name || 'Medical Diagnostic Center'}</h1>
                 <p>${settings.address || 'Clinic HQ Sector 4'}</p>
                 <p>Contact: ${settings.contact_email || 'diagnostics@hospital.com'}</p>
                 ${settings.cin_number ? `<p>CIN: ${settings.cin_number}</p>` : ''}
              </div>
              <div style="text-align: right;">
                 <div class="value" style="font-size: 12px; color: #64748b;">REPORT ID</div>
                 <div class="value" style="font-size: 18px;">#${req.id.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div class="report-title">
              <h2>Diagnostic Laboratory Certificate</h2>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <p class="label">Patient Name</p>
                <p class="value">${req.patient?.full_name || 'N/A'}</p>
                <p class="value" style="font-size: 12px; color: #94a3b8;">ID: ${req.patient?.patient_id || 'N/A'}</p>
              </div>
              <div class="detail-item">
                <p class="label">Investigation Protocol</p>
                <p class="value" style="color: #2563eb;">${req.test_name}</p>
              </div>
              <div class="detail-item">
                <p class="label">Sample Collected</p>
                <p class="value">${new Date(req.requested_at).toLocaleString()}</p>
              </div>
              <div class="detail-item">
                <p class="label">Authorized Completion</p>
                <p class="value">${new Date(req.completed_at || req.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div class="results-section">
              <div class="watermark">CERTIFIED RESULT</div>
              <p class="label" style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Clinical Observations</p>
              <div class="results-content">${req.results || 'Investigation successful. Refer to digital attachments for quantitative parameters.'}</div>
            </div>

            <div class="footer">
              <div style="font-size: 11px; color: #94a3b8; max-width: 300px;">
                This document is electronically generated and contains clinical data verified by the hospital's pathology department.
              </div>
              <div class="signature-box">
                <p class="value" style="color: #2563eb; margin-bottom: -30px;">${req.handled_by_profile?.name || user?.name || 'Authorized Scientist'}</p>
                <div class="signature-line">Chief Scientific Officer</div>
              </div>
            </div>
            
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm shadow-blue-100/20">
              <TestTubes className="w-6 h-6 text-blue-600" />
            </div>
            Diagnostics Hub
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Advanced laboratory matrix for clinical investigation.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="btn-primary bg-gray-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          Assign New Job
        </button>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex p-2 gap-2 bg-gray-50/50 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('Pending')}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
              activeTab === 'Pending' 
                ? "bg-white text-blue-600 shadow-sm border border-blue-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            Awaiting Verification
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
            <div className="text-center py-12 text-gray-400 animate-pulse">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TestTubes className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No {activeTab.toLowerCase()} requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Requested Analysis</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Financials</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(req => (
                    <tr key={req.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-[1rem] flex items-center justify-center border shadow-sm transition-all duration-300 font-black text-xs",
                            activeTab === 'Pending' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
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
                                Unpaid
                              </span>
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
                            <p className="text-[10px] font-bold text-gray-400 ml-1">Valuation: ${req.test_price}</p>
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
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
                          >
                            Add Analysis
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

      {/* Report Validation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] max-w-2xl w-full p-10 shadow-2xl overflow-hidden border border-white/20">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Report Validation</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Certificate of Clinical Findings</p>
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
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Analysis Protocol</p>
                <p className="font-black text-blue-600">{selectedRequest.test_name}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="group">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">Structured Results & Clinical Commentary</label>
                <textarea 
                  rows={5} 
                  className="w-full bg-gray-50 border border-gray-200/50 rounded-[1.5rem] p-5 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-800 shadow-inner" 
                  placeholder="Record precise quantitative metrics and qualitative analysis..."
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                />
              </div>
              
              <div className="group">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">Authenticated Attachment Protocol (BETA)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                    <UploadCloud className="w-4 h-4 text-blue-500" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-gray-200/50 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-gray-900 shadow-inner" 
                    placeholder="Input Secure Cloud Resource URI..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-4">
              <button 
                onClick={handleUpdateSubmit}
                disabled={isUpdating}
                className="w-full py-4 rounded-[1.25rem] font-black text-white bg-gray-900 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 hover:shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:bg-gray-900 group"
              >
                {isUpdating ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 group-hover:animate-bounce" />}
                <span className="uppercase tracking-[0.2em] text-xs">{isUpdating ? 'Verifying Integrity...' : 'Authorize & Release Result'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Lab Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setShowNewModal(false)}></div>
          <div className="relative bg-white rounded-[3rem] max-w-2xl w-full p-12 shadow-[0_32px_128px_rgba(0,0,0,0.1)] border border-white/20 overflow-hidden">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.5rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200">
                  <UploadCloud className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Assign New Job</h2>
                  <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">Diagnostic Protocol Initiation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewModal(false)}
                className="p-4 bg-gray-50 rounded-[1.25rem] text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all duration-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-10">
              {/* Patient Selection */}
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identify Subject</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <select 
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 appearance-none shadow-inner"
                    value={newRequest.patient_id}
                    onChange={(e) => setNewRequest({...newRequest, patient_id: e.target.value})}
                  >
                    <option value="">Select Patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} (#{p.patient_id})</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Test Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Analysis Type</label>
                  <select 
                    className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 appearance-none shadow-inner"
                    value={newRequest.service_id}
                    onChange={(e) => {
                      const service = labServices.find(s => s._id === e.target.value);
                      setNewRequest({
                        ...newRequest, 
                        service_id: e.target.value,
                        test_name: service?.name || '',
                        test_price: service?.price || 0
                      });
                    }}
                  >
                    <option value="">Standard Panels...</option>
                    {labServices.map(s => (
                      <option key={s._id} value={s._id}>{s.name} - ${s.price}</option>
                    ))}
                    <option value="custom">Custom Test</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Technical Title</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                    placeholder="E.g. Full Blood Count"
                    value={newRequest.test_name}
                    onChange={(e) => setNewRequest({...newRequest, test_name: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Investigation Notes</label>
                <textarea 
                  rows={3}
                  className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-800 shadow-inner"
                  placeholder="Primary clinical indications..."
                  value={newRequest.clinical_notes}
                  onChange={(e) => setNewRequest({...newRequest, clinical_notes: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between p-2 bg-blue-50/30 rounded-[2rem] border border-blue-100/20">
              <div className="px-6 py-2">
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">Estimated Val.</p>
                <p className="text-xl font-black text-gray-900">${newRequest.test_price}</p>
              </div>
              <button 
                onClick={handleCreateRequest}
                disabled={isCreating}
                className="btn-primary bg-gray-900 hover:bg-blue-600 text-white px-10 py-5 rounded-[1.75rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isCreating ? 'Synchronizing...' : 'Authorize Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
