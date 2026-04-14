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

  const [isLab, setIsLab] = useState(false);

  useEffect(() => {
    fetchDoctorFee();
  }, []);

  const fetchDoctorFee = async () => {
    try {
      const res = await billingAPI.getDoctorFee(appointment._id) as any;
      const { doctorFee, doctorName, department, isLabStandalone, testInfo } = res.data;
      const initialServices: Service[] = [];
      
      if (isLabStandalone) setIsLab(true);

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

      if (isLabStandalone && testInfo) {
        initialServices.push({
          name: testInfo.name || 'Lab Test',
          description: 'Diagnostics Service',
          amount: testInfo.price || 0
        });
      }

      setServices(initialServices);
      if (department && department.services) {
        setDepartmentServices(department.services);
      }
    } catch {
      toast.error('Failed to fetch reference details');
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
    if (services.some(s => !s.name.trim() || s.amount < 0)) {
      return toast.error('Check all service names and amounts');
    }

    setSubmitting(true);
    try {
      if (isLab || appointment.department === 'Laboratory') {
        await billingAPI.generateForLab(appointment._id, {
          services,
          discount: Number(discount),
          roundOff: Number(roundOff)
        });
      } else {
        await billingAPI.generateInvoice(appointment._id, {
          services,
          discount: Number(discount),
          roundOff: Number(roundOff)
        });
      }
      toast.success('Invoice generated successfully');
      onGenerated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 shrink-0">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Generate Invoice</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">{appointment.fullName} • {appointment.appointmentId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0 ml-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 no-scrollbar custom-scrollbar overscroll-behavior-contain">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10 pb-10 border-b border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clinical Unit</p>
              <p className="text-sm font-black text-gray-900 leading-tight">{appointment.department || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultant</p>
              <p className="text-sm font-black text-gray-900 leading-tight">{appointment.doctorName ? `Dr. ${appointment.doctorName}` : 'General'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Date</p>
              <p className="text-sm font-black text-gray-900 leading-tight">{new Date(appointment.appointmentDate).toLocaleDateString('en-NG')}</p>
            </div>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Fiscal Line Items</h3>
              <button 
                onClick={() => setShowServicePicker(!showServicePicker)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
              >
                <Plus className="w-4 h-4" />
                Append Service
              </button>
            </div>

            {showServicePicker && (
              <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentServices.map((ds, idx) => (
                    <button
                      key={idx}
                      onClick={() => addDepartmentService(ds)}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[1.5rem] hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{ds.serviceName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional Fee</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 shrink-0 ml-4">₦{ds.fee.toLocaleString()}</span>
                    </button>
                  ))}
                  <button
                    onClick={addCustomService}
                    className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-[1.5rem] hover:border-indigo-400 hover:bg-white text-gray-400 hover:text-indigo-600 transition-all group"
                  >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Manual Provision</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className={cn(
                  "flex items-start gap-4 p-6 rounded-[2rem] border transition-all animate-in slide-in-from-right-4 duration-300",
                  service.isDefault ? "bg-indigo-50/30 border-indigo-100" : "bg-white border-gray-100 hover:border-indigo-200 shadow-sm"
                )}>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Investigation / Service</label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={e => updateService(index, 'name', e.target.value)}
                          placeholder="Name of service..."
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-inner"
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
                  </div>
                  <button 
                    onClick={() => removeService(index)}
                    className="p-2 sm:p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-center mt-6"
                    type="button"
                  >
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Protocol Discount (₦)</label>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm text-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adjustment (₦)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={roundOff || ''}
                    onChange={e => setRoundOff(Number(e.target.value) || 0)}
                    placeholder="+/- Rounding"
                    className="w-full bg-white border border-gray-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase shrink-0">Round</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-[2.5rem] p-8 sm:p-10 text-white space-y-6 shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150"></div>
              
              <div className="flex justify-between items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] relative z-10">
                <span>Gross Assessment</span>
                <span>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] relative z-10">
                  <span>Authorized Discount</span>
                  <span>- ₦{discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-4 relative z-10"></div>
              <div className="flex justify-between items-end relative z-10">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Net Payable</span>
                  <p className="text-3xl sm:text-4xl font-black tracking-tighter">₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="sm:block hidden">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <CheckCircle2 className="w-8 h-8 text-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-10 py-4 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors tracking-widest shrink-0">
            Discard Session
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-12 py-5 bg-gray-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50 group shrink-0"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Authorize & Execute
          </button>
        </div>
      </div>
    </div>
  );
}
