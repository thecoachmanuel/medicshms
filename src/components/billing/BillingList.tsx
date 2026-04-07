'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Eye, Edit2, ChevronLeft, ChevronRight, Loader2, 
  AlertCircle, CheckCircle2, XCircle, ArrowUpRight, RefreshCw, Search,
  Download, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
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
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadingAnalytics(true);
    try {
      const [res, insightRes] = await Promise.all([
        billingAPI.getAppointmentsOverview({
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined
        }),
        billingAPI.getInsights({})
      ]) as any[];

      setData(res.data || []);
      setPagination(prev => ({ ...prev, total: res.pagination?.total || 0, pages: res.pagination?.pages || 0 }));
      setAnalytics(insightRes.analytics);
    } catch {
      toast.error('Failed to load billing records');
    } finally {
      setLoading(false);
      setLoadingAnalytics(false);
    }
  }, [pagination.page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? Any associated clinical requests will be reverted to Pending status.')) {
      return;
    }

    try {
      toast.loading('Deleting record...');
      await billingAPI.delete(id);
      toast.dismiss();
      toast.success('Record deleted successfully');
      fetchData();
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to delete record');
    }
  };

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
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      {/* Financial Insight Belt */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: analytics?.totalRevenue || 0, color: 'emerald', icon: <ArrowUpRight className="w-4 h-4" /> },
          { label: 'Cash at Hand', value: analytics?.totalPaid || 0, color: 'amber', icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: 'Outstanding Debt', value: analytics?.totalDue || 0, color: 'rose', icon: <AlertCircle className="w-4 h-4" /> },
          { label: 'Total Invoices', value: analytics?.totalInvoices || 0, color: 'indigo', icon: <RefreshCw className="w-4 h-4" />, isCount: true }
        ].map((card, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className={`absolute top-0 right-0 w-24 h-24 bg-${card.color}-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-all duration-500`}></div>
             <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                   <p className={`text-xl font-black text-${card.color}-600`}>
                     {card.isCount ? card.value : `₦${card.value.toLocaleString('en-NG')}`}
                   </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600 border border-${card.color}-100/50`}>
                   {card.icon}
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Financial Records</h1>
          <p className="text-gray-500 text-sm mt-1">Manage hospital invoicing, collections and fee tracking.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => fetchData()} className="p-3 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all group" title="Sync Ledger">
            <RefreshCw className={cn("w-4 h-4 text-gray-400 group-hover:text-amber-600 font-bold", loading && "animate-spin")} />
          </button>
          <button onClick={handleDownloadCSV} className="btn-secondary px-6">
            <Download className="w-4 h-4" />
            Export Ledger
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search invoice #, patient name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border border-white/80 rounded-[1.25rem] text-sm focus:bg-white focus:ring-4 focus:ring-amber-500/10 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 shadow-sm border",
                statusFilter === f.key 
                  ? "bg-amber-600 text-white border-amber-600 shadow-amber-200/50" 
                  : "bg-white/70 backdrop-blur-sm text-gray-400 border-white hover:border-amber-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/20 border-b border-gray-100">
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Reference No.</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Invoice Unit</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Financial Summary</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Settlement</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                       <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2"></div>
                       <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner text-gray-200">
                        <span className="text-4xl font-black">₦</span>
                      </div>
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Zero Financial Entries</p>
                    </div>
                  </td>
                </tr>
              ) : data.map((item) => (
                <tr key={item._id} className="group hover:bg-amber-50/20 transition-all duration-300">
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-gray-900">#APT-{item.appointmentId}</span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(item.appointmentDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[1rem] bg-amber-50 border border-amber-100/50 flex items-center justify-center shadow-sm shadow-amber-100/20 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                        <span className="text-amber-600 font-black text-xs">{item.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{item.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">PID: #{item.patientId}</p>
                      </div>
                    </div>
                  </td>
                    <td className="px-6 py-5">
                      {item.bill ? (
                        <div className="space-y-1.5">
                          <span className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-gray-700 shadow-sm">
                            {item.bill.billNumber}
                          </span>
                          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">{item.department}</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100/30">
                            Awaiting Billing
                          </span>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{item.department}</p>
                        </div>
                      )}
                    </td>
                  <td className="px-6 py-5">
                    {item.bill ? (
                      <div className="space-y-1.5">
                        <p className="text-sm font-black text-gray-900 tracking-tight">₦{item.bill.totalAmount.toLocaleString('en-NG')}</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-100/50">Rec: ₦{item.bill.paidAmount.toLocaleString('en-NG')}</p>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-5">
                    {item.bill ? (
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm",
                        item.bill.paymentStatus === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-emerald-100/20" :
                        item.bill.paymentStatus === 'Partial' ? "bg-amber-50 text-amber-600 border-amber-100/50 shadow-amber-100/20" :
                        "bg-rose-50 text-rose-600 border-rose-100/50 shadow-rose-100/20"
                      )}>
                        {item.bill.paymentStatus === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         item.bill.paymentStatus === 'Partial' ? <AlertCircle className="w-3.5 h-3.5" /> :
                         <XCircle className="w-3.5 h-3.5" />}
                        {item.bill.paymentStatus}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 text-[10px] font-black uppercase tracking-[0.1em]">
                        Awaiting Billing
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                      {!item.bill && (user?.role === 'Admin' || user?.role === 'Receptionist') ? (
                        <button 
                          onClick={() => setGenerateModal(item)}
                          disabled={item.appointmentStatus === 'Cancelled'}
                          className="btn-primary py-2.5 px-6 shadow-lg shadow-amber-200/40 disabled:opacity-30 disabled:shadow-none whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4" />
                          Finalize Bill
                        </button>
                      ) : !item.bill ? (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Processing...</span>
                      ) : (
                        <>
                          <button 
                            onClick={() => setViewModal({ billId: item.bill._id, appointment: item })}
                            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-amber-600 hover:border-amber-100 hover:bg-amber-50 transition-all active:scale-90 shadow-sm"
                            title="Inspect Invoice"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setEditModal({ billId: item.bill._id, appointment: item })}
                            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 transition-all active:scale-90 shadow-sm"
                            title="Adjust Ledger"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          {user?.role === 'Admin' && (
                            <button 
                              onClick={() => handleDelete(item.bill._id)}
                              className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-90 shadow-sm"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
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
          <div className="px-8 py-7 bg-gray-50/20 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              Finance Cycle {pagination.page} Profile
            </span>
            <div className="flex items-center gap-3">
              <button 
                disabled={pagination.page === 1} 
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-30 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={pagination.page === pagination.pages} 
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-30 shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
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
