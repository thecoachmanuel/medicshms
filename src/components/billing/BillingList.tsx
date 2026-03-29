'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Eye, Edit2, ChevronLeft, ChevronRight, Loader2, 
  AlertCircle, CheckCircle2, XCircle, ArrowUpRight, RefreshCw, Search,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { billingAPI, departmentsAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import GenerateInvoiceModal from './GenerateInvoiceModal';
import ViewInvoiceModal from './ViewInvoiceModal';
import EditInvoiceModal from './EditInvoiceModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BillingList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [generateModal, setGenerateModal] = useState<any>(null);
  const [viewModal, setViewModal] = useState<any>(null);
  const [editModal, setEditModal] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getAppointmentsOverview({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      }) as any;
      setData(res.data || []);
      setPagination(prev => ({ ...prev, total: res.pagination?.total || 0, pages: res.pagination?.pages || 0 }));
    } catch {
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filters = [
    { key: 'all', label: 'All Invoices' },
    { key: 'not-generated', label: 'Drafts' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Paid', label: 'Completed' },
    { key: 'Partial', label: 'Partial' }
  ];

  const handleDownloadCSV = async () => {
    try {
      toast.loading('Preparing download...');
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      };
      const res = await billingAPI.download(params) as any;
      const records = res.data || [];
      
      if (!records.length) {
        toast.dismiss();
        toast.error('No records to download');
        return;
      }

      const headers = [
        'Appointment ID', 'Patient Name', 'Patient ID', 'Date', 'Department', 
        'Doctor', 'Bill Number', 'Total Amount', 'Paid Amount', 'Due Amount', 
        'Payment Status', 'Method', 'Transaction ID'
      ];
      
      const csvData = [
        headers.join(','),
        ...records.map((item: any) => [
          item.appointmentId,
          `"${item.fullName}"`,
          item.patientId,
          item.appointmentDate,
          item.department,
          `"${item.doctorName}"`,
          item.billNumber,
          item.totalAmount,
          item.paidAmount,
          item.dueAmount,
          item.paymentStatus,
          item.paymentMethod,
          item.transactionId
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing_records_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.dismiss();
      toast.success('Download started');
    } catch (err) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Financial Records</h1>
          <p className="text-gray-500 text-sm mt-1">Manage hospital invoicing, collections and fee tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchData()} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
            <RefreshCw className={cn("w-4 h-4 text-gray-400 group-hover:text-indigo-600", loading && "animate-spin")} />
          </button>
          <button onClick={handleDownloadCSV} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search invoice #, patient name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all shadow-indigo-100/10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 shadow-sm border",
                statusFilter === f.key 
                  ? "bg-gray-900 text-white border-gray-900 shadow-gray-200" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Ref</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financials</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-6 h-20 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-200">
                        <span className="text-4xl font-black">₦</span>
                      </div>
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No financial records found</p>
                    </div>
                  </td>
                </tr>
              ) : data.map((item) => (
                <tr key={item._id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-gray-900">#APT-{item.appointmentId}</span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(item.appointmentDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center">
                        <span className="text-indigo-600 font-black text-xs">{item.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{item.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PID: #{item.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {item.bill ? (
                      <div className="space-y-1">
                        <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border border-gray-700 shadow-sm shadow-gray-200">
                          {item.bill.billNumber}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.department}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-50 px-3 py-1 rounded-lg">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {item.bill ? (
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-900 tracking-tight">₦{item.bill.totalAmount.toLocaleString('en-NG')}</p>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Rec: ₦{item.bill.paidAmount.toLocaleString('en-NG')}</p>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-5">
                    {item.bill ? (
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                        item.bill.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        item.bill.paymentStatus === 'Partial' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {item.bill.paymentStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> :
                         item.bill.paymentStatus === 'Partial' ? <AlertCircle className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {item.bill.paymentStatus}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100 text-[10px] font-black uppercase tracking-widest">
                        Pending Generation
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                      {!item.bill ? (
                        <button 
                          onClick={() => setGenerateModal(item)}
                          disabled={item.appointmentStatus === 'Cancelled'}
                          className="btn-primary py-2 px-4 shadow-lg shadow-indigo-100 disabled:opacity-30 disabled:shadow-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Generate
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => setViewModal({ billId: item.bill._id, appointment: item })}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all active:scale-90"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditModal({ billId: item.bill._id, appointment: item })}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 transition-all active:scale-90"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              Cycle {pagination.page} Profile
            </span>
            <div className="flex items-center gap-3">
              <button 
                disabled={pagination.page === 1} 
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={pagination.page === pagination.pages} 
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {generateModal && (
        <GenerateInvoiceModal 
          appointment={generateModal}
          onClose={() => setGenerateModal(null)}
          onGenerated={() => { setGenerateModal(null); fetchData(); }}
        />
      )}

      {viewModal && (
        <ViewInvoiceModal 
          billId={viewModal.billId}
          appointment={viewModal.appointment}
          onClose={() => setViewModal(null)}
          onUpdated={fetchData}
        />
      )}

      {editModal && (
        <EditInvoiceModal 
          billId={editModal.billId}
          appointment={editModal.appointment}
          onClose={() => setEditModal(null)}
          onUpdated={() => { setEditModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
