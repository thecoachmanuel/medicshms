'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { radiologyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Scan, Search, CheckCircle, UploadCloud, Printer, Download, Eye, Link as LinkIcon, Clock, User, ChevronRight, X, AlertCircle, ImageIcon, Activity, Megaphone } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSearchParams } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RadiologyRequestsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  
  // New States for Robust Features
  const [showNewModal, setShowNewModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [imagingServices, setImagingServices] = useState<any[]>([]);
  const [modalities, setModalities] = useState<any[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('All');
  const [globalSearch, setGlobalSearch] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  const [newRequest, setNewRequest] = useState({
    patient_id: '',
    test_name: '',
    service_id: '',
    test_price: 0,
    clinical_notes: ''
  });

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resultText, setResultText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [dicomUrl, setDicomUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRequests = (requests || []).filter(req => {
    const searchLow = globalSearch.toLowerCase();
    const p = req.patient || {};
    return (
      req.test_name?.toLowerCase().includes(searchLow) ||
      (p.full_name || p.fullName)?.toLowerCase().includes(searchLow) ||
      (p.patient_id || p.patientId)?.toLowerCase().includes(searchLow)
    );
  });

  const filteredPatients = (patients || []).filter(p => {
    const s = patientSearchTerm.toLowerCase();
    return (
      (p.full_name || p.fullName)?.toLowerCase().includes(s) || 
      (p.patient_id || p.patientId)?.toLowerCase().includes(s)
    );
  });

  useEffect(() => {
    fetchRequests(activeTab);
    fetchMetadata();
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

  const fetchMetadata = async () => {
    try {
      const { patientsAPI, servicesAPI } = await import('@/lib/api');
      const [patientsRes, servicesRes] = await Promise.all([
        patientsAPI.getAll(),
        servicesAPI.getAll()
      ]) as any;
      setPatients(patientsRes.data || patientsRes || []);
      
      const allServices = (servicesRes.data || servicesRes || []).map((s: any) => ({
        ...s,
        modality: s.department?.name || 'General Imaging'
      }));
      setImagingServices(allServices.filter((s: any) => 
        s.category?.toLowerCase() === 'radiology' || 
        s.modality.toLowerCase().includes('ray') || 
        s.modality.toLowerCase().includes('mri') ||
        s.modality.toLowerCase().includes('imaging')
      ));

      const mods = Array.from(new Set(allServices.map((s: any) => s.modality)));
      setModalities(mods);

      // Handle Deep-Links
      const patientId = searchParams.get('patientId');
      const search = searchParams.get('search');
      if (patientId) {
        setNewRequest(prev => ({ ...prev, patient_id: patientId }));
        const p = patientsRes.data?.find((p: any) => p.id === patientId);
        if (p) setPatientSearchTerm(p.full_name);
        setShowNewModal(true);
      }
      if (search) setGlobalSearch(search);
    } catch (error) {
       console.error('Imaging metadata error:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.patient_id || !newRequest.test_name) {
      toast.error('Please select a patient and imaging protocol');
      return;
    }
    setIsCreating(true);
    try {
      await radiologyAPI.createRequest(newRequest);
      toast.success('Radiology study authorized');
      setShowNewModal(false);
      fetchRequests(activeTab);
      // Reset
      setNewRequest({ patient_id: '', test_name: '', service_id: '', test_price: 0, clinical_notes: '' });
      setPatientSearchTerm('');
    } catch (error) {
      toast.error('Failed to authorize study');
    } finally {
      setIsCreating(false);
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

  const handlePrint = async (req: any) => {
    const { siteSettingsAPI } = await import('@/lib/api');
    const settingsRes = await siteSettingsAPI.get() as any;
    const settings = settingsRes.data || {};

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Radiology Report - ${req.patient?.full_name}</title>
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
                 <h1>${settings.hospital_name || 'Radiology Imaging Center'}</h1>
                 <p>${settings.address || 'Medical Plaza, East Wing'}</p>
                 <p>Contact: ${settings.contact_email || 'radiology@hospital.com'}</p>
                 ${settings.cin_number ? `<p>CIN: ${settings.cin_number}</p>` : ''}
              </div>
              <div style="text-align: right;">
                 <div class="value" style="font-size: 12px; color: #64748b;">ACCESSION #</div>
                 <div class="value" style="font-size: 18px;">#${req.id?.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div class="report-title">
              <h2>Diagnostic Imaging Interpretation</h2>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <p class="label">Patient Profile</p>
                <p class="value">${req.patient?.full_name || 'N/A'}</p>
                <p class="value" style="font-size: 12px; color: #94a3b8;">ID: ${req.patient?.patient_id || 'N/A'}</p>
              </div>
              <div class="detail-item">
                <p class="label">Imaging Protocol</p>
                <p class="value" style="color: #4f46e5;">${req.test_name}</p>
              </div>
              <div class="detail-item">
                <p class="label">Study Timestamp</p>
                <p class="value">${new Date(req.requested_at).toLocaleString()}</p>
              </div>
              <div class="detail-item">
                <p class="label">Interpretation Date</p>
                <p class="value">${new Date(req.completed_at || req.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div class="results-section">
              <div class="watermark">CERTIFIED RADIOLOGY</div>
              <p class="label" style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Findings & Impressions</p>
              <div class="results-content">${req.results || 'Study successful. Refer to DICOM archive for imaging slices.'}</div>
            </div>

            <div class="footer">
              <div style="font-size: 11px; color: #94a3b8; max-width: 300px;">
                This radiology study has been interpreted and authorized using high-resolution PACS modalities. Verified by the hospital's radiology informatics department.
              </div>
              <div class="signature-box">
                <div class="signature-line">Authorized Radiologist</div>
                <p style="font-size: 14px; font-weight: 900; color: #1e293b; margin-top: 5px;">${req.handled_by_profile?.name || user?.name || 'Medical Officer'}</p>
              </div>
            </div>

            <script>
              window.onload = () => {
                window.print();
                // window.close(); // Optional: close window after printing
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Imaging Matrix</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage and authorized clinical radiology studies.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-all" />
            <input 
              type="text"
              placeholder="Filter Study Protocol..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all shadow-sm"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="btn-primary bg-gray-900 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            Assign New Job
          </button>
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
            <div className="text-center py-12 text-gray-400 animate-pulse font-black uppercase tracking-widest text-[11px]">Synchronizing Imaging Matrix...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <Scan className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-black uppercase tracking-widest text-[10px]">No matches found in imaging archive</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/20 border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Study Protocol</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Valuation</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRequests.map(req => (
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
                            <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{req.patient?.full_name || req.patient?.fullName || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none bg-gray-50 px-2 py-1 rounded-md border border-gray-100">#{req.patient?.patient_id || req.patient?.patientId || 'ID-REDACTED'}</p>
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
                         <div className="flex flex-col gap-1">
                            <p className="text-xs font-black text-gray-900 tracking-widest">₦ {req.test_price?.toLocaleString() || '0'}</p>
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-fit",
                              req.payment_status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100 whitespace-nowrap"
                            )}>
                              {req.payment_status || 'Unpaid'}
                            </span>
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
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={async () => {
                                try {
                                  const { appointmentsAPI } = await import('@/lib/api');
                                  await appointmentsAPI.call(req.appointment_id || req.id, { station: 'Radiology Suite' });
                                  toast.success('Patient called to radiology');
                                } catch (e) {
                                  toast.error('Failed to call patient');
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-amber-50 border border-amber-100/50 rounded-xl text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                              title="Call Patient to Radiology"
                            >
                              <Megaphone className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleOpenUpdate(req)}
                              className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200 active:scale-95"
                            >
                              Read & Report
                            </button>
                          </div>
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
                <p className="font-black text-gray-900">{selectedRequest.patient?.full_name || selectedRequest.patient?.fullName}</p>
                <p className="text-xs text-gray-500 mt-1">Ref: #{selectedRequest.patient?.patient_id || selectedRequest.patient?.patientId}</p>
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

      {/* New Radiology Job Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowNewModal(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] max-w-4xl w-full p-10 shadow-2xl overflow-hidden border border-white/20">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                  <Scan className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Authorize Imaging Job</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Imaging Informatics Authorization</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewModal(false)} 
                className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
              {/* Patient Selection */}
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identify Subject</label>
                <div className="relative">
                  <div className="relative group">
                    <div className="absolute left-5 top-[22px] text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10">
                      <Search className="w-5 h-5" />
                    </div>
                    <input 
                      type="text"
                      className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                      placeholder="Search patient name or ID..."
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {filteredPatients.length > 0 && (patientSearchTerm || newRequest.patient_id) && !newRequest.patient_id && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-3 z-50 max-h-60 overflow-y-auto">
                      {filteredPatients.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => {
                            setNewRequest({...newRequest, patient_id: p.id});
                            setPatientSearchTerm(p.full_name);
                          }}
                          className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50/50 rounded-2xl transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-indigo-100 group-hover:bg-white font-black text-xs text-indigo-600 transition-all">
                            {(p.full_name || p.fullName)?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-tight">{p.full_name || p.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">#{p.patient_id || p.patientId}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {newRequest.patient_id && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-2">
                       <button 
                         onClick={() => {
                            setNewRequest({...newRequest, patient_id: ''});
                            setPatientSearchTerm('');
                         }}
                         className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all border border-transparent hover:border-rose-100"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modality Filter */}
              <div className="flex gap-2 p-1 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setSelectedModality('All')}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedModality === 'All' ? "bg-white text-indigo-600 shadow-sm border border-indigo-100/50" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  All Modalities
                </button>
                {modalities.map(mod => (
                  <button 
                    key={mod}
                    onClick={() => setSelectedModality(mod)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedModality === mod ? "bg-white text-indigo-600 shadow-sm border border-indigo-100/50" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {mod}
                  </button>
                ))}
              </div>

              {/* Study Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Imaging Protocol</label>
                  <select 
                    className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-gray-900 appearance-none shadow-inner"
                    value={newRequest.service_id}
                    onChange={(e) => {
                      const service = imagingServices.find(s => s._id === e.target.value);
                      setNewRequest({
                        ...newRequest, 
                        service_id: e.target.value,
                        test_name: service?.name || '',
                        test_price: service?.price || 0
                      });
                    }}
                  >
                    <option value="">Select Study...</option>
                    {imagingServices.filter(s => selectedModality === 'All' || s.modality === selectedModality).map(s => (
                      <option key={s._id} value={s._id}>{s.name} - ₦ {s.price.toLocaleString()}</option>
                    ))}
                    <option value="custom">Custom Protocol</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Study Description</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                    placeholder="E.g. Brain MRI with Contrast"
                    value={newRequest.test_name}
                    onChange={(e) => setNewRequest({...newRequest, test_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Study Cost / Valuation (₦)</label>
                <div className="relative group">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-600">₦</div>
                   <input 
                      type="number"
                      className="w-full pl-12 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                      placeholder="Enter amount..."
                      value={newRequest.test_price}
                      onChange={(e) => setNewRequest({...newRequest, test_price: parseFloat(e.target.value) || 0})}
                    />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Radiant Clinical Context</label>
                <textarea 
                  rows={3}
                  className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 shadow-inner"
                  placeholder="Additional clinical context for the imaging record..."
                  value={newRequest.clinical_notes}
                  onChange={(e) => setNewRequest({...newRequest, clinical_notes: e.target.value})}
                />
              </div>

              <div className="mt-4 flex items-center justify-between p-2 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/20">
                <div className="px-6 py-2">
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">Authorized Val.</p>
                  <p className="text-xl font-black text-gray-900">₦ {newRequest.test_price.toLocaleString()}</p>
                </div>
                <button 
                  onClick={handleCreateRequest}
                  disabled={isCreating}
                  className="bg-gray-900 text-white px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center gap-3 active:scale-95 group"
                >
                  {isCreating ? <Clock className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5 group-hover:animate-bounce" />}
                  Authorize Study
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
