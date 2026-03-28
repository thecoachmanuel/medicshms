'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, Save, RotateCcw, Plus, Trash2, 
  Clock, Calendar, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { slotConfigAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SlotSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaults, setDefaults] = useState({
    slotDuration: 15,
    startTime: '09:00',
    endTime: '17:00',
    bufferTime: 5,
    maxDailyAppointments: 30
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await slotConfigAPI.getDefaults();
      if (res.data) setDefaults(res.data);
    } catch {
      toast.error('Failed to fetch slot settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await slotConfigAPI.updateDefaults(defaults);
      toast.success('Slot settings updated successfully');
    } catch {
      toast.error('Failed to update slot settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Slot & Timing Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure global appointment slot durations and daily operation timings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Duration Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Slot Duration (Minutes)</label>
              <select 
                value={defaults.slotDuration} 
                onChange={e => setDefaults({...defaults, slotDuration: parseInt(e.target.value)})}
                className="input py-3"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Buffer Time (Minutes)</label>
              <input 
                type="number" 
                value={defaults.bufferTime || ''} 
                onChange={e => setDefaults({...defaults, bufferTime: parseInt(e.target.value) || 0})}
                className="input py-3"
              />
            </div>
          </div>
        </div>

        <div className="card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Operation Timing</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Opening Time</label>
              <input 
                type="time" 
                value={defaults.startTime} 
                onChange={e => setDefaults({...defaults, startTime: e.target.value})}
                className="input py-3"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Closing Time</label>
              <input 
                type="time" 
                value={defaults.endTime} 
                onChange={e => setDefaults({...defaults, endTime: e.target.value})}
                className="input py-3"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Max Daily Appointments</label>
            <input 
              type="number" 
              value={defaults.maxDailyAppointments || ''} 
              onChange={e => setDefaults({...defaults, maxDailyAppointments: parseInt(e.target.value) || 0})}
              className="input py-3"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
        <div className="flex-1 flex items-center gap-2 text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Changes reflect immediately across the booking engine</p>
        </div>
        <button onClick={fetchSettings} className="btn-secondary">Discard Changes</button>
        <button onClick={handleSave} disabled={isSubmitting} className="btn-primary min-w-[140px]">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
