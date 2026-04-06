'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Users, BookOpen, 
  FlaskConical, Search, Loader2,
  X, AlertCircle, Info, Beaker, CheckCircle,
  ChevronDown, MousePointer2, Settings2,
  Trash
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { labAPI, usersAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LabManagementSection() {
  const [units, setUnits] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [scientists, setScientists] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'units' | 'assignments' | 'catalog'>('units');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [protocolFields, setProtocolFields] = useState<any[]>([]);
  const [showProtocolEditor, setShowProtocolEditor] = useState(false);

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes, sRes, aRes] = await Promise.all([
        labAPI.getUnits(),
        labAPI.getCatalog(),
        usersAPI.getUsersByRole('lab_scientist'),
        labAPI.getAssignments()
      ]);
      setUnits(uRes.data || []);
      setCatalog(cRes.data || []);
      setScientists(sRes.data || []);
      setAssignments(aRes.data || []);
    } catch (error) {
      toast.error('Failed to load laboratory matrix data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: data.get('name') as string,
      description: data.get('description') as string
    };
    try {
      if (editingItem) {
        await labAPI.updateUnit(editingItem.id, payload);
        toast.success('Unit updated');
      } else {
        await labAPI.createUnit(payload);
        toast.success('New unit established');
      }
      setIsUnitModalOpen(false);
      setEditingItem(null);
      fetchLabData();
    } catch (e) { toast.error('Operation failed'); }
  };

  const handleAddField = () => {
    const newField = { 
      label: '', 
      unit: '', 
      referenceRange: '', 
      type: 'text' 
    };
    setProtocolFields([...protocolFields, newField]);
  };

  const handleRemoveField = (index: number) => {
    setProtocolFields(protocolFields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, updates: any) => {
    const next = [...protocolFields];
    next[index] = { ...next[index], ...updates };
    setProtocolFields(next);
  };

  const handleUpsertCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const payload = {
      id: editingItem?.id,
      test_name: data.get('test_name') as string,
      price: parseFloat(data.get('price') as string),
      unit_id: data.get('unit_id') as string,
      description: data.get('description') as string,
      template_schema: { fields: protocolFields }
    };
    try {
      await labAPI.upsertCatalogItem(payload);
      toast.success('Catalog entry synchronized');
      setIsCatalogModalOpen(false);
      setEditingItem(null);
      setProtocolFields([]);
      fetchLabData();
    } catch (e) { toast.error('Catalog operation failed'); }
  };

  const handleAssignScientist = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    try {
      await labAPI.assignScientist({
        unit_id: data.get('unit_id') as string,
        scientist_id: data.get('scientist_id') as string
      });
      toast.success('Scientist assigned to unit');
      setIsAssignModalOpen(false);
      fetchLabData();
    } catch (e) { toast.error('Assignment failed'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronizing Matrix Data...</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          {(['units', 'assignments', 'catalog'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setSubTab(t)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                subTab === t ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <input 
             type="text"
             placeholder="Search matrix..."
             className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {subTab === 'units' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">Diagnostic Units</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Define specialized laboratory departments</p>
                </div>
             </div>
             <button 
               onClick={() => { setEditingItem(null); setIsUnitModalOpen(true); }}
               className="btn-primary py-2.5 px-6 text-[10px]"
             >
               <Plus className="w-4 h-4" /> Establish Unit
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(unit => (
              <div key={unit.id} className="card p-6 flex flex-col justify-between group hover:border-primary-300 transition-all hover:shadow-xl hover:shadow-primary-600/5 hover:-translate-y-1">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight">{unit.name}</h4>
                    <FlaskConical className="w-4 h-4 text-gray-200 group-hover:text-primary-300 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{unit.description || 'No specialized description provided for this diagnostic unit.'}</p>
                </div>
                <div className="flex gap-2 mt-6 pt-6 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => { setEditingItem(unit); setIsUnitModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={async () => { if(confirm('Delete diagnostics unit?')) { await labAPI.deleteUnit(unit.id); fetchLabData(); } }} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-base font-bold">Personnel Mapping</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assign clinical scientists to diagnostic units</p>
                </div>
             </div>
             <button onClick={() => setIsAssignModalOpen(true)} className="btn-primary py-2.5 px-6 text-[10px] bg-amber-600 hover:bg-amber-700 border-amber-700 shadow-amber-100">
               <Users className="w-4 h-4" /> Map Personnel
             </button>
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-gray-100 shadow-inner">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Scientist</th>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Assigned Unit</th>
                  <th className="p-5 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.filter(a => a.scientist?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.unit?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-black text-primary-600 uppercase">{a.scientist?.full_name?.charAt(0)}</div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{a.scientist?.full_name || 'Legacy User'}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary-100/50">
                        {a.unit?.name}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button onClick={async () => { if(confirm('Remove assignment?')) { await labAPI.removeAssignment(a.id); fetchLabData(); } }} className="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">Disconnect</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-base font-bold">Diagnostic Catalog</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Standardized tests & pricing index</p>
                </div>
             </div>
             <button onClick={() => { 
               setEditingItem(null); 
               setProtocolFields([]);
               setShowProtocolEditor(false);
               setIsCatalogModalOpen(true); 
             }} className="btn-primary py-2.5 px-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 border-emerald-700 shadow-emerald-100">
               <BookOpen className="w-4 h-4" /> Add Test
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {catalog.filter(i => i.test_name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
              <div key={item.id} className="card p-5 group hover:border-emerald-200 transition-all relative overflow-hidden flex flex-col justify-between">
                <div>
                  {item.is_auto_created && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter rounded-bl-xl border-l border-b border-amber-200">Auto-Indexed</div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1 max-w-[80%]">
                      <h4 className="font-black text-gray-900 uppercase text-xs leading-relaxed">{item.test_name}</h4>
                      {item.template_schema?.fields?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                          <CheckCircle className="w-2 h-2" /> Protocol Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50">
                          <AlertCircle className="w-2 h-2" /> No Protocol
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.unit?.name || 'General'}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-black text-emerald-600">₦</span>
                    <span className="text-lg font-black text-emerald-600 tracking-tighter italic">{(item.price || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => { 
                      setEditingItem(item); 
                      setProtocolFields(item.template_schema?.fields || []);
                      setShowProtocolEditor(!!item.template_schema?.fields?.length);
                      setIsCatalogModalOpen(true); 
                    }} className="p-2.5 bg-gray-50 rounded-xl hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={async () => { if(confirm('Remove from catalog?')) { await labAPI.deleteCatalogItem(item.id); fetchLabData(); } }} className="p-2.5 bg-gray-50 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals - Common styling */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsUnitModalOpen(false)}></div>
           <div className="relative bg-white rounded-[3rem] w-full max-w-md p-10 shadow-[0_32px_128px_rgba(30,41,59,0.2)] space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingItem ? 'Refine Unit' : 'Establish Unit'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Laboratory Test Parameter</p>
                </div>
                <button onClick={() => setIsUnitModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateUnit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Laboratory Unit Name</label>
                    <input name="name" defaultValue={editingItem?.name} required className="input py-4 text-sm font-bold placeholder:text-gray-300 placeholder:font-medium" placeholder="E.G. HAEMATOLOGY" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Functional Scope</label>
                    <textarea name="description" defaultValue={editingItem?.description} className="input py-4 min-h-[120px] text-sm font-medium resize-none" placeholder="Describe the primary diagnostic focus of this specialized lab unit..." />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="submit" className="w-full btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20">
                      {editingItem ? 'Commit Changes' : 'Establish Diagnostic Unit'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsCatalogModalOpen(false)}></div>
           <div className={cn(
             "relative bg-white rounded-[3rem] w-full p-10 shadow-[0_32px_128px_rgba(30,41,59,0.2)] space-y-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]",
             showProtocolEditor ? "max-w-5xl" : "max-w-lg"
           )}>
              <div className="flex justify-between items-center shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingItem ? 'Update Test' : 'New Investigation'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Diagnostic Catalog Indexing</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowProtocolEditor(!showProtocolEditor)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      showProtocolEditor ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                    )}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    {showProtocolEditor ? 'Hide Protocol' : 'Set Protocol'}
                  </button>
                  <button onClick={() => setIsCatalogModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="flex gap-8 overflow-hidden">
                <form onSubmit={handleUpsertCatalog} className={cn("space-y-6 flex flex-col min-w-0 transition-all", showProtocolEditor ? "w-1/3" : "w-full")}>
                   <div className="space-y-6 overflow-y-auto pr-2">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Investigation Name</label>
                         <input name="test_name" defaultValue={editingItem?.test_name} required className="input py-4 text-sm font-bold uppercase" placeholder="FULL BLOOD COUNT" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Standard Service Fee (₦)</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">₦</span>
                            <input name="price" type="number" defaultValue={editingItem?.price} required className="input py-4 pl-9 text-sm font-black italic text-emerald-600" placeholder="0.00" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Home Unit</label>
                         <div className="relative">
                           <select name="unit_id" defaultValue={editingItem?.unit_id} className="input py-4 text-sm font-black appearance-none truncate pr-10">
                              <option value="">GENERAL / SHARED</option>
                              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                           </select>
                           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Test / Preparation</label>
                         <textarea name="description" defaultValue={editingItem?.description} className="input py-4 min-h-[100px] text-sm font-medium" placeholder="Specify fasting requirements or collection tests..." />
                      </div>
                   </div>
                   
                   <button type="submit" className="w-full btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-600 border-emerald-700 shadow-xl shadow-emerald-600/20 shrink-0">
                     Sync to Diagnostic Catalog
                   </button>
                </form>

                {showProtocolEditor && (
                  <div className="flex-1 flex flex-col bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden animate-in slide-in-from-right-4">
                     <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                        <div>
                          <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Protocol Architect</h4>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Parameters for automated result entry</p>
                        </div>
                        <button 
                          type="button"
                          onClick={handleAddField}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add Parameter
                        </button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                        {protocolFields.map((field, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center group hover:border-emerald-200 transition-all">
                             <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:text-emerald-600 transition-colors shrink-0">
                               {idx + 1}
                             </div>
                             <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input 
                                  placeholder="Measurement Label (e.g. Hb)" 
                                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-tight placeholder:text-gray-300 w-full"
                                  value={field.label}
                                  onChange={e => handleUpdateField(idx, { label: e.target.value })}
                                />
                                <input 
                                  placeholder="Unit (e.g. g/dL)" 
                                  className="bg-transparent border-none outline-none text-[10px] font-bold text-emerald-600 placeholder:text-gray-300 w-full"
                                  value={field.unit}
                                  onChange={e => handleUpdateField(idx, { unit: e.target.value })}
                                />
                                <input 
                                  placeholder="Reference Range" 
                                  className="bg-transparent border-none outline-none text-[10px] font-medium text-gray-500 italic placeholder:text-gray-300 w-full"
                                  value={field.referenceRange}
                                  onChange={e => handleUpdateField(idx, { referenceRange: e.target.value })}
                                />
                             </div>
                             <button 
                               type="button"
                               onClick={() => handleRemoveField(idx)}
                               className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                             >
                               <Trash className="w-4 h-4" />
                             </button>
                          </div>
                        ))}
                        {protocolFields.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                             <div className="w-16 h-16 bg-gray-100 rounded-[2rem] flex items-center justify-center">
                                <MousePointer2 className="w-8 h-8 text-gray-400" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Parameters Defined</p>
                             <button type="button" onClick={handleAddField} className="text-[9px] font-black text-emerald-600 uppercase underline decoration-2 underline-offset-4">Inject Initial Field</button>
                          </div>
                        )}
                     </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsAssignModalOpen(false)}></div>
           <div className="relative bg-white rounded-[3rem] w-full max-w-md p-10 shadow-[0_32px_128px_rgba(30,41,59,0.2)] space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Personnel Mapping</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Laboratory Resource Allocation</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAssignScientist} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Scientist</label>
                    <select name="scientist_id" required className="input py-4 text-sm font-bold appearance-none">
                       <option value="">SELECT PERSONNEL...</option>
                       {scientists.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destination Diagnostic Unit</label>
                    <select name="unit_id" required className="input py-4 text-sm font-bold appearance-none">
                       <option value="">SELECT TARGET UNIT...</option>
                       {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                 </div>
                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                   <p className="text-[9px] text-amber-800 font-medium leading-relaxed">Assigning a scientist to a unit grants them full visibility and signing authority for investigation requests arriving at that unit.</p>
                 </div>
                 <button type="submit" className="w-full btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-amber-600 border-amber-700 shadow-xl shadow-amber-600/20">
                   Execute Personnel Assignment
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
