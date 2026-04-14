'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Loader2, Save, Edit2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { billingAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Service {
  name: string;
  description: string;
  amount: number;
}

interface Props {
  billId: string;
  appointment: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditInvoiceModal({ billId, appointment, onClose, onUpdated }: Props) {
  const [bill, setBill] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>('Pending');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBill();
  }, [billId]);

  const fetchBill = async () => {
    try {
      const res = await billingAPI.getById(billId) as any;
      const b = res.data;
      setBill(b);
      setServices(b.services || []);
      setDiscount(b.discount || 0);
      setRoundOff(b.roundOff || 0);
      setPaymentStatus(b.paymentStatus || 'Pending');
    } catch {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setServices([...services, { name: '', description: '', amount: 0 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updated = [...services];
    (updated[index] as any)[field] = field === 'amount' ? Number(value) : value;
    setServices(updated);
  };

  const subtotal = services.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const total = Math.max(0, subtotal - Number(discount) + Number(roundOff));

  const handleUpdate = async () => {
    if (services.length === 0) return toast.error('Add at least one service');
    if (services.some(s => !s.name.trim() || s.amount <= 0)) {
      return toast.error('Check all service names and amounts');
    }

    setSubmitting(true);
    try {
      await billingAPI.update(billId, {
        services,
        discount: Number(discount),
        roundOff: Number(roundOff),
        paymentStatus
      });
      toast.success('Invoice updated successfully');
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-100 shrink-0">
              <Edit2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Edit Invoice</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">{bill?.billNumber} • {bill?.fullName || appointment?.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0 ml-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 no-scrollbar custom-scrollbar overscroll-behavior-contain">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Fiscal Adjustments</h3>
              <button 
                onClick={addService}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                <Plus className="w-4 h-4" />
                Append Item
              </button>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start gap-4 p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-emerald-200 transition-all group animate-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Investigation / Service</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={e => updateService(index, 'name', e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valuation (₦)</label>
                      <input
                        type="number"
                        value={service.amount || ''}
                        onChange={e => updateService(index, 'amount', e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-5 py-3 text-sm font-black text-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeService(index)}
                    className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-center mt-2 sm:mt-6"
                    type="button"
                  >
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Protocol Discount (₦)</label>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm text-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adjustment (₦)</label>
                <input
                  type="number"
                  value={roundOff || ''}
                  onChange={e => setRoundOff(Number(e.target.value) || 0)}
                  placeholder="+/-"
                  className="w-full bg-white border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Protocol Execution Status</label>
                <div className="relative">
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-5 py-4 text-sm font-black text-emerald-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="Pending">Pending Validation</option>
                    <option value="Partial">Incomplete Remittance</option>
                    <option value="Paid">Verified Settlement</option>
                    <option value="Cancelled">Void Instrument</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Edit2 className="w-4 h-4" />
                  </div>
                </div>
                {paymentStatus === 'Paid' && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2">
                      <Save className="w-3 h-3" /> Automatic Reconciliation Mode
                    </p>
                    <p className="text-[11px] text-emerald-800 font-bold mt-1">
                      Full Settlement: System will automatically record ₦{total.toLocaleString()} as verified income.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl shadow-emerald-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150"></div>
              
              <div className="flex justify-between items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] relative z-10">
                <span>Revised Assessment</span>
                <span>₦{subtotal.toLocaleString('en-NG')}</span>
              </div>
              <div className="h-px bg-white/10 my-6 relative z-10"></div>
              <div className="flex justify-between items-end relative z-10">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Net Payable Total</span>
                  <p className="text-3xl sm:text-4xl font-black tracking-tighter">₦{total.toLocaleString('en-NG')}</p>
                </div>
                <div className="sm:block hidden">
                   <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <Save className="w-8 h-8 text-emerald-500 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-10 py-4 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors tracking-widest shrink-0">
            Discard Changes
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-12 py-5 bg-emerald-600 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 group shrink-0"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Persist Adjustments
          </button>
        </div>
      </div>
    </div>
  );
}
