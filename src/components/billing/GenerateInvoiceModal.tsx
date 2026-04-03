'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Plus, Trash2, Loader2, Info, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { billingAPI, departmentsAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Service {
  name: string;
  description: string;
  amount: number;
  isDefault?: boolean;
}

interface Props {
  appointment: any;
  onClose: () => void;
  onGenerated: () => void;
}

export default function GenerateInvoiceModal({ appointment, onClose, onGenerated }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departmentServices, setDepartmentServices] = useState<any[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);

  useEffect(() => {
    fetchDoctorFee();
  }, []);

  const fetchDoctorFee = async () => {
    try {
      const res = await billingAPI.getDoctorFee(appointment._id) as any;
      const { doctorFee, doctorName, department } = res.data;
      const initialServices: Service[] = [];

      if (department && department.defaultConsultationFee > 0) {
        initialServices.push({
          name: `Consultation Fee (${department.name})`,
          description: `Department default consultation fee`,
          amount: department.defaultConsultationFee,
          isDefault: true
        });
      }

      if (doctorFee > 0) {
        initialServices.push({
          name: 'Specialist Consultation Fee',
          description: `Consultation with Dr. ${doctorName}`,
          amount: doctorFee
        });
      }

      setServices(initialServices);
      if (department && department.services) {
        setDepartmentServices(department.services);
      }
    } catch {
      toast.error('Failed to fetch doctor fee');
    } finally {
      setLoading(false);
    }
  };

  const addDepartmentService = (deptService: any) => {
    setServices([...services, {
      name: deptService.serviceName,
      description: deptService.description || '',
      amount: deptService.fee
    }]);
    setShowServicePicker(false);
  };

  const addCustomService = () => {
    setServices([...services, { name: '', description: '', amount: 0 }]);
    setShowServicePicker(false);
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

  const handleSubmit = async () => {
    if (services.length === 0) return toast.error('Add at least one service');
    if (services.some(s => !s.name.trim() || s.amount <= 0)) {
      return toast.error('Check all service names and amounts');
    }

    setSubmitting(true);
    try {
      await billingAPI.generateInvoice(appointment._id, {
        services,
        discount: Number(discount),
        roundOff: Number(roundOff)
      });
      toast.success('Invoice generated successfully');
      onGenerated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generate Invoice</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                {appointment.fullName} • #{appointment.appointmentId}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar overscroll-behavior-contain">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-100">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</p>
              <p className="text-sm font-bold text-gray-900">{appointment.department || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialist</p>
              <p className="text-sm font-bold text-gray-900">{appointment.doctorName ? `Dr. ${appointment.doctorName}` : 'Not Assigned'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Apt Date</p>
              <p className="text-sm font-bold text-gray-900">{new Date(appointment.appointmentDate).toLocaleDateString('en-NG')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Billable Items</h3>
              <button 
                onClick={() => setShowServicePicker(!showServicePicker)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service
              </button>
            </div>

            {showServicePicker && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {departmentServices.map((ds, idx) => (
                    <button
                      key={idx}
                      onClick={() => addDepartmentService(ds)}
                      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all text-left"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900">{ds.serviceName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Standard Fee</p>
                      </div>
                      <span className="text-xs font-black text-primary-600">₦{ds.fee}</span>
                    </button>
                  ))}
                  <button
                    onClick={addCustomService}
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary-400 hover:bg-white text-gray-400 hover:text-primary-600 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold">Custom Line Item</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border transition-all",
                  service.isDefault ? "bg-primary-50/30 border-primary-100" : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
                )}>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 transition-all focus-within:translate-x-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Item Description</label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={e => updateService(index, 'name', e.target.value)}
                          placeholder="e.g. Lab Tests, X-Ray"
                          className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Amount (₦)</label>
                        <input
                          type="number"
                          value={service.amount || ''}
                          onChange={e => updateService(index, 'amount', e.target.value)}
                          className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-black text-primary-600 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeService(index)}
                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-center mt-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
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
                <div className="relative">
                  <input
                    type="number"
                    value={roundOff || ''}
                    onChange={e => setRoundOff(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">+ / -</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-3xl p-8 text-white space-y-4 shadow-2xl shadow-gray-200">
              <div className="flex justify-between items-center text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">
                <span>Pre-tax Subtotal</span>
                <span>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">
                  <span>Applied Discount</span>
                  <span>- ₦{discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-4"></div>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Total Payable</span>
                  <p className="text-3xl font-black tracking-tight">₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <CheckCircle2 className="w-8 h-8 text-primary-500 opacity-50 ml-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
            Discard
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Finalize & Generate
          </button>
        </div>
      </div>
    </div>
  );
}
