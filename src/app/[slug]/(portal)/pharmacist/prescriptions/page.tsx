'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pharmacyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Pill, Search, CheckCircle, Clock, User, ChevronRight, X, AlertCircle, Calendar, Hash, Stethoscope, BriefcaseMedical } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PrescriptionsPage() {
  const { user } = useAuth();
  // State
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Dispensed'>('Pending');
  
  // Fulfillment Console State
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isDispensing, setIsDispensing] = useState(false);
  const [fulfillmentMapping, setFulfillmentMapping] = useState<Record<number, string>>({});

  // Intelligent Auto-Mapping
  useEffect(() => {
    if (selectedPrescription && inventory.length > 0) {
      const newMapping: Record<number, string> = {};
      selectedPrescription.medications.forEach((med: any, idx: number) => {
        const match = inventory.find(
          inv => inv.item_name.toLowerCase() === med.item_name.toLowerCase() && 
                 inv.quantity >= (med.quantity || 1)
        );
        if (match) {
          newMapping[idx] = match.id;
        }
      });
      setFulfillmentMapping(newMapping);
    }
  }, [selectedPrescription, inventory]);

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prescRes, invRes] = await Promise.all([
        pharmacyAPI.getPrescriptions({ status: activeTab }),
        pharmacyAPI.getInventory({ status: 'In Stock' })
      ]) as any;
      
      setPrescriptions(prescRes.data || []);
      setInventory(invRes.data || []);
    } catch (error) {
      toast.error('Failed to synchronize pharmaceutical data');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;
    
    // Validate mapping
    const deductions = selectedPrescription.medications.map((med: any, idx: number) => {
      const inventoryId = fulfillmentMapping[idx];
      if (!inventoryId) return null;
      return { id: inventoryId, quantity: med.quantity || 1 };
    }).filter(Boolean);

    if (deductions.length < selectedPrescription.medications.length) {
      toast.error('Clinical Mismatch: All prescribed items must be mapped to inventory');
      return;
    }

    setIsDispensing(true);
    try {
      await pharmacyAPI.updatePrescription({
        prescription_id: selectedPrescription.id,
        status: 'Dispensed',
        inventory_deductions: deductions
      });
      toast.success('Clinical Fulfillment Protocol Complete');
      setSelectedPrescription(null);
      setFulfillmentMapping({});
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Dispense synchronization failed');
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/50 shadow-sm shadow-amber-100/20">
              <Pill className="w-6 h-6 text-amber-600" />
            </div>
            Pharmacy Central
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Electronic drug verification and fulfillment center.</p>
        </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex p-2 gap-2 bg-gray-50/50 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('Pending')}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
              activeTab === 'Pending' 
                ? "bg-white text-amber-600 shadow-sm border border-amber-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Active Dispensary
          </button>
          <button 
            onClick={() => setActiveTab('Dispensed')}
            className={cn(
              "flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
              activeTab === 'Dispensed' 
                ? "bg-white text-emerald-600 shadow-sm border border-emerald-100/50" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            )}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Archive Orders
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {prescriptions.map(req => (
                <div key={req.id} className="group relative bg-white/60 border border-white/80 rounded-[2.5rem] overflow-hidden hover:bg-white hover:shadow-2xl hover:shadow-amber-100/30 transition-all duration-500 flex flex-col border border-gray-100/50">
                  <div className={cn(
                    "p-8 border-b transition-colors duration-500",
                    activeTab === 'Pending' ? "bg-amber-50/30 border-amber-100/20 group-hover:bg-amber-50/50" : "bg-emerald-50/30 border-emerald-100/20 group-hover:bg-emerald-50/50"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-white shadow-sm font-black text-amber-600 text-lg">
                        {req.patient?.full_name?.[0]}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{new Date(req.prescribed_at).toLocaleDateString()}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(req.prescribed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg tracking-tight group-hover:text-amber-700 transition-colors uppercase">{req.patient?.full_name || 'Anonymous Patient'}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="px-2 py-1 bg-white/80 rounded-lg border border-white shadow-sm text-[9px] font-black text-gray-400 uppercase tracking-tighter shrink-0">#{req.patient?.patient_id || 'ID-REDACTED'}</div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-tight truncate bg-white/80 px-3 py-1 rounded-lg border border-white shadow-sm">
                          <Stethoscope className="w-3 h-3 shrink-0" /> Dr. {req.doctor_profile?.name || 'Authorized Physician'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <BriefcaseMedical className="w-3.5 h-3.5 text-amber-500" /> Prescribed regimen
                      </h4>
                      <ul className="space-y-3">
                        {(req.medications || []).map((med: any, idx: number) => (
                          <li key={idx} className="group/med bg-white/40 border border-white rounded-2xl p-4 hover:border-amber-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start gap-4">
                              <div className="font-black text-gray-900 tracking-tight">{med.item_name}</div>
                              {med.quantity && <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter">Qty: {med.quantity}</div>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{med.dosage}</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{med.frequency}</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{med.duration}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {req.notes && (
                      <div className="relative p-5 bg-amber-50/20 rounded-2xl border border-amber-100/10 text-[11px] font-medium text-amber-700 leading-relaxed italic group-hover:bg-amber-50/50 transition-colors">
                        <span className="absolute -top-2 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-[0.1em] text-amber-400 border border-amber-50 rounded-md">Clinical Notes</span>
                        "{req.notes}"
                      </div>
                    )}
                  </div>
 
                  {activeTab === 'Pending' ? (
                    <div className="p-8 bg-gray-50/50 border-t border-gray-100/50 group-hover:bg-white transition-all">
                      <button 
                        onClick={() => setSelectedPrescription(req)}
                        className="w-full py-4 rounded-2xl bg-gray-900 text-white shadow-xl shadow-gray-200 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-600 active:scale-95 transition-all group-hover:shadow-amber-100/50"
                      >
                        <CheckCircle className="w-5 h-5 group-hover:animate-bounce" /> Authorize Fulfillment
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 bg-emerald-50/20 border-t border-emerald-100/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Dispensed Protocol</p>
                          <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-tighter truncate">By {req.pharmacist_profile?.name || 'Staff'} • {new Date(req.dispensed_at || req.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={() => !isDispensing && setSelectedPrescription(null)}></div>
          <div className="relative bg-white rounded-[3rem] max-w-2xl w-full p-10 shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                <BriefcaseMedical className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Fulfillment Console</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Clinical Order: #{selectedPrescription.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar mb-10">
              {selectedPrescription.medications.map((med: any, idx: number) => {
                const selectedInventoryId = fulfillmentMapping[idx];
                const selectedInvItem = inventory.find(i => i.id === selectedInventoryId);
                
                return (
                  <div key={idx} className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Prescribed Agent</p>
                        <h4 className="font-black text-gray-900 tracking-tight">{med.item_name}</h4>
                        <div className="flex gap-2 mt-2">
                           <span className="text-[9px] font-black bg-white px-2 py-1 rounded-md border border-gray-100 uppercase text-gray-500">{med.dosage}</span>
                           <span className="text-[9px] font-black bg-white px-2 py-1 rounded-md border border-gray-100 uppercase text-gray-500">{med.frequency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Target Qty</p>
                         <p className="text-xl font-black text-gray-900">{med.quantity || 1}</p>
                      </div>
                    </div>

                    <div className="relative group">
                      <select 
                        className={cn(
                          "w-full pl-6 pr-12 py-4 bg-white border rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-8 outline-none transition-all appearance-none cursor-pointer",
                          selectedInventoryId ? "border-emerald-200 text-emerald-700 bg-emerald-50/20 ring-emerald-500/5" : "border-gray-100 text-gray-400 focus:ring-gray-500/5"
                        )}
                        value={selectedInventoryId || ''}
                        onChange={(e) => setFulfillmentMapping(prev => ({ ...prev, [idx]: e.target.value }))}
                      >
                        <option value="">Map to Inventory Node...</option>
                        {inventory.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} (STOCK: {inv.quantity} {inv.unit || 'Units'}) - ₦{inv.unit_price}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none group-hover:translate-x-1 transition-transform" />
                    </div>

                    {selectedInvItem && (
                      <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.1em]">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          EXPIRY: {new Date(selectedInvItem.expiry_date).toLocaleDateString()}
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-lg border",
                          selectedInvItem.quantity < (med.quantity || 1) ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {selectedInvItem.quantity < (med.quantity || 1) ? 'Insufficient Stock Protocol' : 'Availability Verified'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setSelectedPrescription(null)}
                className="flex-1 py-4 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-all"
                disabled={isDispensing}
              >
                Abort
              </button>
              <button 
                onClick={handleDispense}
                disabled={isDispensing || Object.keys(fulfillmentMapping).length < selectedPrescription.medications.length}
                className="flex-[2] py-4 rounded-[1.25rem] font-black text-white bg-gray-900 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30 group"
              >
                {isDispensing ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 group-hover:animate-bounce" />}
                <span className="uppercase tracking-[0.2em] text-xs leading-none">{isDispensing ? 'Processing...' : 'Authorize Fulfillment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
