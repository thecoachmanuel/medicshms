'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patientAPI } from '@/lib/api';
import { 
  FileText, Search, Filter, ChevronRight, 
  Download, Eye, Lock, AlertCircle, CheckCircle2,
  Activity, Microscope, Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function PatientRecordsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await patientAPI.getMe();
        if (res.data) setData(res.data);
      } catch (err) {
        toast.error('Failed to load medical records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Activity className="w-12 h-12 text-indigo-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Decrypting Clinical Archives...</p>
      </div>
    );
  }

  const records = data?.requests || [];
  const filteredRecords = records.filter((r: any) => 
    r.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Medical Records</h1>
          <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">Longitudinal Clinical History</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search investigations..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-sans placeholder:font-black tracking-widest uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Investigation</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Access Control</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.map((req: any) => {
                const isPaid = req.bills?.payment_status === 'Paid';
                const isCompleted = req.status === 'Completed';
                
                return (
                  <tr key={req.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-gray-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                          {req.type === 'Laboratory' ? <Microscope className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <p className="text-sm font-black text-gray-900">{req.test_name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest">{req.type}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-gray-600">{new Date(req.requested_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          isCompleted ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          isCompleted ? "text-emerald-600" : "text-amber-600"
                        )}>{req.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isCompleted ? (
                        isPaid ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                             <CheckCircle2 className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Released</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                             <Lock className="w-3 h-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Payment Required</span>
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processing...</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {isPaid && isCompleted ? (
                           <>
                             <button 
                               onClick={() => toast.success('Opening result viewer...')}
                               className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                               title="View Result"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => toast.success('Initializing download...')}
                               className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
                               title="Download PDF"
                             >
                               <Download className="w-4 h-4" />
                             </button>
                           </>
                         ) : !isPaid && isCompleted ? (
                           <button 
                             onClick={() => toast.error('Please settle the associated bill to unlock results.')}
                             className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                           >
                             Settle Bill
                           </button>
                         ) : null}
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching clinical records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
