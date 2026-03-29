'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Edit2, Save, Printer, Eye, 
  Trash2, Plus, Layout, Type, Image as ImageIcon,
  Loader2, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { invoiceTemplateAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InvoiceTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState({
    hospitalName: 'Modern Life Hospital',
    address: '123 Medical Drive, Health City',
    phone: '+91 99999 00000',
    email: 'billing@modernlife.com',
    website: 'www.modernlife.com',
    gstNumber: 'GSTIN1234567890',
    logoUrl: '',
    footerNote: 'Thank you for choosing Modern Life Hospital. Get well soon!',
    termsAndConditions: '1. All payments are final. 2. Insurance claims subject to approval.'
  });

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const res = await invoiceTemplateAPI.get();
      if (res.data) setTemplate(res.data);
    } catch {
      toast.error('Failed to fetch template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await invoiceTemplateAPI.update(template);
      toast.success('Invoice template updated');
    } catch {
      toast.error('Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Invoice Customization</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your hospital billing profile and invoice headers/footers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <form onSubmit={handleSave} className="card p-8 group">
             <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Hospital Details</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Hospital Name</label>
                <input required type="text" value={template.hospitalName} onChange={e => setTemplate({...template, hospitalName: e.target.value})} className="input py-3" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Address Line</label>
                <textarea rows={2} value={template.address} onChange={e => setTemplate({...template, address: e.target.value})} className="input py-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Contact Phone</label>
                  <input type="text" value={template.phone} onChange={e => setTemplate({...template, phone: e.target.value})} className="input py-3" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">GST Number</label>
                  <input type="text" value={template.gstNumber} onChange={e => setTemplate({...template, gstNumber: e.target.value})} className="input py-3" />
                </div>
              </div>
              <div className="space-y-1.5 pt-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Footer Message</label>
                <textarea rows={2} value={template.footerNote} onChange={e => setTemplate({...template, footerNote: e.target.value})} className="input py-3" placeholder="Get well soon..." />
              </div>
              
              <div className="pt-6">
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 shadow-xl shadow-primary-500/10">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Template</>}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card p-8 bg-gray-900 border-none shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full backdrop-blur-md">Live Preview</div>
             </div>

             <div className="bg-white rounded-xl p-8 min-h-[400px] flex flex-col shadow-inner">
               <div className="flex justify-between items-start mb-10">
                 <div>
                   <h3 className="text-xl font-black text-primary-600 tracking-tight uppercase">{template.hospitalName || 'HOSPITAL NAME'}</h3>
                   <p className="text-[10px] font-bold text-gray-400 mt-1 max-w-[200px] leading-relaxed uppercase">{template.address}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Tax Invoice</p>
                    <p className="text-sm font-black text-emerald-500 mt-1">#INV-2026-001</p>
                 </div>
               </div>

               <div className="flex-1 space-y-4">
                 <div className="h-px bg-gray-100 my-4"></div>
                 <div className="grid grid-cols-4 gap-4">
                   <div className="col-span-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Service Item</div>
                   <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</div>
                   <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-right">Price</div>
                 </div>
                 <div className="h-px bg-gray-100 mt-2 mb-6"></div>
                 <div className="text-[9px] font-bold text-gray-300 italic py-10 text-center uppercase tracking-[0.2em] bg-gray-50 rounded-lg">Items will appear here</div>
               </div>

               <div className="pt-10 space-y-4">
                  <div className="flex justify-between items-center text-gray-400">
                    <p className="text-[10px] font-black uppercase tracking-widest">Hospital GST</p>
                    <p className="text-[10px] font-bold">{template.gstNumber || 'N/A'}</p>
                  </div>
                  <div className="h-0.5 bg-gray-900 mb-2"></div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Clinic Signature Note</p>
                    <p className="text-[10px] font-bold text-gray-900 leading-relaxed italic">{template.footerNote || 'Signature Required'}</p>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
