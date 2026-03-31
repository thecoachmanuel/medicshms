'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { radiologyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Scan, Search, CheckCircle, UploadCloud, Printer, Download, Eye, Link as LinkIcon } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scan className="w-6 h-6 text-primary-500" /> Radiology Services
          </h1>
          <p className="text-gray-500 mt-1">Manage scan requests and imaging reports</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('Pending')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest ${activeTab === 'Pending' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pending Scans
          </button>
          <button 
            onClick={() => setActiveTab('Completed')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest ${activeTab === 'Completed' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Verified Reports
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
                  <tr className="border-b border-gray-100">
                    <th className="py-3 font-semibold text-gray-500 px-4">Patient</th>
                    <th className="py-3 font-semibold text-gray-500 px-4">Modality / Study</th>
                    <th className="py-3 font-semibold text-gray-500 px-4">Requested On</th>
                    <th className="py-3 font-semibold text-gray-500 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-900">{req.patient?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{req.patient?.patient_id}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium max-w-xs truncate" title={req.test_name}>{req.test_name}</p>
                        {req.clinical_notes && <p className="text-xs text-amber-600 mt-1 max-w-xs truncate">Clinical Indication: {req.clinical_notes}</p>}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(req.requested_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {activeTab === 'Pending' ? (
                          <button 
                            onClick={() => handleOpenUpdate(req)}
                            className="bg-primary-50 text-primary-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors inline-block"
                          >
                            Read & Report
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {req.dicom_url && (
                              <a href={req.dicom_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 p-2" title="View DICOM Viewer Link">
                                <LinkIcon className="w-5 h-5" />
                              </a>
                            )}
                            {req.file_url && (
                              <a href={req.file_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary-600 p-2" title="View PDF Report">
                                <Eye className="w-5 h-5" />
                              </a>
                            )}
                            <button onClick={() => handlePrint(req)} className="text-gray-400 hover:text-emerald-600 p-2" title="Print Report">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Interpret & Report Study</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mb-1">Patient</p>
              <p className="font-bold">{selectedRequest.patient?.full_name}</p>
              <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mt-4 mb-1">Study Requested</p>
              <p className="font-medium text-primary-700">{selectedRequest.test_name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Findings & Impression</label>
                <textarea 
                  rows={4} 
                  className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-primary-500" 
                  placeholder="Enter detailed radiological findings..."
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Attach Dictation / PDF Report (URL)</label>
                <div className="relative">
                  <UploadCloud className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" 
                    placeholder="https://..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">DICOM Viewer Link (Imaging URL)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" 
                    placeholder="https://viewer.hospital.com/study/..."
                    value={dicomUrl}
                    onChange={(e) => setDicomUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSubmit}
                disabled={isUpdating}
                className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {isUpdating ? 'Signing...' : 'Sign & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
