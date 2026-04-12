'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Calendar, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Moon, 
  Sun, 
  Coffee,
  CalendarDays,
  Timer
} from 'lucide-react';
import { slotConfigAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function DoctorAvailabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab ] = useState<'regular' | 'overrides'>('regular');
  
  const [workingDays, setWorkingDays] = useState<any[]>([]);
  const [dateOverrides, setDateOverrides] = useState<any[]>([]);
  const [newOverride, setNewOverride] = useState({ date: '', label: '', isClosed: true });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res: any = await slotConfigAPI.getMyConfig();
      setWorkingDays(res.workingDays || []);
      setDateOverrides(res.dateOverrides || []);
    } catch (err) {
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await slotConfigAPI.updateConfig({
        workingDays,
        dateOverrides
      });
      toast.success('Availability Matrix Updated');
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (key: string, updates: any) => {
    setWorkingDays(prev => prev.map(d => d.day === key ? { ...d, ...updates } : d));
  };

  const addOverride = () => {
    if (!newOverride.date) return toast.error('Please select a date');
    setDateOverrides(prev => [...prev, { ...newOverride, id: Math.random().toString() }]);
    setNewOverride({ date: '', label: '', isClosed: true });
  };

  const removeOverride = (id: string) => {
    setDateOverrides(prev => prev.filter(o => o.id !== id));
  };

  if (loading) {
    return (
      <div className="p-10 animate-pulse space-y-8 text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto" />
        <div className="h-8 w-64 bg-slate-100 mx-auto rounded-full" />
        <div className="h-96 bg-slate-50 rounded-[3rem]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.5rem] bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-200">
               <CalendarDays className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Consultation Matrix</h1>
               <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Schedule Engine</p>
               </div>
             </div>
          </div>
        </div>

        <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
          <button 
            onClick={() => setActiveTab('regular')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'regular' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Weekly Grid
          </button>
          <button 
            onClick={() => setActiveTab('overrides')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'overrides' ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Date Overrides
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'regular' ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-40 group-hover:opacity-60 transition-opacity" />
              
              <div className="space-y-4">
                {workingDays.map((day) => (
                  <div 
                    key={day.day}
                    className={cn(
                      "p-6 rounded-[2rem] border transition-all duration-500 group/day flex flex-col md:flex-row md:items-center gap-6",
                      day.enabled 
                        ? "bg-white border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] hover:border-primary-100" 
                        : "bg-slate-50/50 border-transparent opacity-60 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-[140px]">
                      <button 
                        onClick={() => updateDay(day.day, { enabled: !day.enabled })}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          day.enabled ? "bg-primary-600" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          day.enabled ? "right-1" : "left-1"
                        )} />
                      </button>
                      <span className="font-black text-xs uppercase tracking-widest text-slate-800">
                        {day.day}
                      </span>
                    </div>

                    {day.enabled && (
                      <div className="flex flex-wrap items-center gap-4 md:flex-1">
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                           <Sun className="w-3 h-3 text-amber-500" />
                           <input 
                             type="time" 
                             value={day.startTime}
                             onChange={(e) => updateDay(day.day, { startTime: e.target.value })}
                             className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                           />
                           <ChevronRight className="w-3 h-3 text-slate-300" />
                           <input 
                             type="time" 
                             value={day.endTime}
                             onChange={(e) => updateDay(day.day, { endTime: e.target.value })}
                             className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                           />
                        </div>

                        <div className="flex items-center gap-3 bg-primary-50 px-4 py-2.5 rounded-2xl border border-primary-100/50">
                           <Coffee className="w-3 h-3 text-primary-600" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary-600/60">Break:</span>
                           <input 
                             type="time" 
                             value={day.breakStart}
                             onChange={(e) => updateDay(day.day, { breakStart: e.target.value })}
                             className="bg-transparent text-xs font-bold text-primary-700 outline-none"
                           />
                           <input 
                             type="time" 
                             value={day.breakEnd}
                             onChange={(e) => updateDay(day.day, { breakEnd: e.target.value })}
                             className="bg-transparent text-xs font-bold text-primary-700 outline-none"
                           />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8">
              <div className="flex items-center gap-2 mb-8">
                 <AlertCircle className="w-4 h-4 text-primary-600" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mark specific dates as unavailable for leave or emergencies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                 <div className="md:col-span-1">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Select Date</label>
                    <input 
                      type="date" 
                      value={newOverride.date}
                      onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors"
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Label (e.g. Annual Leave)</label>
                    <input 
                      type="text" 
                      placeholder="Enter reason..."
                      value={newOverride.label}
                      onChange={(e) => setNewOverride({ ...newOverride, label: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-primary-500 transition-colors"
                    />
                 </div>
                 <div className="md:col-span-1 pt-6">
                    <button 
                      onClick={addOverride}
                      className="w-full h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Block
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {dateOverrides.map((ov) => (
                   <div key={ov.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-primary-200 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                          <Moon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{ov.date}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{ov.label || 'Unavailable'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeOverride(ov.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
                 {dateOverrides.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-30 grayscale saturate-0 space-y-4">
                      <CalendarDays className="w-16 h-16 mx-auto text-slate-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No date overrides configured</p>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-[60px] -mr-16 -mt-16" />
              <div className="relative z-10">
                <Timer className="w-10 h-10 text-primary-400 mb-6" />
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">Operational Efficiency</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mb-8">
                  Your availability matrix directly impacts the Patient Booking Experience. Ensure your primary hours are consistent to maintain high throughput and patient satisfaction.
                </p>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Real-time Sync with Reception</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Automated Conflict Resolution</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Dynamic Slot Calculation</span>
                   </div>
                </div>
              </div>
           </div>

           <div className="card p-8 space-y-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Quick Guidelines
              </h3>
              <ul className="space-y-4">
                {[
                  'Ensure at least 30 minutes for break intervals.',
                  'Leaves should be booked 48h in advance.',
                  'Slot duration is managed by Clinical Administration.',
                  'System enforces a same-day booking cutoff.'
                ].map((note, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-primary-600 font-black text-[10px] italic">0{i+1}.</span>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
        <div className="bg-white/80 backdrop-blur-2xl border border-white p-3 rounded-full shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] flex items-center gap-4">
          <div className="px-6 flex flex-col justify-center border-r border-slate-100 pr-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Changes Status</span>
            <span className="text-[10px] font-black text-emerald-600 uppercase">Validated Engine</span>
          </div>
          <button 
            onClick={fetchConfig}
            className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors"
          >
            Reset View
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
}
