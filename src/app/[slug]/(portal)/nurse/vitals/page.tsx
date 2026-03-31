'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { vitalsAPI, patientsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Activity, Search, Save } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" /> Vitals Recording
          </h1>
          <p className="text-gray-500 mt-1">Record and track patient vital signs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 appearance-none"
                value={selectedPatientId}
                onChange={handlePatientSelect}
              >
                <option value="">-- Choose a patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} ({p.patientId})</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                <input type="text" name="blood_pressure" value={formData.blood_pressure} onChange={handleChange} placeholder="e.g. 120/80" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleChange} placeholder="e.g. 72" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} placeholder="e.g. 37.2" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate (bpm)</label>
                <input type="number" name="respiratory_rate" value={formData.respiratory_rate} onChange={handleChange} placeholder="e.g. 16" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SpO2 (%)</label>
                <input type="number" name="oxygen_saturation" value={formData.oxygen_saturation} onChange={handleChange} placeholder="e.g. 98" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} placeholder="70" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input type="number" step="0.1" name="height" value={formData.height} onChange={handleChange} placeholder="175" className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Any observations..." className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500"></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={saving || !selectedPatientId} 
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 py-3 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Record Vitals'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Patient History</h2>
          {!selectedPatientId ? (
            <div className="text-center text-gray-400 py-10">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select a patient to view history</p>
            </div>
          ) : vitalsHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p>No vitals recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {vitalsHistory.map((vital, idx) => (
                <div key={vital.id || idx} className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-900">{new Date(vital.recorded_at).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-500">{new Date(vital.recorded_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-700">
                    {vital.blood_pressure && <div><span className="text-gray-500">BP:</span> {vital.blood_pressure}</div>}
                    {vital.heart_rate && <div><span className="text-gray-500">HR:</span> {vital.heart_rate} bpm</div>}
                    {vital.temperature && <div><span className="text-gray-500">Temp:</span> {vital.temperature}°C</div>}
                    {vital.oxygen_saturation && <div><span className="text-gray-500">SpO2:</span> {vital.oxygen_saturation}%</div>}
                    {vital.weight && <div><span className="text-gray-500">Wt/Ht:</span> {vital.weight}kg / {vital.height}cm</div>}
                    {vital.bmi && <div><span className="text-gray-500">BMI:</span> <span className="font-semibold">{vital.bmi}</span></div>}
                  </div>
                  {vital.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                      <span className="text-xs font-semibold text-gray-400 block mb-1">Notes:</span>
                      {vital.notes}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
                    Recorded by: {vital.recorded_by_profile?.name || 'Unknown'} ({vital.recorded_by_profile?.role || 'Nurse'})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
