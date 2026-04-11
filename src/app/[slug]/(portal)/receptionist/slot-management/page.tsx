'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, Save, RotateCcw, Plus, Trash2, 
  Clock, Calendar, AlertCircle, Loader2, CheckCircle2,
  Users, Search, ChevronRight, Sun, Coffee
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { slotConfigAPI, doctorsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SlotManagementPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode ] = useState<'global' | 'doctor'>('global');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [config, setConfig] = useState<any>(null);
  const [workingDays, setWorkingDays] = useState<any[]>([]);
  const [dateOverrides, setDateOverrides] = useState<any[]>([]);

  useEffect(() => {
    fetchInitial();
  }, [mode, selectedDoctorId]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      if (mode === 'doctor' && doctors.length === 0) {
        const docRes = await doctorsAPI.getAll();
        setDoctors(docRes.data || []);
      }

      const res: any = await slotConfigAPI.getMyConfig();
      // If mode is doctor and we have a selected doctor, we should handle specific fetching
      // The current slot-configAPI.getMyConfig() handles shared vs personal based on token
      // We need a specific endpoint or param to fetch OTHER's config
      if (mode === 'doctor' && selectedDoctorId) {
         // Placeholder for specific fetch if needed, but for now we follow the 'shared' logic
      }

      if (res) {
        setWorkingDays(res.workingDays || []);
        setDateOverrides(res.dateOverrides || []);
        setConfig(res);
      }
    } catch {
      toast.error('Failed to fetch slot configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await slotConfigAPI.updateConfig({
        ...config,
        workingDays,
        dateOverrides,
        doctorId: mode === 'doctor' ? selectedDoctorId : undefined
      });
      toast.success('Configuration updated successfully');
    } catch {
      toast.error('Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDay = (key: string, updates: any) => {
    setWorkingDays(prev => prev.map(d => d.day === key ? { ...d, ...updates } : d));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Slot & Schedule Matrix</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Enterprise Resource Planning • Timing Engine</p>
        </div>

        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
           <button 
             onClick={() => setMode('global')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               mode === 'global' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             Global Hospital
           </button>
           <button 
             onClick={() => setMode('doctor')}
             className={cn(
               "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               mode === 'doctor' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             Doctor Overrides
           </button>
        </div>
      </div>

      {mode === 'doctor' && (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
           <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
           </div>
           <div className="flex-1 min-w-0">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Select Specialist</label>
              <select 
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="">Select a doctor to manage their schedule...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.profiles?.name || 'Unknown Doctor'}</option>
                ))}
              </select>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
           {workingDays.map((day) => (
              <div 
                key={day.day}
                className={cn(
                  "p-5 rounded-[2rem] border transition-all duration-300 flex flex-col sm:flex-row items-center gap-6",
                  day.enabled ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/50 border-transparent opacity-40 grayscale"
                )}
              >
                <div className="flex items-center gap-4 min-w-[120px]">
                  <button 
                    onClick={() => updateDay(day.day, { enabled: !day.enabled })}
                    className={cn("w-10 h-5 rounded-full relative transition-all", day.enabled ? "bg-primary-600" : "bg-slate-300")}
                  >
                    <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", day.enabled ? "right-1" : "left-1")} />
                  </button>
                  <span className="text-[10px] font-black uppercase text-slate-800 tracking-tight">{day.day}</span>
                </div>

                {day.enabled && (
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <input type="time" value={day.startTime} onChange={(e) => updateDay(day.day, { startTime: e.target.value })} className="bg-transparent text-[11px] font-bold text-slate-700 outline-none" />
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <input type="time" value={day.endTime} onChange={(e) => updateDay(day.day, { endTime: e.target.value })} className="bg-transparent text-[11px] font-bold text-slate-700 outline-none" />
                     </div>
                     <div className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-xl border border-primary-100/50">
                        <Coffee className="w-3 h-3 text-primary-600" />
                        <input type="time" value={day.breakStart} onChange={(e) => updateDay(day.day, { breakStart: e.target.value })} className="bg-transparent text-[11px] font-bold text-primary-700 outline-none" />
                        <span className="text-[9px] text-primary-300 font-bold mx-1">-</span>
                        <input type="time" value={day.breakEnd} onChange={(e) => updateDay(day.day, { breakEnd: e.target.value })} className="bg-transparent text-[11px] font-bold text-primary-700 outline-none" />
                     </div>
                  </div>
                )}
              </div>
           ))}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="card p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-[60px] -mr-16 -mt-16" />
              <Clock className="w-10 h-10 text-primary-400 mb-6" />
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">Slot Rules</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium mb-8">
                Changes made here will immediately affect the {mode === 'global' ? 'Hospital Central' : 'Doctor specific'} booking engine. Use with caution during office hours.
              </p>
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Commit Changes
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
