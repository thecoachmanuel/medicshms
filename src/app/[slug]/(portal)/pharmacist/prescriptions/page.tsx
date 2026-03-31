'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pharmacyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Pill, Search, CheckCircle, Clock } from 'lucide-react';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Dispensed'>('Pending');
  
  // Action state
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isDispensing, setIsDispensing] = useState(false);

  useEffect(() => {
    fetchPrescriptions(activeTab);
  }, [activeTab]);

  const fetchPrescriptions = async (status: string) => {
    setLoading(true);
    try {
      const response: any = await pharmacyAPI.getPrescriptions({ status });
      setPrescriptions(response.data || []);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;
    setIsDispensing(true);
    try {
      // In a full implementation, we'd map the requested medications to specific inventory IDs here.
      // For this MVP, we proceed with acknowledging the dispensing action.
      await pharmacyAPI.updatePrescription({
        prescription_id: selectedPrescription.id,
        status: 'Dispensed',
        inventory_deductions: [] // Place for deduction logic 
      });
      toast.success('Prescription marked as dispensed');
      setSelectedPrescription(null);
      fetchPrescriptions(activeTab);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to dispense');
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary-500" /> Electronic Prescriptions
          </h1>
          <p className="text-gray-500 mt-1">Review and fulfill doctor orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('Pending')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest ${activeTab === 'Pending' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Clock className="w-4 h-4" /> Pending fulfillment
          </button>
          <button 
            onClick={() => setActiveTab('Dispensed')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest ${activeTab === 'Dispensed' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CheckCircle className="w-4 h-4" /> Dispensed Orders
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400 animate-pulse">Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No {activeTab.toLowerCase()} prescriptions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {prescriptions.map(req => (
                <div key={req.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col">
                  <div className={`p-4 border-b ${activeTab === 'Pending' ? 'bg-primary-50 border-primary-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 truncate pr-4">{req.patient?.full_name}</h3>
                      <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{new Date(req.prescribed_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ID: {req.patient?.patient_id}</p>
                    <p className="text-xs text-primary-700 mt-2 font-medium">Dr. {req.doctor_profile?.name || 'Unknown'}</p>
                  </div>
                  
                  <div className="p-4 flex-1">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Medications</h4>
                    <ul className="space-y-3">
                      {(req.medications || []).map((med: any, idx: number) => (
                        <li key={idx} className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="font-bold text-gray-800">{med.item_name}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            {med.dosage} • {med.frequency} • {med.duration}
                          </div>
                          {med.quantity && <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 inline-block rounded">Dispense Qty: {med.quantity}</div>}
                        </li>
                      ))}
                    </ul>
                    {req.notes && (
                      <div className="mt-4 pt-3 border-t border-gray-100 text-sm italic text-gray-600">
                        "{req.notes}"
                      </div>
                    )}
                  </div>

                  {activeTab === 'Pending' ? (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <button 
                        onClick={() => setSelectedPrescription(req)}
                        className="w-full py-3 rounded-xl btn-primary shadow-primary-600/20 shadow-lg font-bold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" /> Fulfill Prescription
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500 font-medium">
                      Dispensed by {req.pharmacist_profile?.name || 'Pharmacist'} on {new Date(req.dispensed_at || req.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4">Confirm Fulfillment</h2>
            <p className="text-gray-600 mb-6">
              You are about to mark the prescription for <strong className="text-gray-900">{selectedPrescription.patient?.full_name}</strong> as dispensed. 
              Please ensure you have physically handed over all prescribed medications.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPrescription(null)}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isDispensing}
              >
                Cancel
              </button>
              <button 
                onClick={handleDispense}
                disabled={isDispensing}
                className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-lg flex items-center gap-2"
              >
                {isDispensing ? 'Processing...' : 'Confirm Dispensed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
