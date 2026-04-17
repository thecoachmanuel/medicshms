'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Eye, Printer, Loader2, CheckCircle2, 
  AlertCircle, Phone, Mail, Building2, User 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { billingAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  billId: string;
  appointment: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ViewInvoiceModal({ billId, appointment, onClose, onUpdated }: Props) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  useEffect(() => {
    fetchBill();
    fetchTemplate();
  }, [billId]);

  const fetchTemplate = async () => {
    try {
      const { invoiceTemplateAPI } = await import('@/lib/api');
      const res = await invoiceTemplateAPI.get() as any;
      if (res.success) setTemplate(res.data);
    } catch (e) {
      console.error('Failed to load template', e);
    }
  };

  const fetchBill = async () => {
    try {
      const res = await billingAPI.getById(billId) as any;
      setBill(res.data);
      setPaymentMethod(res.data.paymentMethod || '');
      setPaymentReference(res.data.paymentReference || '');
      setPaidAmount(res.data.paidAmount || 0);
      setPaymentStatus(res.data.paymentStatus || '');
      // Select all by default
      if (res.data.services) {
        setSelectedServices(res.data.services.map((_: any, i: number) => i));
      }
    } catch {
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!paymentMethod) return toast.error('Select payment method');
    setSaving(true);
    try {
      await billingAPI.update(billId, { 
        paidAmount, 
        paymentMethod,
        paymentReference,
        paymentStatus 
      });
      toast.success('Payment updated');
      fetchBill();
      onUpdated();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    
    const selectedTotal = bill.services
      .filter((_: any, i: number) => selectedServices.includes(i))
      .reduce((sum: number, s: any) => sum + Number(s.amount), 0);

    const balance = Number(bill.totalAmount) - Number(bill.paidAmount);
    const statusColor = bill.paymentStatus === 'Paid' ? '#059669' : bill.paymentStatus === 'Partial' ? '#d97706' : '#dc2626';

    win.document.write(`
      <html>
        <head>
          <title>Invoice ${bill?.billNumber}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 4px solid #111827; padding-bottom: 30px; margin-bottom: 40px; }
            .title { font-size: 48px; font-weight: 900; tracking: -0.05em; color: #111827; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 99px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 10px; background: ${statusColor}; color: white; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #9ca3af; margin-bottom: 15px; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #111827; font-size: 12px; text-transform: uppercase; font-weight: 900; color: #111827; }
            td { padding: 16px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .totals-container { margin-top: 40px; width: 320px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .total-row.grand { margin-top: 15px; padding-top: 15px; border-top: 2px solid #111827; font-size: 20px; font-weight: 900; color: #111827; }
            .payment-summary { margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6; }
            .payment-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
            .balance-due { color: ${balance > 0 ? '#dc2626' : '#059669'}; font-size: 16px; border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 8px; }
            .footer { margin-top: 100px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 30px; }
            .footer p { font-size: 12px; color: #9ca3af; font-weight: 500; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 150px; font-weight: 900; color: rgba(0,0,0,0.03); z-index: -1; pointer-events: none; white-space: nowrap; }
            @media print { body { padding: 0; } .no-print { display: none; } .watermark { color: rgba(0,0,0,0.05); } }
          </style>
        </head>
        <body>
          <div class="watermark">${bill.paymentStatus.toUpperCase()}</div>
          <div class="header">
            <div style="display: flex; align-items: center; gap: 20px;">
              ${template?.hospitalLogoUrl ? `<img src="${template.hospitalLogoUrl}" style="height: 80px; object-fit: contain;" />` : ''}
              <div>
                <div class="title">INVOICE</div>
                <div class="status-badge">${bill.paymentStatus}</div>
              </div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 24px; font-weight: 900;">${template?.hospital_name || ''}</div>
              <div style="font-size: 12px; color: #6b7280;">${template?.hospital_address || ''}</div>
              <div style="font-size: 12px; color: #6b7280;">${template?.contact_number || ''} ${template?.email_address ? `| ${template.email_address}` : ''}</div>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="section-title">Patient Details</div>
              <div style="font-weight: 800; font-size: 18px;">${bill.fullName}</div>
              <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">ID: ${bill.patientId}</div>
              <div style="font-size: 13px; color: #4b5563;">${bill.gender} | ${bill.age} Years</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 8px; font-weight: 600;">
                <span style="display: block;">📞 ${bill.phone}</span>
                <span style="display: block;">✉️ ${bill.email}</span>
                <span style="display: block;">🏠 ${bill.address}</span>
              </div>
            </div>
            <div style="text-align: right">
              <div class="section-title">Invoice Details</div>
              <div style="font-weight: 800; font-size: 16px;">#${bill.billNumber}</div>
              <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">Date: ${new Date(bill.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</div>
              <div style="font-size: 13px; color: #4b5563;">Ref ID: #${bill.appointmentId}</div>
              ${bill.paymentReference ? `<div style="font-size: 11px; color: #6b7280; font-weight: 800; margin-top: 5px;">REF: ${bill.paymentReference}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Service Description</th>
                <th style="text-align: right">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${bill.services?.filter((_: any, i: number) => selectedServices.includes(i)).map((s: any) => `
                <tr>
                  <td>
                    <div style="font-weight: 700;">${s.name}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${s.description || 'Standard Medical Service'}</div>
                  </td>
                  <td style="text-align: right; font-weight: 800;">₦${Number(s.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="total-row">
              <span style="color: #6b7280; font-weight: 600;">Subtotal</span>
              <span style="font-weight: 700;">₦${selectedTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            ${bill.discount > 0 && selectedServices.length === bill.services.length ? `
              <div class="total-row" style="color: #059669;">
                <span style="font-weight: 600;">Discount</span>
                <span style="font-weight: 700;">- ₦${Number(bill.discount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="total-row grand">
              <span>Total Amount</span>
              <span>₦${(selectedTotal - (selectedServices.length === bill.services.length ? bill.discount : 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="payment-summary">
              <div class="payment-row">
                <span style="color: #6b7280;">Status</span>
                <span style="color: ${statusColor}; font-weight: 900;">${bill.paymentStatus}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${template?.hospital_name || 'Hospital HMS'}. All Rights Reserved.</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
      <Loader2 className="w-10 h-10 text-white animate-spin" />
    </div>
  );

  if (!bill) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-4xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 shrink-0">
              <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Invoice {bill.billNumber}</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">{bill.fullName} • PID: {bill.patientId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={handlePrint} className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
              <Printer className="w-4 h-4" />
              Hardcopy
            </button>
            <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0">
              <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar custom-scrollbar overscroll-behavior-contain bg-slate-50/30">
          <div className="p-5 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-500" ref={printRef}>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-12 sm:mb-16 gap-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center gap-6 sm:gap-8 relative z-10">
                {template?.hospitalLogoUrl ? (
                   <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-[2rem] flex items-center justify-center overflow-hidden border border-gray-100 p-3 shrink-0 shadow-xl shadow-gray-100">
                      <img src={template.hospitalLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                   </div>
                ) : (
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-200" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-2 truncate">INVOICE</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{bill.billNumber}</span>
                    <span className={cn(
                      "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                      bill.paymentStatus === 'Paid' ? "bg-emerald-100 text-emerald-600" : 
                      bill.paymentStatus === 'Partial' ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                    )}>{bill.paymentStatus}</span>
                  </div>
                </div>
              </div>
              <div className="sm:text-right w-full sm:w-auto mt-4 sm:mt-0 relative z-10">
                <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{template?.hospital_name}</p>
                <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">{template?.hospital_address}</p>
                <p className="text-[10px] sm:text-xs text-indigo-500 font-black tracking-widest mt-2">{template?.email_address} | {template?.contact_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16 mb-12 sm:mb-16">
              <div className="space-y-5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Identified Subject</h3>
                <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><User className="w-12 h-12" /></div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-xl font-black text-gray-900 leading-none">{bill.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PID: {bill.patientId}</p>
                    <p className="text-xs text-gray-600 font-bold mt-3 bg-gray-50 inline-block px-3 py-1 rounded-lg">{bill.gender} • {bill.age} Years</p>
                    <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-gray-50">
                      <p className="text-[10px] font-medium text-gray-500 flex items-center gap-2 truncate"><Phone className="w-3 h-3" /> {bill.phone || 'N/A'}</p>
                      <p className="text-[10px] font-medium text-gray-500 flex items-center gap-2 truncate"><Mail className="w-3 h-3" /> {bill.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-5 sm:text-right">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pr-1">Instrument Metadata</h3>
                <div className="space-y-3">
                  <div className="inline-block px-5 py-2 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">REF: #{bill.appointmentId}</div>
                  <div className="space-y-1 mt-4">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Issue Date</p>
                    <p className="text-sm font-black text-gray-900">{new Date(bill.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Originating Unit</p>
                    <p className="text-sm font-black text-gray-900">{bill.department}</p>
                  </div>
                  {bill.paymentReference && (
                    <div className="inline-block mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      Network REF: {bill.paymentReference}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] shadow-sm mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 shrink-0 hidden sm:table-cell w-16">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={selectedServices.length === bill?.services?.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices(bill.services.map((_: any, i: number) => i));
                            } else {
                              setSelectedServices([]);
                            }
                          }}
                          className="w-5 h-5 rounded-lg border-gray-200 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                        />
                      </div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Description</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bill?.services?.map((s: any, i: number) => (
                    <tr key={i} className={cn(
                      "group transition-all duration-300",
                      selectedServices.includes(i) ? "bg-indigo-50/20" : "hover:bg-gray-50/30"
                    )}>
                      <td className="px-8 py-6 hidden sm:table-cell">
                        <div className="flex items-center justify-center">
                          <input 
                            type="checkbox"
                            checked={selectedServices.includes(i)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, i]);
                              } else {
                                setSelectedServices(selectedServices.filter(id => id !== i));
                              }
                            }}
                            className="w-5 h-5 rounded-lg border-gray-200 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 min-w-[200px]">
                        <div className="flex items-start gap-4 sm:hidden mb-2">
                           <input 
                            type="checkbox"
                            checked={selectedServices.includes(i)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, i]);
                              } else {
                                setSelectedServices(selectedServices.filter(id => id !== i));
                              }
                            }}
                            className="w-5 h-5 rounded-lg border-gray-200 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                          />
                          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">Select Item</p>
                        </div>
                        <p className="text-sm font-black text-gray-900 group-hover:translate-x-1 transition-transform">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{s.description || 'Institutional Medical Service'}</p>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-sm tabular-nums text-gray-900">
                        ₦ {Number(s.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-12 sm:gap-16">
              <div className="flex-1 w-full max-w-sm hidden sm:block">
                 <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100 border-dashed">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Fiscal Policy Note</p>
                    <p className="text-[11px] text-indigo-900/60 leading-relaxed font-medium">
                      This instrument acts as an official request for payment for medical services rendered. Prices are inclusive of all statutory levies and hospital overheads.
                    </p>
                 </div>
              </div>
              <div className="w-full sm:w-96 space-y-5">
                <div className="flex justify-between items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] px-4">
                  <span>Gross Subtotal</span>
                  <span className="tabular-nums">₦{bill.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] px-4">
                    <span>Authorized Discount</span>
                    <span className="tabular-nums">- ₦{bill.discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="flex justify-between items-end relative z-10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Net Assessment</span>
                      <p className="text-3xl font-black tracking-tighter tabular-nums">₦{bill.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                      <CheckCircle2 className={cn("w-6 h-6", bill.paymentStatus === 'Paid' ? "text-emerald-500" : "text-indigo-500 opacity-20")} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 sm:mt-24 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7 text-gray-200" />
                 </div>
                 <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Officer Signature</p>
                  <div className="h-0.5 w-48 bg-gray-100"></div>
                  <p className="text-[10px] font-black text-gray-400 tracking-widest mt-2 uppercase italic">Electronic Validation</p>
                </div>
              </div>
              <button onClick={handlePrint} className="w-full sm:hidden flex items-center justify-center gap-4 bg-gray-900 text-white py-5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98]">
                 <Printer className="w-5 h-5" /> Execute Print Order
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-10 bg-indigo-50/50 border-t border-indigo-100 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
               <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0"><FileText className="w-4 h-4" /></span>
               Payment Reconciliation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Cash', 'Transfer', 'Card', 'POS'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-[10px] font-black border transition-all uppercase tracking-widest",
                        paymentMethod === m ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-gray-400 border-gray-100 hover:border-indigo-200"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction REF</label>
                <input 
                  type="text" 
                  placeholder="ID / Receipt No..."
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  className="w-full h-12 bg-white border border-gray-100 rounded-xl px-5 py-2 text-xs font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm shadow-indigo-50/30"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assessment Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Pending', 'Partial', 'Paid', 'Cancelled'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setPaymentStatus(s)}
                      className={cn(
                        "py-3 px-1 rounded-xl text-[9px] font-black border transition-all uppercase tracking-tighter truncate",
                        paymentStatus === s ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-white text-gray-400 border-gray-100 hover:border-emerald-200"
                      )}
                    >
                      {s === 'Pending' ? 'Active' : s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Received (₦)</label>
                <div className="flex flex-col gap-4">
                  <input 
                    type="number" 
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full h-12 bg-white border border-gray-100 rounded-xl px-5 py-2 text-sm font-black text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm shadow-emerald-50/30"
                  />
                  <button 
                    onClick={handleUpdatePayment}
                    disabled={saving}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Remittance'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
