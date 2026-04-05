'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, FileText, CheckCircle, Clock, Save, 
  ChevronDown, AlertCircle, Printer, Download,
  Beaker, Microscope, Activity, Droplets, Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Diagnostic Templates ---
interface TemplateField {
  label: string;
  unit?: string;
  defaultValue?: string;
  referenceRange?: string;
  type?: 'number' | 'text' | 'select' | 'textarea';
  options?: string[];
}

interface DiagnosticTemplate {
  id: string;
  name: string;
  unit: 'Haematology' | 'Biochemistry' | 'Microbiology' | 'Serology' | 'Endocrinology';
  fields: TemplateField[];
}

const TEMPLATES: DiagnosticTemplate[] = [
  {
    id: 'fbc',
    name: 'Full Blood Count (FBC/CBC)',
    unit: 'Haematology',
    fields: [
      { label: 'Haemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.0 - 17.0 (M), 12.0 - 15.0 (F)', type: 'number' },
      { label: 'PCV / Haematocrit', unit: '%', referenceRange: '40 - 52 (M), 36 - 48 (F)', type: 'number' },
      { label: 'WBC Count', unit: 'x10^9/L', referenceRange: '4.0 - 11.0', type: 'number' },
      { label: 'Platelets', unit: 'x10^9/L', referenceRange: '150 - 450', type: 'number' },
      { label: 'PCV (Haematocrit)', unit: '%', referenceRange: '40 - 52 (M), 36 - 48 (F)', type: 'number' },
      { label: 'ESR (Westergren)', unit: 'mm/hr', referenceRange: '0 - 15 (M), 0 - 20 (F)', type: 'number' },
      { label: 'PBF (Blood Film)', type: 'textarea', defaultValue: 'RBCs: Normocytic Normochromic\nWBCs: Normal in number and morphology\nPLTs: Adequate on film' },
      { label: 'Neutrophils', unit: '%', referenceRange: '40 - 75', type: 'number' },
      { label: 'Lymphocytes', unit: '%', referenceRange: '20 - 45', type: 'number' }
    ]
  },
  {
    id: 'wound_mcs',
    name: 'Wound / Pus MCS',
    unit: 'Microbiology',
    fields: [
      { label: 'Gram Stain', type: 'textarea', defaultValue: 'Pus cells: \nGram positive: \nGram negative: ' },
      { label: 'Culture Growth', type: 'text', defaultValue: 'No Growth After 48hrs' },
      { label: 'Isolated Organism', type: 'text' },
      { label: 'Antibiotic Sensitivity', type: 'textarea', defaultValue: 'Sensitive to: \nResistant to: ' }
    ]
  },
  {
    id: 'pcs_esr',
    name: 'PCV & ESR Only',
    unit: 'Haematology',
    fields: [
      { label: 'PCV (Haematocrit)', unit: '%', referenceRange: '36 - 52', type: 'number' },
      { label: 'ESR (Westergren)', unit: 'mm/hr', referenceRange: '0 - 20', type: 'number' }
    ]
  },
  {
    id: 'lft',
    name: 'Liver Function Test (LFT)',
    unit: 'Biochemistry',
    fields: [
      { label: 'Total Bilirubin', unit: 'μmol/L', referenceRange: '5.1 - 17.0', type: 'number' },
      { label: 'Conjugated Bilirubin', unit: 'μmol/L', referenceRange: '0.0 - 5.0', type: 'number' },
      { label: 'ALT (SGPT)', unit: 'U/L', referenceRange: 'Up to 41', type: 'number' },
      { label: 'AST (SGOT)', unit: 'U/L', referenceRange: 'Up to 40', type: 'number' },
      { label: 'ALP', unit: 'U/L', referenceRange: '40 - 129', type: 'number' },
      { label: 'Total Protein', unit: 'g/L', referenceRange: '66 - 87', type: 'number' },
      { label: 'Albumin', unit: 'g/L', referenceRange: '35 - 52', type: 'number' }
    ]
  },
  {
    id: 'kft',
    name: 'Renal / Kidney Function (KFT)',
    unit: 'Biochemistry',
    fields: [
      { label: 'Urea', unit: 'mmol/L', referenceRange: '2.5 - 7.1', type: 'number' },
      { label: 'Creatinine', unit: 'μmol/L', referenceRange: '62 - 106 (M), 44 - 80 (F)', type: 'number' },
      { label: 'Sodium (Na+)', unit: 'mmol/L', referenceRange: '135 - 145', type: 'number' },
      { label: 'Potassium (K+)', unit: 'mmol/L', referenceRange: '3.5 - 5.1', type: 'number' },
      { label: 'Chloride (Cl-)', unit: 'mmol/L', referenceRange: '98 - 107', type: 'number' }
    ]
  },
  {
    id: 'urine_mcs',
    name: 'Urine MCS (Culture & Sensitivity)',
    unit: 'Microbiology',
    fields: [
      { label: 'Appearance', type: 'select', options: ['Clear', 'Turbid', 'Bloody', 'Straw'] },
      { label: 'Microscopy: WBC', unit: '/hpf', referenceRange: '0 - 5' },
      { label: 'Microscopy: RBC', unit: '/hpf', referenceRange: '0 - 2' },
      { label: 'Culture Growth', type: 'text', defaultValue: 'No Growth After 24hrs' },
      { label: 'Isolated Organism', type: 'text' },
      { label: 'Antibiotic Sensitivity', type: 'textarea', defaultValue: 'Sensitive to: \nResistant to: ' }
    ]
  },
  {
    id: 'blood_mcs',
    name: 'Blood MCS (Culture & Sensitivity)',
    unit: 'Microbiology',
    fields: [
      { label: 'Incubation Period', defaultValue: '7 Days' },
      { label: 'Preliminary Report (24hr)', defaultValue: 'No Growth' },
      { label: 'Sub-culture Identification', type: 'text' },
      { label: 'Antibiotic Sensitivity', type: 'textarea' }
    ]
  },
  {
    id: 'lipid',
    name: 'Lipid Profile',
    unit: 'Biochemistry',
    fields: [
      { label: 'Total Cholesterol', unit: 'mmol/L', referenceRange: 'Desirable: < 5.2' },
      { label: 'Triglycerides', unit: 'mmol/L', referenceRange: 'Desirable: < 1.7' },
      { label: 'HDL Cholesterol', unit: 'mmol/L', referenceRange: '> 1.0 (M), > 1.3 (F)' },
      { label: 'LDL Cholesterol', unit: 'mmol/L', referenceRange: 'Optimal: < 2.6' }
    ]
  },
  {
    id: 'electrolytes',
    name: 'Electrolytes (U&E)',
    unit: 'Biochemistry',
    fields: [
      { label: 'Sodium (Na+)', unit: 'mmol/L', referenceRange: '135 - 145', type: 'number' },
      { label: 'Potassium (K+)', unit: 'mmol/L', referenceRange: '3.5 - 5.1', type: 'number' },
      { label: 'Chloride (Cl-)', unit: 'mmol/L', referenceRange: '98 - 107', type: 'number' },
      { label: 'Bicarbonate (HCO3-)', unit: 'mmol/L', referenceRange: '22 - 28', type: 'number' },
      { label: 'Urea', unit: 'mmol/L', referenceRange: '2.5 - 7.1', type: 'number' },
      { label: 'Creatinine', unit: 'μmol/L', referenceRange: '62 - 106', type: 'number' }
    ]
  },
  {
    id: 'stool_analysis',
    name: 'Stool Analysis (Routine)',
    unit: 'Microbiology',
    fields: [
      { label: 'Appearance', type: 'select', options: ['Formed', 'Semi-formed', 'Loose', 'Watery'] },
      { label: 'Color', type: 'select', options: ['Brown', 'Yellow', 'Clay', 'Green', 'Bloody'] },
      { label: 'Microscopy: Cysts', type: 'text', defaultValue: 'None Seen' },
      { label: 'Microscopy: Ova', type: 'text', defaultValue: 'None Seen' },
      { label: 'Microscopy: WBC/Pus', unit: '/hpf', defaultValue: '0-2' },
      { label: 'Occult Blood', type: 'select', options: ['Negative', 'Positive'] }
    ]
  },
  {
    id: 'semen_analysis',
    name: 'Semen Analysis',
    unit: 'Microbiology',
    fields: [
      { label: 'Volume', unit: 'mL', referenceRange: '> 1.5' },
      { label: 'Liquefaction Time', unit: 'mins', referenceRange: '< 60' },
      { label: 'Total Count', unit: 'million/mL', referenceRange: '> 15' },
      { label: 'Active Motility', unit: '%', referenceRange: '> 40' },
      { label: 'Normal Morphology', unit: '%', referenceRange: '> 4' },
      { label: 'Abnormal Forms', unit: '%' }
    ]
  },
  {
    id: 'serology',
    name: 'Serology / Rapid Screen',
    unit: 'Serology',
    fields: [
      { label: 'HIV I & II', type: 'select', options: ['Non-Reactive', 'Reactive'] },
      { label: 'HBsAg (Hepatitis B)', type: 'select', options: ['Non-Reactive', 'Reactive'] },
      { label: 'HCV (Hepatitis C)', type: 'select', options: ['Non-Reactive', 'Reactive'] },
      { label: 'VDRL (Syphilis)', type: 'select', options: ['Non-Reactive', 'Reactive'] },
      { label: 'Pregnancy Test (PT)', type: 'select', options: ['Negative', 'Positive'] },
      { label: 'Widal (Typhoid)', type: 'text', defaultValue: 'TO: 1/80, TH: 1/80' }
    ]
  }
];

interface Props {
  request: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LabResultEntryModal({ request, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DiagnosticTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (request && request.results) {
      if (request.results.includes('METRIC_DATA:')) {
        try {
          const parts = request.results.split('METRIC_DATA:');
          setClinicalNotes(parts[0].trim());
          setFieldValues(JSON.parse(parts[1]));
        } catch (e) {
          setClinicalNotes(request.results);
        }
      } else {
        setClinicalNotes(request.results);
      }
    }
  }, [request]);

  const handleApplyTemplate = (template: DiagnosticTemplate) => {
    setSelectedTemplate(template);
    const newValues: Record<string, string> = { ...fieldValues };
    template.fields.forEach(f => {
      if (!newValues[f.label]) {
        newValues[f.label] = f.defaultValue || '';
      }
    });
    setFieldValues(newValues);
  };

  const handleSave = async (status: 'Collected' | 'Completed') => {
    setLoading(true);
    try {
      const { labAPI } = await import('@/lib/api');
      
      // Combine structured data and notes
      const finalResults = `${clinicalNotes}\n\nMETRIC_DATA:${JSON.stringify(fieldValues)}`;
      
      await labAPI.updateResult({
        request_id: request.id || request._id,
        status: status,
        test_name: request.test_name, // Capture refined protocol name
        results: finalResults,
        is_critical: isCritical,
        file_url: fileUrl || undefined,
        // Optional ranges if applicable (using first field as primary if number)
        min_range: undefined,
        max_range: undefined
      });

      toast.success(status === 'Completed' ? 'Diagnostic Report Authorized & Released' : 'Progress Saved as Draft');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update clinical record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-[3rem] max-w-4xl w-full p-10 shadow-[0_32px_128px_rgba(30,41,59,0.15)] overflow-hidden border border-white/40 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
              <Microscope className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Diagnostic Workspace</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Clinical Protocol Entry • Analysis in Progress</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Templates */}
        <div className="flex flex-wrap gap-2 mb-6 shrink-0 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 self-center px-2 mr-2">Protocol Library:</span>
          {TEMPLATES.map(t => (
            <button 
              key={t.id}
              onClick={() => handleApplyTemplate(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                selectedTemplate?.id === t.id ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-100"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
          {/* Patient Context */}
          <div className="bg-gray-50 p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Subject Information</p>
              <p className="font-black text-gray-900 text-lg leading-none">{request.patient?.full_name}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 bg-white px-2 py-1 rounded-lg border border-gray-100 inline-block">#{request.patient?.patient_id} • {request.priority}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Investigation Required</p>
              <div className="relative group">
                <input 
                  type="text"
                  className="font-black text-indigo-600 text-lg leading-none bg-transparent border-b border-dashed border-indigo-200 hover:border-indigo-400 focus:border-indigo-600 outline-none w-full pb-1 transition-all"
                  value={request.test_name}
                  onChange={(e) => {
                    // Update local request object (though it won't persist until save)
                    request.test_name = e.target.value;
                  }}
                />
                <p className="text-[10px] text-gray-500 font-medium mt-2 italic flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Scheduled: {new Date(request.requested_at).toLocaleString()}
                  <span className="text-amber-500 font-bold ml-2 underline cursor-help" title="Scientists can refine the test name to match specialized protocols">Editable Protocol</span>
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {selectedTemplate?.fields.map((field, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-end mb-1.5 ml-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label} {field.unit && `(${field.unit})`}</label>
                  {field.referenceRange && <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded leading-none">REF: {field.referenceRange}</span>}
                </div>
                {field.type === 'textarea' ? (
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                    rows={2}
                    value={fieldValues[field.label] || ''}
                    onChange={e => setFieldValues({...fieldValues, [field.label]: e.target.value})}
                  />
                ) : field.type === 'select' ? (
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner appearance-none"
                    value={fieldValues[field.label] || ''}
                    onChange={e => setFieldValues({...fieldValues, [field.label]: e.target.value})}
                  >
                    <option value="">Select Observation...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={field.type || 'text'}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                    value={fieldValues[field.label] || ''}
                    onChange={e => setFieldValues({...fieldValues, [field.label]: e.target.value})}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-6 border-t border-gray-100 pt-8">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">Clinical Observations & Qualitative Commentary</label>
              <textarea 
                rows={4} 
                className="w-full bg-gray-50 border border-gray-200/50 rounded-[1.5rem] p-5 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 shadow-inner" 
                placeholder="Record structured findings, cellular morphology, and microbial characteristics..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">Cloud Attachment URI</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200/50 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 shadow-inner" 
                  placeholder="https://secure-results-storage.io/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-end">
                <button 
                  onClick={() => setIsCritical(!isCritical)}
                  className={cn(
                    "w-full h-[56px] rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3",
                    isCritical ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200" : "bg-gray-50 text-gray-400 border-gray-100 grayscale hover:grayscale-0 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                  )}
                >
                  <AlertCircle className="w-5 h-5" />
                  {isCritical ? 'Abnormal Value Alert Active' : 'Mark as Critical / Abnormal'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4 shrink-0">
          <button 
            onClick={() => handleSave('Collected')}
            disabled={loading}
            className="flex-1 py-4 rounded-[1.25rem] font-black text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Clock className="w-5 h-5" />
            <span className="uppercase tracking-[0.2em] text-[10px]">Save as Draft</span>
          </button>
          
          <button 
            onClick={() => handleSave('Completed')}
            disabled={loading}
            className="flex-1 py-4 rounded-[1.25rem] font-black text-white bg-gray-900 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200 hover:shadow-emerald-100 flex items-center justify-center gap-3 disabled:opacity-50 group"
          >
            {loading ? <Activity className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 group-hover:animate-bounce" />}
            <span className="uppercase tracking-[0.2em] text-[10px]">{loading ? 'Processing protocol...' : 'Authorize & Release Result'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
