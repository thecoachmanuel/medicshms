'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { vitalsAPI, patientsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Activity, Search, Save, User, Clock, ChevronRight, Scale, Thermometer, Wind, Droplets, HeartPulse } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function NurseVitalsPage() {
  const { user } = useAuth();
  const params = useParams();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response: any = await patientsAPI.getAll({ limit: 100 });
      setPatients(response.data || []);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalsHistory = async (patientId: string) => {
    try {
      const response: any = await vitalsAPI.getPatientVitals(patientId);
      setVitalsHistory(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPatientId(pId);
    if (pId) {
      fetchVitalsHistory(pId);
    } else {
      setVitalsHistory([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }

    // Auto calculate BMI
    let calculatedBmi = '';
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100; // cm to m
      if (h > 0) {
        calculatedBmi = (w / (h * h)).toFixed(2);
      }
    }

    try {
      setSaving(true);
      await vitalsAPI.recordVitals({
        patient_id: selectedPatientId,
        ...formData,
        bmi: calculatedBmi
      });
      toast.success('Vitals recorded successfully');
      // Reset form
      setFormData({
        blood_pressure: '', heart_rate: '', temperature: '',
        respiratory_rate: '', oxygen_saturation: '', weight: '', height: '', notes: ''
      });
      // Refresh history
      fetchVitalsHistory(selectedPatientId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record vitals');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading patient data...</div>;

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/30 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 shadow-sm shadow-emerald-100/20">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            Clinical Vitals
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Precision monitoring and physiological data logging.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8">
            <div className="mb-10">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-500" /> Patient Identification
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                <select
                  className="w-full pl-12 pr-10 py-4 bg-white/60 border border-white/80 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:bg-white outline-none appearance-none transition-all font-bold text-gray-900 shadow-sm"
                  value={selectedPatientId}
                  onChange={handlePatientSelect}
                >
                  <option value="">Search & Select Active Patient...</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.fullName} • {p.patientId}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-5 h-5 text-gray-300 rotate-90" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="group space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Blood Pressure (mmHg)</label>
                  <div className="relative">
                    <HeartPulse className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="text" name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} placeholder="120/80" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                  </div>
                </div>
                <div className="group space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Heart Rate (bpm)</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} placeholder="72" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                  </div>
                </div>
                <div className="group space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Temperature (°C)</label>
                  <div className="relative">
                    <Thermometer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} placeholder="37.0" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                  </div>
                </div>
                <div className="group space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Respiratory Rate (bpm)</label>
                  <div className="relative">
                    <Wind className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="number" name="respiratory_rate" value={formData.respiratory_rate} onChange={handleChange} placeholder="16" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                  </div>
                </div>
                <div className="group space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Oxygen Saturation (SpO2 %)</label>
                  <div className="relative">
                    <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="number" name="oxygen_saturation" value={formData.oxygen_saturation} onChange={handleChange} placeholder="98" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Weight (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                      <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} placeholder="70" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                    </div>
                  </div>
                  <div className="group space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Height (cm)</label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                      <input type="number" step="0.1" name="height" value={formData.height} onChange={handleChange} placeholder="175" className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">Nursing Assessment & Clinical Observations</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  rows={4} 
                  placeholder="Record detailed patient observations, appearance, and immediate physical concerns..." 
                  className="w-full px-6 py-4 bg-white/50 border border-white/80 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-gray-800 shadow-sm"
                ></textarea>
              </div>

              <div className="flex justify-end pt-8 border-t border-gray-100/50">
                <button 
                  type="submit" 
                  disabled={saving || !selectedPatientId} 
                  className="btn-primary py-4 px-10 rounded-[1.25rem] flex items-center gap-3 disabled:opacity-30 disabled:shadow-none shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {saving ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span className="tracking-widest uppercase font-black text-xs">{saving ? 'Syncing...' : 'Authenticate & Commit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="space-y-6">
          <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 h-full flex flex-col">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Longitudinal Timeline
            </h2>
            
            {!selectedPatientId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200/50">
                <div className="w-20 h-20 rounded-[2.5rem] bg-white flex items-center justify-center border border-gray-100 shadow-sm mb-6">
                  <User className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Awaiting Identity Select</p>
              </div>
            ) : vitalsHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200/50">
                <Activity className="w-12 h-12 text-gray-200 mb-4 animate-pulse" />
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Zero Historical Metrics</p>
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                {vitalsHistory.map((vital, idx) => (
                  <div key={vital._id || idx} className="relative pl-8 border-l border-emerald-100/50 pb-8 last:pb-0 group">
                    <div className="absolute -left-[4.5px] top-0 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-sm"></div>
                    <div className="bg-white/60 p-5 rounded-2xl border border-white/80 hover:border-emerald-200 transition-all hover:bg-white hover:shadow-lg hover:shadow-emerald-100/20 group/card">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                          {new Date(vital.recorded_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(vital.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {vital.blood_pressure && (
                          <div className="bg-emerald-50/30 p-2 rounded-xl flex items-center gap-2 border border-emerald-100/20">
                            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-900">{vital.blood_pressure}</span>
                          </div>
                        )}
                        {vital.heart_rate && (
                          <div className="bg-emerald-50/30 p-2 rounded-xl flex items-center gap-2 border border-emerald-100/20">
                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-900">{vital.heart_rate}<span className="text-[9px] font-bold ml-1 opacity-50">bpm</span></span>
                          </div>
                        )}
                        {vital.temperature && (
                          <div className="bg-amber-50/30 p-2 rounded-xl flex items-center gap-2 border border-amber-100/20">
                            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-black text-amber-900">{vital.temperature}°C</span>
                          </div>
                        )}
                        {vital.oxygen_saturation && (
                          <div className="bg-blue-50/30 p-2 rounded-xl flex items-center gap-2 border border-blue-100/20">
                            <Droplets className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-black text-blue-900">{vital.oxygen_saturation}%</span>
                          </div>
                        )}
                      </div>
                      
                      {vital.bmi && (
                        <div className="mt-4 pt-4 border-t border-gray-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" /> Body Mass Index
                          </span>
                          <span className="text-sm font-black text-gray-900 tracking-tight bg-gray-100 px-3 py-1 rounded-lg border border-gray-200/30">{vital.bmi}</span>
                        </div>
                      )}
                      
                      {vital.notes && (
                        <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 italic text-[11px] text-gray-500 leading-relaxed font-medium">
                          "{vital.notes}"
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-gray-100/50 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                          {vital.recorded_by_profile?.name?.[0] || 'N'}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{vital.recorded_by_profile?.name || 'Staff Nurse'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
