'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patientAPI } from '@/lib/api';
import { 
   Download, Filter, Search, 
  CheckCircle2, Clock, AlertCircle, FileText,
  Activity, CreditCard
} from 'lucide-react';
import NairaSign from '@/components/common/NairaSign';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PatientInvoicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await patientAPI.getMe();
        if (res.data) setData(res.data);
      } catch (err) {
        toast.error('Failed to load financial records');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CreditCard className="w-12 h-12 text-indigo-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Financial Records...</p>
      </div>
    );
  }

  const bills = data?.bills || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">My Invoices</h1>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">Billing & Payment History</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="p-4 bg-gray-900 rounded-[1.5rem] text-white flex items-center gap-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
                 <NairaSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Outstanding</p>
                <p className="text-sm font-black text-indigo-300">
                  ₦{(bills.filter((b: any) => b.payment_status === 'Pending').reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0)).toLocaleString()}
                </p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid gap-6">
        {bills.length > 0 ? bills.map((bill: any) => (
          <div key={bill.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-[100px] -z-10 group-hover:bg-indigo-50/50 transition-colors" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:border-indigo-100 border border-transparent transition-all">
                  <FileText className="w-8 h-8 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">{bill.invoice_number}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {new Date(bill.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-center md:text-right">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <div className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    bill.payment_status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    bill.payment_status === 'Partial' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                    {bill.payment_status}
                  </div>
                </div>

                <div className="text-center md:text-right min-w-[120px]">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-xl font-black text-gray-900 tracking-tighter">₦{(bill.total_amount || 0).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => toast.success('Initializing invoice download...')}
                     className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:shadow-md"
                     title="Download Invoice"
                   >
                     <Download className="w-5 h-5" />
                   </button>
                   {bill.payment_status !== 'Paid' && (
                     <button 
                       className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-gray-900/10 active:scale-95"
                     >
                       Settle Now
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-200">
               <NairaSign className="w-10 h-10" />
            </div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No transaction history found</p>
          </div>
        )}
      </div>
    </div>
  );
}
