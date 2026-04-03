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
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<any>(null);

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
      setPaidAmount(res.data.paidAmount || 0);
      setPaymentStatus(res.data.paymentStatus || '');
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
            @media print { body { padding: 20px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; align-items: center; gap: 20px;">
              ${template?.hospitalLogoUrl ? `<img src="${template.hospitalLogoUrl}" style="height: 80px; object-contain: contain;" />` : ''}
              <div>
                <div class="title">INVOICE</div>
                <div class="status-badge">${bill.paymentStatus}</div>
              </div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 24px; font-weight: 900;">${template?.hospital_name || 'Hospital HMS'}</div>
              <div style="font-size: 12px; color: #6b7280;">${template?.hospital_address || '123 Health Street, Clinic Tower'}</div>
              <div style="font-size: 12px; color: #6b7280;">${template?.contact_number || '+234 800 123 4567'} | ${template?.email_address || 'contact@hms.com'}</div>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="section-title">Patient Details</div>
              <div style="font-weight: 800; font-size: 18px;">${bill.fullName}</div>
              <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">ID: #${bill.patientId}</div>
              <div style="font-size: 13px; color: #4b5563;">${bill.gender} | ${bill.age} Years</div>
            </div>
            <div style="text-align: right">
              <div class="section-title">Invoice Details</div>
              <div style="font-weight: 800; font-size: 16px;">#${bill.billNumber}</div>
              <div style="font-size: 13px; color: #4b5563; margin-top: 4px;">Date: ${new Date(bill.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</div>
              <div style="font-size: 13px; color: #4b5563;">Appt ID: #${bill.appointmentId}</div>
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
              ${bill.services?.map((s: any) => `
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
              <span style="font-weight: 700;">₦${Number(bill.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            ${bill.discount > 0 ? `
              <div class="total-row" style="color: #059669;">
                <span style="font-weight: 600;">Discount</span>
                <span style="font-weight: 700;">- ₦${Number(bill.discount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="total-row grand">
              <span>Total Amount</span>
              <span>₦${Number(bill.totalAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>

            <div class="payment-summary">
              <div class="payment-row">
                <span style="color: #6b7280;">Amount Paid</span>
                <span style="color: #059669;">₦${Number(bill.paidAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="payment-row balance-due">
                <span>Balance Due</span>
                <span>₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated document. No signature required.</p>
            <p style="margin-top: 10px; font-weight: 700;">${template?.footer_note || 'Thank you for choosing us'}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Invoice {bill.billNumber}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-10" ref={printRef}>
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-6">
                {template?.hospitalLogoUrl ? (
                   <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-2">
                      <img src={template.hospitalLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                   </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">INVOICE</h1>
                  <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">{bill.billNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-900">{template?.hospital_name || 'Hospital HMS'}</p>
                <p className="text-xs text-gray-500 font-medium">{template?.hospital_address || '123 Health Street, Clinic Tower'}</p>
                <p className="text-xs text-gray-500 font-medium">{template?.email_address || 'contact@hms.com'} | {template?.contact_number || '+234 800 123 4567'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Details</h3>
                <div className="space-y-1">
                  <p className="text-base font-bold text-gray-900">{bill.fullName}</p>
                  <p className="text-xs text-gray-500 font-medium">PID: #{bill.patientId}</p>
                  <p className="text-xs text-gray-500 font-medium">{bill.gender} | {bill.age} Years</p>
                </div>
              </div>
              <div className="space-y-4 text-right">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Appointment</h3>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900">#{bill.appointmentId}</p>
                  <p className="text-xs text-gray-500 font-medium">{new Date(bill.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}</p>
                  <p className="text-xs text-gray-500 font-medium">{bill.department}</p>
                </div>
              </div>
            </div>

            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-4 text-left font-black text-gray-900 tracking-wider">SERVICE DESCRIPTION</th>
                  <th className="py-4 text-right font-black text-gray-900 tracking-wider">UNIT PRICE (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill.services?.map((service: any, i: number) => (
                  <tr key={i}>
                    <td className="py-5 text-sm font-medium text-gray-700">
                      <p className="font-bold">{service.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{service.description || 'Standard Medical Service'}</p>
                    </td>
                    <td className="py-5 text-right text-sm font-black text-gray-900">
                      ₦{service.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="w-80 ml-auto space-y-4">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-bold">₦{bill.subtotal.toLocaleString('en-NG')}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                  <span className="text-sm font-bold">- ₦{bill.discount.toLocaleString('en-NG')}</span>
                </div>
              )}
              <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-center">
                <span className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Amount Due</span>
                <span className="text-2xl font-black text-gray-900">₦{bill.totalAmount.toLocaleString('en-NG')}</span>
              </div>
            </div>

            <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Authorized By</p>
                <div className="h-10 w-40 border-b border-gray-200 mb-2"></div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Hospital Administrator</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400">This is a system generated document.</p>
              </div>
            </div>
          </div>

          <div className="p-10 bg-gray-50 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Update Payment Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        "py-2 px-4 rounded-xl text-xs font-bold border transition-all",
                        paymentMethod === m ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payment Status</label>
                <div className="flex flex-wrap gap-2">
                  {['Pending', 'Partial', 'Paid', 'Cancelled'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setPaymentStatus(s)}
                      className={cn(
                        "py-2 px-3 rounded-xl text-[10px] font-bold border transition-all uppercase",
                        paymentStatus === s ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Amount Paid (₦)</label>
                <div className="flex gap-4">
                  <input 
                    type="number" 
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-black text-primary-600 outline-none"
                  />
                  <button 
                    onClick={handleUpdatePayment}
                    disabled={saving}
                    className="px-6 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 whitespace-nowrap"
                  >
                    {saving ? '...' : 'Update Invoice'}
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
