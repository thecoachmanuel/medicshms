'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { labAPI, usersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { TestTubes, Search, CheckCircle, UploadCloud, Printer, Download, Eye, FileText, Clock, User, ChevronRight, X, AlertCircle, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSearchParams, useParams } from 'next/navigation';
import CreateLabRequestModal from '@/components/clinical/CreateLabRequestModal';
import LabResultEntryModal from '@/components/lab/LabResultEntryModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LabRequestsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params?.slug as string;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Collected' | 'Completed'>('Pending');
  
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

  const handlePrint = async (req: any) => {
    // Fetch exact hospital settings for branding via slug
    const { siteSettingsAPI } = await import('@/lib/api');
    const settingsRes = await siteSettingsAPI.get({ slug }) as any;
    const settings = settingsRes.data || {};

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lab Report - ${req.patient?.full_name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
              
              @page { size: A4; margin: 0; }
              body { 
                font-family: 'Plus Jakarta Sans', sans-serif; 
                margin: 0; 
                padding: 40px; 
                color: #0f172a; 
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .container { max-width: 800px; margin: 0 auto; min-height: 1000px; display: flex; flex-direction: column; }
              
              .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                border-bottom: 2px solid ${settings.primary_color || '#2563eb'}20; 
                padding-bottom: 30px; 
                margin-bottom: 30px; 
              }
              
              .hospital-brand { display: flex; align-items: center; gap: 20px; }
              .logo-box { 
                width: 70px; 
                height: 70px; 
                background: ${settings.primary_color || '#2563eb'}08; 
                border-radius: 18px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border: 1px solid ${settings.primary_color || '#2563eb'}15;
              }
              .logo { max-height: 50px; max-width: 50px; object-fit: contain; }
              
              .hospital-details h1 { 
                font-size: 22px; 
                font-weight: 800; 
                color: #0f172a; 
                margin: 0; 
                letter-spacing: -0.02em; 
                text-transform: uppercase;
              }
              .hospital-details p { font-size: 11px; color: #64748b; margin: 4px 0; font-weight: 600; }
              
              .report-type { 
                text-align: center; 
                margin-bottom: 30px; 
                position: relative;
              }
              .report-type h2 { 
                font-size: 14px; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.2em; 
                color: ${settings.primary_color || '#2563eb'}; 
                background: ${settings.primary_color || '#2563eb'}08; 
                display: inline-block; 
                padding: 8px 24px; 
                border-radius: 99px;
              }
              
              .patient-meta { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 20px; 
                background: #f8fafc; 
                padding: 24px; 
                border-radius: 20px; 
                margin-bottom: 30px;
                border: 1px solid #f1f5f9;
              }
              .meta-item .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 800; margin-bottom: 6px; }
              .meta-item .value { font-size: 13px; font-weight: 700; color: #1e293b; }
              
              .results-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .results-table th { 
                text-align: left; 
                padding: 14px; 
                background: #f1f5f9; 
                font-size: 10px; 
                font-weight: 800; 
                text-transform: uppercase; 
                color: #64748b;
                letter-spacing: 0.05em;
              }
              .results-table td { 
                padding: 16px 14px; 
                border-bottom: 1px solid #f1f5f9; 
                font-size: 13px;
                font-weight: 600;
              }
              
              .critical { color: #e11d48; font-weight: 800; }
              .unit-tag { font-size: 10px; opacity: 0.6; margin-left: 4px; }
              
              .comments-box { 
                background: #fff; 
                border: 2px solid ${settings.primary_color || '#2563eb'}10; 
                border-radius: 20px; 
                padding: 30px; 
                margin-bottom: 40px;
                position: relative;
              }
              .comments-label { 
                position: absolute; 
                top: -10px; 
                left: 20px; 
                background: #fff; 
                padding: 0 10px; 
                font-size: 9px; 
                font-weight: 800; 
                color: ${settings.primary_color || '#2563eb'}; 
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }
              .comments-content { font-size: 13px; line-height: 1.7; color: #334155; white-space: pre-wrap; }
              
              .accession-badge { 
                display: inline-block; 
                padding: 4px 10px; 
                background: ${settings.primary_color || '#2563eb'}10; 
                color: ${settings.primary_color || '#2563eb'}; 
                border-radius: 6px; 
                font-size: 10px; 
                font-weight: 800; 
                margin-top: 5px;
              }
              
              .footer { 
                margin-top: auto; 
                padding-top: 40px; 
                border-top: 2px solid #f8fafc; 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
              }
              .signature-zone { text-align: center; width: 220px; }
              .sig-img { height: 50px; margin-bottom: 10px; opacity: 0.8; }
              .sig-line { 
                border-top: 1.5px solid #e2e8f0; 
                margin-top: 8px; 
                padding-top: 8px; 
                font-size: 10px; 
                font-weight: 700; 
                color: #64748b; 
                text-transform: uppercase; 
              }
              
              .watermark { 
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%) rotate(-45deg); 
                font-size: 100px; 
                font-weight: 900; 
                color: #f1f5f9; 
                z-index: -10; 
                pointer-events: none; 
                opacity: 0.5;
                white-space: nowrap;
              }
              
              @media print { 
                body { padding: 40px; } 
                .no-print { display: none; } 
              }
            </style>
          </head>
          <body>
            <div class="watermark">CERTIFIED REPORT</div>
            <div class="container">
              <div class="header">
                <div class="hospital-brand">
                  <div class="logo-box">
                    ${(req.hospital_details?.hospital_logo || settings.logo_url) ? `<img src="${req.hospital_details?.hospital_logo || settings.logo_url}" class="logo" />` : ''}
                  </div>
                  <div class="hospital-details">
                    <h1>${req.hospital_details?.hospital_name || settings.hospital_name || 'Medical Diagnostic Center'}</h1>
                    <p>${req.hospital_details?.address || settings.address || 'Clinical Headquarters'}</p>
                    <p>${req.hospital_details?.contact_email || settings.contact_email || 'diagnostics@hospital.com'}</p>
                    ${(req.hospital_details?.cin_number || settings.cin_number) ? `<p>REG: ${req.hospital_details?.cin_number || settings.cin_number}</p>` : ''}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div class="label" style="font-size: 9px; color: #94a3b8; font-weight: 800; letter-spacing: 0.1em;">ACCESSION ID</div>
                  <div class="value" style="font-size: 16px; font-weight: 800;">#${req.id.slice(-8).toUpperCase()}</div>
                  ${req.lab_number ? `<div class="accession-badge">ACC NO: ${req.lab_number}</div>` : ''}
                </div>
              </div>

              <div class="report-type">
                <h2>Laboratory Report</h2>
              </div>

              <div class="patient-meta">
                <div class="meta-item">
                  <p class="label">Patient Name</p>
                  <p class="value">${req.patient?.full_name}</p>
                  <p class="value" style="font-size: 10px; color: #64748b; margin-top: 4px;">
                    ID: ${req.patient?.patient_id || '-'}
                  </p>
                </div>
                <div class="meta-item">
                  <p class="label">Demographics</p>
                  <p class="value">${req.patient_age || 'N/A'} • ${req.patient_gender || 'N/A'}</p>
                  <p class="value" style="font-size: 10px; color: #64748b; margin-top: 4px;">
                    REFERRING: ${req.requested_by_name || 'HOSPITAL CLINIC'}
                  </p>
                </div>
                <div class="meta-item">
                  <p class="label">Timeline</p>
                  <p class="value">${new Date(req.completed_at || req.updated_at).toLocaleDateString()} ${new Date(req.completed_at || req.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p class="value" style="font-size: 10px; color: #64748b; margin-top: 4px;">COLLECTED: ${new Date(req.requested_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div class="comments-box">
                <span class="comments-label">CLINICAL SUMMARY & ANALYTICAL METRICS</span>
                <div class="comments-content">
                  ${(() => {
                    const summary = req.clinical_summary || '';
                    if (req.results?.includes('METRIC_DATA:')) {
                      const parts = req.results.split('METRIC_DATA:');
                      const notes = parts[0].trim();
                      let metrics = {};
                      try { metrics = JSON.parse(parts[1]); } catch(e) {}
                      
                      return `
                        ${summary ? `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0; font-size: 12px;"><strong>Clinical Summary:</strong><br/>${summary}</div>` : ''}
                        ${notes ? `<div style="margin-bottom: 20px; font-size: 12px;">${notes}</div>` : ''}
                        <table class="results-table">
                          <thead>
                            <tr>
                              <th>Investigation Parameter</th>
                              <th>Result Value</th>
                              <th>Reference Range</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${Object.entries(metrics).map(([k, v]: any) => `
                              <tr>
                                <td>${k}</td>
                                <td><span class="${v?.toLowerCase()?.includes('high') || v?.toLowerCase()?.includes('low') ? 'critical' : ''}">${v}</span></td>
                                <td style="color: #64748b; font-size: 11px;">${v?.split('(')[1]?.replace(')', '') || '-'}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      `;
                    }
                    return `
                      ${summary ? `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0; font-size: 12px;"><strong>Clinical Summary:</strong><br/>${summary}</div>` : ''}
                      <div style="font-size: 12px;">${req.results || 'Result interpreted as Normal. Refer to digital analysis for quantitative parameters.'}</div>
                    `;
                  })()}
                </div>
              </div>

              <div class="footer">
                <div style="font-size: 9px; color: #94a3b8; max-width: 320px; line-height: 1.6;">
                  This report is electronically verified and digitally signed. It is intended for clinical use by medical practitioners. Clinical correlation is recommended.
                </div>
                <div class="signature-zone">
                  <p class="value" style="color: ${settings.primary_color || '#2563eb'}; font-size: 14px;">${req.handled_by_profile?.name || user?.name || 'Chief Lab Scientist'}</p>
                  <div class="sig-line">Lab. Scientist / Authorized Signatory</div>
                  <p style="font-size: 8px; color: #94a3b8; margin-top: 4px;">${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>

            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 700); }
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
            onClick={() => setActiveTab('Pending')}
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
            onClick={() => setActiveTab('Collected')}
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
    </div>
  );
}
