'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, FileText, CheckCircle, Clock, Save, 
  ChevronDown, AlertCircle, Printer, Download,
  Beaker, Microscope, Activity, Droplets, Info,
  Plus, Trash2, Edit3, Copy, ChevronLeft, ChevronRight,
  Database, File, Paperclip, Upload,
  Search, Eye, EyeOff, Settings2
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
      { label: 'Haemoglobin (Hb)', unit: 'mg/dL', referenceRange: '13000 - 17000 (M), 12000 - 15000 (F)', type: 'number' },
      { label: 'PCV / Haematocrit', unit: '%', referenceRange: '40 - 52 (M), 36 - 48 (F)', type: 'number' },
      { label: 'WBC Count', unit: 'x10^9/L', referenceRange: '4.0 - 11.0', type: 'number' },
      { label: 'Platelets', unit: 'x10^9/L', referenceRange: '150 - 450', type: 'number' },
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
      { label: 'Total Bilirubin', unit: 'mg/dL', referenceRange: '0.3 - 1.2', type: 'number' },
      { label: 'Conjugated Bilirubin', unit: 'mg/dL', referenceRange: '0.0 - 0.3', type: 'number' },
      { label: 'ALT (SGPT)', unit: 'U/L', referenceRange: 'Up to 41', type: 'number' },
      { label: 'AST (SGOT)', unit: 'U/L', referenceRange: 'Up to 40', type: 'number' },
      { label: 'ALP', unit: 'U/L', referenceRange: '40 - 129', type: 'number' },
      { label: 'Total Protein', unit: 'mg/dL', referenceRange: '6600 - 8700', type: 'number' },
      { label: 'Albumin', unit: 'mg/dL', referenceRange: '3500 - 5200', type: 'number' }
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
      { label: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200' },
      { label: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150' },
      { label: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '> 40 (M), > 50 (F)' },
      { label: 'LDL Cholesterol', unit: 'mg/dL', referenceRange: '< 100' }
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
  const [showLibrary, setShowLibrary] = useState(true);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const { labAPI } = await import('@/lib/api');
      const res = await labAPI.getCatalog() as any;
      setCatalog(res.data || []);
    } catch (e) {
      console.error('Failed to load catalog');
    }
  };

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

  const handleApplyTemplate = (template: any) => {
    const schema = template.template_schema || (TEMPLATES.find(t => t.id === template.id) as any)?.template_schema || { fields: template.fields || [] };
    setSelectedTemplate(template);
    
    // Initialize fields from schema with unique IDs for dynamic manipulation
    const initialFields = schema.fields.map((f: any, idx: number) => ({
      ...f,
      id: `field-${Date.now()}-${idx}`,
      hideUnit: f.unit === undefined || f.unit === '',
      hideRef: f.referenceRange === undefined || f.referenceRange === ''
    }));
    setFields(initialFields);

    const newValues: Record<string, string> = { ...fieldValues };
    initialFields.forEach((f: any) => {
      if (!newValues[f.id]) {
        newValues[f.id] = f.defaultValue || '';
      }
    });
    setFieldValues(newValues);
  };

  const handleAddField = () => {
    const newField = { 
      id: `field-${Date.now()}`,
      label: 'New Parameter',
      unit: '',
      referenceRange: '',
      type: 'text'
    };
    setFields([...fields, newField]);
  };

  const handleDuplicateField = (field: any) => {
    const newField = { 
      ...field, 
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`
    };
    setFields([...fields, newField]);
    if (fieldValues[field.id]) {
      setFieldValues({ ...fieldValues, [newField.id]: fieldValues[field.id] });
    }
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    const newValues = { ...fieldValues };
    delete newValues[id];
    setFieldValues(newValues);
  };

  const handleUpdateFieldMeta = (id: string, updates: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSaveAsMaster = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const { labAPI } = await import('@/lib/api');
      await labAPI.upsertCatalogItem({
        test_name: selectedTemplate.test_name || selectedTemplate.name,
        template_schema: { fields },
        hospital_id: selectedTemplate.hospital_id,
        unit_id: selectedTemplate.unit_id
      });
      toast.success('Master Template Repository Updated');
      fetchCatalog();
    } catch (e) {
      toast.error('Failed to update master template');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB Limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB clinical threshold');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadAPI } = await import('@/lib/api');
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadAPI.upload(formData) as any;
      setFileUrl(res.data?.url || res.url);
      toast.success('Clinical evidence uploaded successfully');
    } catch (e) {
      toast.error('Laboratory upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (status: 'Collected' | 'Completed') => {
    setLoading(true);
    try {
      const { labAPI } = await import('@/lib/api');
      
      // Combine structured data - using a map of labels for the final result output
      const structuredResults: Record<string, string> = {};
      fields.forEach(f => {
        structuredResults[f.label] = fieldValues[f.id] || '';
      });

      const finalResults = `${clinicalNotes}\n\nMETRIC_DATA:${JSON.stringify(structuredResults)}`;
      
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
      <div className={cn(
        "relative bg-white/95 backdrop-blur-md rounded-[3rem] w-full p-10 shadow-[0_32px_128px_rgba(30,41,59,0.15)] overflow-hidden border border-white/40 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300 transition-all",
        showLibrary ? "max-w-6xl" : "max-w-4xl"
      )}>
        
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
            <button 
              onClick={() => setShowLibrary(!showLibrary)}
              className={cn(
                "ml-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                showLibrary ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
              )}
            >
              <Database className="w-3 h-3" />
              {showLibrary ? "Hide Library" : "Show Library"}
            </button>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
          {/* Collapsible Sidebar: Test Template Library */}
          {showLibrary && (
            <div className="w-64 shrink-0 bg-gray-50/50 rounded-[2rem] border border-gray-100 p-4 flex flex-col gap-4 animate-in slide-in-from-left-4 duration-300">
              <div className="px-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Investigation Library</h3>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search test templates..."
                    className="w-full pl-8 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
                {/* Seeded Templates (Legacy/Hardcoded) */}
                <div className="mb-4">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-2">Quick Access</p>
                  {TEMPLATES.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                    <button 
                      key={t.id}
                      onClick={() => handleApplyTemplate(t)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold transition-all border",
                        selectedTemplate?.id === t.id ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white text-gray-600 hover:bg-white hover:border-indigo-200 border-transparent"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                {/* Database Catalog Templates */}
                <div>
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-2 ml-2">Global Catalog</p>
                  {catalog.filter(t => t.test_name.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                    <button 
                      key={t.id}
                      onClick={() => handleApplyTemplate(t)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold transition-all border truncate",
                        selectedTemplate?.id === t.id ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white text-gray-600 hover:bg-white hover:border-indigo-200 border-transparent"
                      )}
                      title={t.test_name}
                    >
                      {t.test_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Patient Context */}
              <div className="bg-slate-50/50 p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8 border border-slate-100">
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
                        request.test_name = e.target.value;
                      }}
                    />
                    <p className="text-[10px] text-gray-500 font-medium mt-2 italic flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Scheduled: {new Date(request.requested_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Protocol Fields */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest uppercase tracking-[0.2em]">Diagnostic Parameters</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveAsMaster}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <Save className="w-3.5 h-3.5" /> Save as Protocol
                    </button>
                    <button 
                      onClick={handleAddField}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Field
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {fields.map((field) => (
                    <div key={field.id} className="group bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 rounded-3xl p-5 border border-gray-100 transition-all">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Parameter Label & Metadata */}
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateFieldMeta(field.id, { label: e.target.value })}
                            className="text-[11px] font-black text-gray-800 uppercase tracking-widest bg-transparent border-none outline-none focus:ring-0 w-full p-0"
                            placeholder="Parameter Name"
                          />
                          <div className="flex items-center gap-3">
                            {!field.hideUnit && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-indigo-100/50 shadow-sm transition-all hover:bg-indigo-50/50 cursor-text">
                                <span className="text-[8px] font-black text-indigo-400 uppercase">Unit:</span>
                                <input 
                                  type="text"
                                  value={field.unit}
                                  onChange={(e) => handleUpdateFieldMeta(field.id, { unit: e.target.value })}
                                  className="text-[9px] font-bold text-indigo-600 bg-transparent border-none outline-none focus:ring-0 w-12 p-0"
                                  placeholder="..."
                                />
                              </div>
                            )}
                            {!field.hideRef && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-indigo-100/50 shadow-sm transition-all hover:bg-indigo-50/50 cursor-text">
                                <span className="text-[8px] font-black text-indigo-400 uppercase">REF:</span>
                                <input 
                                  type="text"
                                  value={field.referenceRange}
                                  onChange={(e) => handleUpdateFieldMeta(field.id, { referenceRange: e.target.value })}
                                  className="text-[9px] font-bold text-indigo-600 bg-transparent border-none outline-none focus:ring-0 w-32 p-0"
                                  placeholder="Range..."
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Result Input */}
                        <div className="w-full md:w-64">
                          {field.type === 'textarea' ? (
                            <textarea 
                              className="w-full h-24 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              value={fieldValues[field.id] || ''}
                              onChange={e => setFieldValues({...fieldValues, [field.id]: e.target.value})}
                              placeholder="Record finding..."
                            />
                          ) : field.type === 'select' ? (
                            <select 
                              className="w-full h-[48px] bg-white border border-gray-200 rounded-2xl px-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                              value={fieldValues[field.id] || ''}
                              onChange={e => setFieldValues({...fieldValues, [field.id]: e.target.value})}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input 
                              type={field.type || 'text'}
                              className="w-full h-[48px] bg-white border border-gray-200 rounded-2xl px-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              value={fieldValues[field.id] || ''}
                              onChange={e => setFieldValues({...fieldValues, [field.id]: e.target.value})}
                              placeholder="Value..."
                            />
                          )}
                        </div>

                        {/* Row Actions */}
                        <div className="flex md:flex-col gap-2 items-center justify-center border-l border-gray-100 pl-4">
                          <button 
                            onClick={() => handleUpdateFieldMeta(field.id, { hideUnit: !field.hideUnit })}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              field.hideUnit ? "text-gray-300 hover:text-indigo-600 hover:bg-indigo-50" : "text-indigo-600 bg-indigo-50"
                            )}
                            title={field.hideUnit ? "Show Unit Field" : "Hide Unit Field"}
                          >
                            {field.hideUnit ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => handleUpdateFieldMeta(field.id, { hideRef: !field.hideRef })}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              field.hideRef ? "text-gray-300 hover:text-rose-600 hover:bg-rose-50" : "text-rose-600 bg-rose-50"
                            )}
                            title={field.hideRef ? "Show Ref Range" : "Hide Ref Range"}
                          >
                            {field.hideRef ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <div className="w-full h-px bg-gray-100 my-1 hidden md:block" />
                          <button 
                            onClick={() => handleDuplicateField(field)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Duplicate Entry"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveField(field.id)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                      <Droplets className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold text-sm">No parameters defined.</p>
                      <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mt-1">Select a protocol from the library or add fields manually.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Qualitative Observations */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">COMMENTS</label>
                  <textarea 
                    rows={4} 
                    className="w-full bg-gray-50 border border-gray-200/50 rounded-[1.5rem] p-5 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-gray-800 shadow-inner" 
                    placeholder="Record structured findings, cellular morphology, and microbial characteristics..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group relative">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 mb-2">Clinical Attachment (Max 5MB)</label>
                    <div className="relative group/upload h-[56px]">
                      <input 
                        type="file" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        disabled={isUploading}
                      />
                      <div className={cn(
                        "w-full h-full px-6 bg-gray-50 border border-dashed border-gray-200 rounded-[1.25rem] flex items-center justify-between transition-all group-hover/upload:border-indigo-300 group-hover/upload:bg-indigo-50/10",
                        isUploading && "animate-pulse border-amber-300"
                      )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isUploading ? (
                            <Activity className="w-4 h-4 text-amber-500 animate-spin" />
                          ) : fileUrl ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={cn(
                            "text-[10px] font-bold truncate pr-4",
                            fileUrl ? "text-emerald-700" : "text-gray-400"
                          )}>
                            {isUploading ? "Uploading clinical data..." : fileUrl ? fileUrl.split('/').pop() : "Drag or click to attach evidence"}
                          </span>
                        </div>
                        <Upload className="w-4 h-4 text-gray-300 group-hover/upload:text-indigo-500 transition-all shrink-0" />
                      </div>
                    </div>
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
            <div className="p-8 bg-white border-t border-gray-100 flex gap-4 shrink-0">
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
      </div>

    </div>
  );
}
