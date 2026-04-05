'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, Printer, Download, ChevronLeft, ChevronRight, 
  CheckCircle, FileText, Activity, Microscope, 
  MapPin, Mail, Phone, Calendar, User
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { siteSettingsAPI } from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Metric {
  label: string;
  value: string;
  unit: string;
  referenceRange: string;
}

interface LabReportPreviewModalProps {
  requests: any[];
  onClose: () => void;
}

export default function LabReportPreviewModal({ requests, onClose }: LabReportPreviewModalProps) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await siteSettingsAPI.get() as any;
        setSettings(res.data || {});
      } catch (e) {
        console.error('Failed to fetch hospital settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handlePrint = () => {
    // We print the contents of the report-container div
    const printContent = document.getElementById('report-container');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laboratory Report - ${requests[0]?.patient?.full_name}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              body { 
                font-family: 'Inter', -apple-system, sans-serif; 
                padding: 0; 
                margin: 0; 
                color: #0f172a; 
                background: white;
              }
              .page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0 auto;
                background: white;
                box-sizing: border-box;
              }
              @page {
                size: A4;
                margin: 0;
              }
              @media print {
                body { background: none; }
                .page { margin: 0; border: none; border-radius: 0; }
              }
              .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                border-bottom: 2px solid #000; 
                padding-bottom: 15px; 
                margin-bottom: 25px; 
              }
              .hospital-logo { height: 60px; object-fit: contain; margin-bottom: 10px; }
              .hospital-info h1 { font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase; color: #1e293b; }
              .hospital-info p { font-size: 11px; color: #64748b; margin: 2px 0; font-weight: 500; }
              
              .report-type { 
                text-align: center; 
                margin-bottom: 25px; 
              }
              .report-type h2 { 
                font-size: 16px; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.2em; 
                background: #f8fafc; 
                display: inline-block; 
                padding: 6px 20px; 
                border: 1px solid #e2e8f0;
                border-radius: 6px;
              }

              .demographics { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 20px; 
                background: #f8fafc; 
                padding: 15px; 
                border-radius: 8px; 
                margin-bottom: 25px; 
                border: 1px solid #e2e8f0;
              }
              .demo-item { display: flex; flex-direction: column; }
              .demo-label { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px; }
              .demo-value { font-size: 12px; font-weight: 700; color: #1e293b; }

              .test-group { margin-bottom: 30px; }
              .test-header { 
                background: #1e293b; 
                color: white; 
                padding: 6px 15px; 
                border-radius: 4px; 
                font-size: 13px; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
                margin-bottom: 10px;
              }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              th { 
                text-align: left; 
                font-size: 10px; 
                font-weight: 800; 
                text-transform: uppercase; 
                color: #64748b; 
                padding: 8px 10px; 
                border-bottom: 1px solid #e2e8f0;
              }
              td { 
                padding: 10px; 
                font-size: 12px; 
                border-bottom: 1px solid #f1f5f9; 
                color: #334155;
              }
              .font-bold { font-weight: 700; }
              .text-critical { color: #e11d48; font-weight: 800; }
              
              .notes-section { 
                font-size: 11px; 
                line-height: 1.6; 
                color: #475569; 
                padding: 15px; 
                background: #fff; 
                border: 1px dashed #cbd5e1; 
                border-radius: 8px;
                margin-top: 20px;
              }
              
              .footer { 
                margin-top: 50px; 
                border-top: 1px solid #e2e8f0; 
                padding-top: 20px; 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
              }
              .signature-box { text-align: center; width: 180px; }
              .signature-line { border-top: 1px solid #94a3b8; margin-bottom: 5px; }
              .signature-text { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
              
              .watermark { 
                position: fixed; 
                top: 50%; 
                left: 50%; 
                transform: translate(-50%, -50%) rotate(-45deg); 
                font-size: 100px; 
                font-weight: 950; 
                color: rgba(241, 245, 249, 0.5); 
                pointer-events: none; 
                z-index: -1; 
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const patient = requests[0]?.patient || {};
  const specimenIds = requests.map(r => r.id.slice(-8).toUpperCase()).join(', ');

  const parseResults = (rawString: string): { metrics: Metric[], notes: string } => {
    if (!rawString) return { metrics: [], notes: '' };
    
    if (rawString.includes('METRIC_DATA:')) {
      try {
        const parts = rawString.split('METRIC_DATA:');
        const notes = parts[0].trim();
        const data = JSON.parse(parts[1]);
        
        if (Array.isArray(data)) {
          return { metrics: data, notes };
        } else {
          // Legacy format
          const metrics = Object.entries(data).map(([label, value]) => ({
            label,
            value: String(value),
            unit: '',
            referenceRange: ''
          }));
          return { metrics, notes };
        }
      } catch (e) {
        return { metrics: [], notes: rawString };
      }
    }
    return { metrics: [], notes: rawString };
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-[210mm] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
        
        {/* Modal Header Actions */}
        <div className="flex justify-between items-center px-10 py-6 border-b border-gray-100 shrink-0 bg-white/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Report Intelligence</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">A4 Clinical Preview • {requests.length} Test(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              <Printer className="w-4 h-4" />
              Print Certificate
            </button>
            <button 
              onClick={onClose}
              className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container (Screen Only) */}
        <div className="flex-1 overflow-y-auto p-12 bg-gray-50/50 custom-scrollbar">
          
          {/* THE ACTUAL REPORT (Styled for A4) */}
          <div id="report-container">
            <div className="page bg-white shadow-sm mx-auto">
              <div className="watermark">LAB CERTIFIED</div>
              
              {/* Report Header */}
              <div className="header">
                <div className="hospital-info">
                  {settings.hospital_logo && (
                    <img src={settings.hospital_logo} alt="Hospital Logo" className="hospital-logo" />
                  )}
                  <h1>{settings.hospital_name || 'Laboratory Diagnostic Hub'}</h1>
                  <p>{settings.address || 'Clinic HQ Sector 4'}</p>
                  <p>{settings.contact_email || 'diagnostics@hospital.com'} • {settings.contact_phone || '+234 000 000 0000'}</p>
                  {settings.cin_number && <p>CIN: {settings.cin_number}</p>}
                </div>
                <div className="text-right">
                  <div className="demo-label">SPECIMEN ACCESSION</div>
                  <div className="text-xl font-black text-indigo-600">#{specimenIds}</div>
                  <div className="demo-label mt-2">CERTIFICATE NO</div>
                  <div className="font-bold text-xs uppercase">{new Date().getTime().toString(36).toUpperCase()}</div>
                </div>
              </div>

              <div className="report-type">
                <h2>Verified Diagnostic Report</h2>
              </div>

              {/* Patient Demographics */}
              <div className="demographics">
                <div className="demo-item">
                  <span className="demo-label">Patient Name</span>
                  <span className="demo-value uppercase">{patient.full_name || 'Unknown Subject'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Age / Gender</span>
                  <span className="demo-value">{patient.age || 'N/A'}Y / {patient.gender || 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Patient ID</span>
                  <span className="demo-value">#{patient.patient_id || 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Requested Date</span>
                  <span className="demo-value">{new Date(requests[0]?.requested_at).toLocaleDateString()}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Sample Collected</span>
                  <span className="demo-value">{requests[0]?.collected_at ? new Date(requests[0]?.collected_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Report Authorized</span>
                  <span className="demo-value">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tests Breakdown */}
              {requests.map((req, idx) => {
                const { metrics, notes } = parseResults(req.results);
                return (
                  <div key={req.id} className="test-group">
                    <div className="test-header">
                      {idx + 1}. {req.test_name}
                    </div>
                    
                    {metrics.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            <th className="w-1/3">Parameter</th>
                            <th className="w-1/6">Result</th>
                            <th className="w-1/6">Unit</th>
                            <th>Reference Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m, mIdx) => (
                            <tr key={mIdx}>
                              <td className="font-bold">{m.label}</td>
                              <td className={cn(
                                "font-bold",
                                req.is_critical && mIdx === 0 && "text-critical" // Heuristic for critical if marked
                              )}>{m.value}</td>
                              <td>{m.unit}</td>
                              <td className="text-[10px] text-gray-500 italic">{m.referenceRange || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-4 px-10 text-xs text-gray-500 italic border border-dashed border-gray-200 rounded-lg mb-4">
                        See clinical interpretations below for descriptive results.
                      </div>
                    )}

                    {notes && (
                      <div className="notes-section">
                        <div className="demo-label mb-1">Clinical Impressions & Morphology</div>
                        <div className="whitespace-pre-wrap">{notes}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Authorized Signature */}
              <div className="footer">
                <div className="text-[9px] text-gray-400 max-w-[350px]">
                  <b>Electronic Verification:</b> This report is digitally signed and authorized by a registered medical scientist. 
                  Any alteration voids this certificate. Investigation conducted under standardized diagnostic protocols.
                </div>
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <div className="signature-text">Authorized Scientist</div>
                  <div className="font-bold text-xs mt-1 uppercase">{requests[0]?.handled_by_profile?.name || 'Medical Scientist'}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
