'use client';

import React from 'react';
import { useSiteSettings } from '@/context/SettingsContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LabResultReportProps {
  request: any;
  patient: any;
  results: any[];
  scientistName?: string;
  comments?: string;
}

export const LabResultReport = ({ request, patient, results, scientistName, comments }: LabResultReportProps) => {
  const { settings } = useSiteSettings();
  const primaryColor = settings?.theme_color || '#2563eb';
  
  // Filter out fields that are meant to be hidden (optional, based on logic)
  const activeResults = Array.isArray(results) ? results.filter(f => f.value !== undefined && f.value !== '') : [];
  
  // If no metric data is passed, but comments exist, we'll still show the report!
  const hasDetails = activeResults.length > 0;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-report bg-white text-slate-900 font-sans p-[10mm] min-h-[297mm] w-[210mm] mx-auto shadow-2xl print:shadow-none print:p-0">
      {/* Header Branding */}
      <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: primaryColor }}>
        <div className="flex gap-6 items-center">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-2xl p-1 bg-white" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-primary-600 font-black text-2xl border border-slate-100">
              {settings?.hospital_name?.charAt(0) || 'H'}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {settings?.hospital_name || 'MEDICS HMS PATHOLOGY'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Advanced Clinical Laboratory & Diagnostic Services
            </p>
            <div className="flex flex-col text-[11px] font-medium text-slate-500 mt-2">
              <span>{settings?.address}</span>
              <div className="flex gap-4 mt-1">
                <span>{settings?.contact_phone}</span>
                <span>{settings?.contact_email}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="px-5 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-600/20" style={{ backgroundColor: primaryColor }}>
            Diagnostic Report
          </div>
          <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase">
            Request ID: <span className="text-slate-900">{request?.id?.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Patient & Request Metadata */}
      <div className="grid grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-100">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Patient Information</h3>
          <div className="grid grid-cols-2 gap-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Full Name:</span>
            <span className="text-[11px] font-black text-slate-900 uppercase">{patient?.full_name || patient?.name}</span>
            
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Patient ID:</span>
            <span className="text-[11px] font-black text-slate-900 uppercase">{patient?._id?.slice(-6).toUpperCase() || 'N/A'}</span>
            
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Age / Sex:</span>
            <span className="text-[11px] font-black text-slate-900 uppercase">
              {patient?.age || 'N/A'} Yrs / {patient?.gender || 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clinical Context</h3>
          <div className="grid grid-cols-2 gap-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Referring Doctor:</span>
            <span className="text-[11px] font-black text-slate-900 uppercase italic">
              Dr. {request?.doctor_name || 'Self Referral'}
            </span>
            
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Specimen:</span>
            <span className="text-[11px] font-black text-slate-900 uppercase">{request?.specimen_type || 'See Test Details'}</span>
            
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Date Verified:</span>
            <span className="text-[11px] font-black text-slate-900 uppercase">{dateStr}</span>

            {request?.unit?.name && (
              <>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Department:</span>
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{request.unit.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Investigation Details */}
      {hasDetails && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {request?.test_name || 'Investigation Details'}
            </h2>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">Parameter</th>
                <th className="p-4 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">Result</th>
                <th className="p-4 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">Units</th>
                <th className="p-4 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">Reference Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeResults.map((field, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                  <td className="p-4 text-[11px] font-black text-slate-800 uppercase tracking-tight">{field.label}</td>
                  <td className="p-4 text-center text-[12px] font-black text-slate-900 italic">{field.value}</td>
                  <td className="p-4 text-center text-[10px] font-bold text-slate-400">{field.unit || '-'}</td>
                  <td className="p-4 text-right text-[10px] font-black text-slate-500 tracking-tight">{field.referenceRange || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Narrative Result (If no structured data exists) */}
      {!hasDetails && comments && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {request?.test_name || 'Investigation Details'}
            </h2>
          </div>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 italic">
            <p className="text-[14px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{comments}</p>
          </div>
        </div>
      )}

      {/* Comments Section (Only if we have structured data AND comments) */}
      {hasDetails && comments && (
        <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 not-italic">Additional Clinical Notes</h3>
          <p className="text-[12px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{comments}</p>
        </div>
      )}

      {/* Footer / Signatures */}
      <div className="mt-auto pt-10 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Authentication</p>
          <div className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-xs">
            This report represents an electronic record verified through the HMS Laboratory Information System. 
            All clinical correlations should be established with a managing physician.
          </div>
        </div>

        <div className="text-center group border-t-2 border-slate-100 pt-4 px-8 min-w-[200px]">
          <p className="text-[12px] font-black text-primary-600 italic mb-0.5 tracking-tighter">
            {scientistName || 'Authorized Scientist'}
          </p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-t-2 border-slate-100 pt-2" style={{ borderTopColor: primaryColor }}>
            Laboratory Scientist
          </p>
        </div>
      </div>

      {/* Page Styles for Printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-report, .print-report * {
            visibility: visible;
          }
          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
