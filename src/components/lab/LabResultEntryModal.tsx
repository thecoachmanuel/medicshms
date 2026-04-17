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
import { useParams } from 'next/navigation';

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
  unit: 'Haematology' | 'Chemical Pathology' | 'Microbiology' | 'Serology' | 'Endocrinology';
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
    unit: 'Chemical Pathology',
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
    unit: 'Chemical Pathology',
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
    unit: 'Chemical Pathology',
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
    unit: 'Chemical Pathology',
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
  const params = useParams();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [testName, setTestName] = useState(request.test_name || '');
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
          const data = JSON.parse(parts[1]);
          
          if (Array.isArray(data)) {
            // New format: Array of metric objects { label, value, ... }
            const values: Record<string, string> = {};
            data.forEach((m: any) => {
              values[m.label] = m.value;
            });
            setFieldValues(values);
          } else {
            // Legacy format: Object { "label": "value" }
            setFieldValues(data);
          }
        } catch (e) {
          setClinicalNotes(request.results);
        }
      } else {
        setClinicalNotes(request.results);
      }
    }
  }, [request]);

  // Auto-apply matching protocol from catalog
  useEffect(() => {
    if (request && catalog.length > 0 && fields.length === 0) {
      const match = catalog.find(i => i.test_name.toLowerCase() === request.test_name.toLowerCase());
      if (match && match.template_schema?.fields?.length > 0) {
        handleApplyTemplate(match);
      }
    }
  }, [request, catalog, fields.length]);

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

    // Populate default values from template schema, preserving any existing inputs mapped by label
    const newValues: Record<string, string> = { ...fieldValues };
    schema.fields.forEach((f: any) => {
      // Use label as the key for persistence and UI binding
      if (newValues[f.label] === undefined || newValues[f.label] === '') {
        newValues[f.label] = f.defaultValue || '';
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
    if (fieldValues[field.label]) {
      setFieldValues({ ...fieldValues, [newField.label]: fieldValues[field.label] });
    }
  };

  const handleRemoveField = (field: any) => {
    setFields(fields.filter(f => f.id !== field.id));
    const newValues = { ...fieldValues };
    delete newValues[field.label];
    setFieldValues(newValues);
  };

  const handleUpdateFieldMeta = (id: string, updates: any) => {
    // If the label is changing, migrate the value in fieldValues
    if (updates.label !== undefined) {
      const field = fields.find(f => f.id === id);
      if (field && field.label !== updates.label) {
        const newValues = { ...fieldValues };
        newValues[updates.label] = newValues[field.label] || '';
        // Note: we might want to delete the old one, but keeping it is safer for history
        setFieldValues(newValues);
      }
    }
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSaveAsMaster = async () => {
    if (fields.length === 0) {
      return toast.error('Define protocol parameters before saving');
    }
    setLoading(true);
    try {
      const { labAPI } = await import('@/lib/api');
      await labAPI.upsertCatalogItem({
        test_name: testName || request.test_name,
        template_schema: { fields },
        hospital_id: selectedTemplate?.hospital_id,
        unit_id: request.unit_id || selectedTemplate?.unit_id
      });
      toast.success(`Protocol for "${testName || request.test_name}" synchronized with Global Catalog`);
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
      const { labAPI, siteSettingsAPI } = await import('@/lib/api');
      const settingsRes = await siteSettingsAPI.get({ slug }) as any;
      const settings = settingsRes.data || {};
      
      // Capture structured metrics including metadata for the report
      const structuredResults = fields.map(f => ({
        label: f.label,
        value: fieldValues[f.label] || '',
        unit: f.unit || '',
        referenceRange: f.referenceRange || ''
      }));

      const finalResults = `${clinicalNotes}\n\nMETRIC_DATA:${JSON.stringify(structuredResults)}`;
      
      await labAPI.updateResult({
        request_id: request.id || request._id,
        status: status,
        test_name: testName || request.test_name, // Capture refined protocol name
        results: finalResults,
        is_critical: isCritical,
        file_url: fileUrl || undefined,
        // Optional ranges if applicable (using first field as primary if number)
        min_range: undefined,
        max_range: undefined,
        hospital_details: settings,
        unit_name: request.unit?.name
      });

      toast.success(status === 'Completed' ? 'Diagnostic Report Authorized & Released' : 'Progress Saved as Draft');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.details || error.response?.data?.message || error.message || 'Unknown database error';
      console.error('❌ [Lab Result Authorization Failed]:', { error, errorMsg });
      toast.error(`Failed to update clinical record: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className={cn(
        "relative bg-white/95 backdrop-blur-3xl rounded-2xl sm:rounded-[3.5rem] w-full p-4 sm:p-12 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] border border-white/60 max-h-[98vh] sm:max-h-[90vh] flex flex-col transition-all duration-500",
        showLibrary ? "max-w-7xl" : "max-w-4xl"
      )}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 sm:mb-10 shrink-0">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-[2rem] bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shrink-0 shadow-inner">
              <Microscope className="w-5 h-5 sm:w-8 sm:h-8 text-indigo-600" />
            </div>
            <div className="min-w-0 pr-4">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight truncate leading-none mb-2">Diagnostic Workspace</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-[9px] sm:text-[11px] text-gray-400 font-black uppercase tracking-[0.25em] truncate">CLINICAL PROTOCOL ENTRY</p>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-indigo-500/20" />
                <p className="text-[9px] sm:text-[11px] text-indigo-600 font-black uppercase tracking-[0.25em] truncate bg-indigo-50 px-2 py-0.5 rounded-full">
                  {(Array.isArray(request.handled_by_profile?.assignments) ? request.handled_by_profile?.assignments[0] : request.handled_by_profile?.assignments)?.unit?.name ||
                   (Array.isArray(request.handled_by_profile?.staff_record) ? request.handled_by_profile?.staff_record[0] : request.handled_by_profile?.staff_record)?.dept?.name || 
                   request.unit?.name || 
                   'Laboratory Department'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setShowLibrary(!showLibrary)}
              className={cn(
                "hidden lg:flex px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] items-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-indigo-100/50",
                showLibrary ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-100"
              )}
            >
              <Database className="w-4 h-4" />
              {showLibrary ? "CONSOLIDATE" : "EXPAND LIBRARY"}
            </button>
            <button 
              onClick={onClose} 
              className="p-3 sm:p-4 bg-gray-50/50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-xl sm:rounded-3xl transition-all duration-500 active:scale-90 border border-transparent hover:border-rose-100"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 sm:gap-8 min-h-0 relative">
          {showLibrary && (
            <div className="absolute inset-0 z-[60] lg:relative lg:z-auto lg:w-80 shrink-0 bg-white/95 lg:bg-gray-50/50 backdrop-blur-3xl lg:backdrop-blur-none rounded-2xl sm:rounded-[2.5rem] border border-gray-100 p-6 flex flex-col gap-6 animate-in slide-in-from-left-8 duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] lg:shadow-none">
              <div className="flex items-center justify-between lg:hidden">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Protocol Intelligence</h3>
                <button 
                  onClick={() => setShowLibrary(false)} 
                  className="p-3 bg-gray-100 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* Unified Search Results Grouped by Unit */}
                <div className="space-y-6">
                  {Object.entries(
                    [...TEMPLATES, ...catalog]
                      .filter(t => (t.name || t.test_name)?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .reduce((acc: any, t) => {
                        const unitName = (typeof t.unit === 'string' ? t.unit : t.unit?.name) || 'General';
                        const normalizedUnit = unitName === 'Biochemistry' ? 'Chemical Pathology' : unitName;
                        if (!acc[normalizedUnit]) acc[normalizedUnit] = [];
                        
                        // Prevent duplicates based on name/test_name
                        const name = (t.name || t.test_name);
                        if (!acc[normalizedUnit].find((existing: any) => (existing.name || existing.test_name) === name)) {
                          acc[normalizedUnit].push(t);
                        }
                        return acc;
                      }, {})
                  ).map(([unit, tests]: [string, any]) => (
                    <div key={unit}>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        {unit}
                        <span className="text-[8px] font-bold text-gray-300 ml-1">({tests.length})</span>
                        <span className="h-px flex-1 bg-gray-100 ml-2" />
                      </p>
                      <div className="space-y-1.5">
                        {tests.map((t: any) => (
                          <button 
                            key={t.id}
                            onClick={() => handleApplyTemplate(t)}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold transition-all border truncate cursor-pointer",
                              selectedTemplate?.id === t.id ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white text-gray-600 hover:bg-white hover:border-indigo-200 border-transparent shadow-sm hover:shadow-md"
                            )}
                            title={t.name || t.test_name}
                          >
                            <div className="flex flex-col">
                              <span className="truncate">{t.name || t.test_name}</span>
                              {t.price && (
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-tighter mt-0.5",
                                  selectedTemplate?.id === t.id ? "text-indigo-200" : "text-emerald-500"
                                )}>
                                  ₦{(t.price || 0).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar space-y-6 sm:space-y-8 overscroll-behavior-contain">
              {/* Mobile Library Toggle */}
              <button 
                onClick={() => setShowLibrary(true)}
                className="w-full sm:hidden py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 mb-4"
              >
                <Database className="w-4 h-4" /> Open Protocol Library
              </button>
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
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
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
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 sm:mb-0">Diagnostic Parameters</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleSaveAsMaster}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save as Protocol
                    </button>
                    <button 
                      onClick={handleAddField}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Field
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {fields.map((field) => (
                    <div key={field.id} className="group bg-gray-50/50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-gray-100 transition-all duration-500">
                      <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                        {/* Parameter Label & Metadata */}
                        <div className="flex-1 space-y-4">
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
                                                 {/* Result Input */}
                        <div className="w-full lg:w-72">
                          {field.type === 'textarea' ? (
                            <textarea 
                              className="w-full h-32 bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              value={fieldValues[field.label] || ''}
                              onChange={e => setFieldValues({...fieldValues, [field.label]: e.target.value})}
                              placeholder="Record finding..."
                            />
                          ) : field.type === 'select' ? (
                            <select 
                              className="w-full h-[56px] bg-white border border-gray-200 rounded-2xl px-5 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                              value={fieldValues[field.label] || ''}
                              onChange={e => setFieldValues({...fieldValues, [field.label]: e.target.value})}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input 
                              type={field.type || 'text'}
                              className="w-full h-[56px] bg-white border border-gray-200 rounded-2xl px-5 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              value={fieldValues[field.label] || ''}
                              onChange={e => setFieldValues({...fieldValues, [field.label]: e.target.value})}
                              placeholder="Value..."
                            />
                          )}
                        </div>

                        {/* Row Actions */}
                        <div className="flex flex-row lg:flex-col gap-2.5 items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-5 lg:pt-0 lg:pl-6">
                          <button 
                            onClick={() => handleUpdateFieldMeta(field.id, { hideUnit: !field.hideUnit })}
                            className={cn(
                              "p-2.5 rounded-xl transition-all cursor-pointer",
                              field.hideUnit ? "text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 bg-gray-50/50" : "text-indigo-600 bg-indigo-50"
                            )}
                            title={field.hideUnit ? "Show Unit Field" : "Hide Unit Field"}
                          >
                            {field.hideUnit ? <EyeOff className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Eye className="w-4 h-4 md:w-3.5 md:h-3.5" />}
                          </button>
                          <button 
                            onClick={() => handleUpdateFieldMeta(field.id, { hideRef: !field.hideRef })}
                            className={cn(
                              "p-2.5 rounded-xl transition-all cursor-pointer",
                              field.hideRef ? "text-gray-300 hover:text-rose-600 hover:bg-rose-50 bg-gray-50/50" : "text-rose-600 bg-rose-50"
                            )}
                            title={field.hideRef ? "Show Ref Range" : "Hide Ref Range"}
                          >
                            {field.hideRef ? <EyeOff className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Eye className="w-4 h-4 md:w-3.5 md:h-3.5" />}
                          </button>
                          <div className="w-full h-px bg-gray-100 my-1 hidden md:block" />
                          <button 
                            onClick={() => handleDuplicateField(field)}
                            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer bg-gray-50/50"
                            title="Duplicate Entry"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveField(field)}
                            className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer bg-gray-50/50"
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
                        "w-full h-[56px] rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3 cursor-pointer",
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
            <div className="p-4 sm:p-10 bg-white border-t border-gray-100 flex flex-col sm:row gap-4 sm:gap-6 shrink-0">
              <button 
                onClick={() => handleSave('Collected')}
                disabled={loading}
                className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-[1.5rem] font-black text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer order-2 sm:order-1 group"
              >
                <Clock className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="uppercase tracking-[0.25em] text-[10px]">Save Protocol Draft</span>
              </button>
              
              <button 
                onClick={() => handleSave('Completed')}
                disabled={loading}
                className="flex-1 py-4 sm:py-5 rounded-2xl sm:rounded-[1.5rem] font-black text-white bg-indigo-600 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-200 hover:shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50 group cursor-pointer order-1 sm:order-2"
              >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 group-hover:animate-bounce" />}
                <span className="uppercase tracking-[0.25em] text-[10px]">{loading ? 'Synchronizing results...' : 'Authorize & Release Clinical Data'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
