'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Edit2, Plus, Trash2, Loader2, Save, 
  AlertCircle 
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
        roundOff: Number(roundOff)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Invoice</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{bill?.billNumber} • {bill?.fullName || appointment?.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar overscroll-behavior-contain">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest pl-1">Line Items</h3>
              <button 
                onClick={addService}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-all">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Description</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={e => updateService(index, 'name', e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Amount (₦)</label>
                      <input
                        type="number"
                        value={service.amount || ''}
                        onChange={e => updateService(index, 'amount', e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeService(index)}
                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-center mt-5"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Discount (₦)</label>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Round Off (₦)</label>
                <input
                  type="number"
                  value={roundOff || ''}
                  onChange={e => setRoundOff(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-3xl p-8 text-white">
              <div className="flex justify-between items-center text-gray-400 font-bold text-xs uppercase tracking-widest mb-4">
                <span>Revised Subtotal</span>
                <span>₦{subtotal.toLocaleString('en-NG')}</span>
              </div>
              <div className="h-px bg-white/10 mb-4"></div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">New Payable Total</span>
                  <p className="text-3xl font-black">₦{total.toLocaleString('en-NG')}</p>
                </div>
                <div className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                  Auto-calculated
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
