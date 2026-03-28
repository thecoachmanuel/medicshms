'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, Clock, Building2, 
  User, Mail, Phone, MessageSquare, 
  Search, Filter, ChevronRight,
  CheckCircle2, XCircle, Clock4,
  MoreVertical, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface DemoRequest {
  id: string;
  hospital_name: string;
  contact_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export default function DemoRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/platform-admin/demo-requests');
      const data = await res.json();
      setRequests(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch demo requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/platform-admin/demo-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Request status updated to ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock4 className="w-4 h-4 text-amber-500" />;
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Demo Requests</h1>
          <p className="text-slate-500 font-medium">Track and manage hospital demo inquiries</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search hospitals..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all w-64"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all px-4"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No demo requests found</p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black text-slate-900 leading-none">{req.hospital_name}</h3>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                          req.status === 'pending' && "bg-amber-50 text-amber-600",
                          req.status === 'scheduled' && "bg-blue-50 text-blue-600",
                          req.status === 'completed' && "bg-emerald-50 text-emerald-600",
                          req.status === 'cancelled' && "bg-rose-50 text-rose-600",
                        )}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{req.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{req.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{req.preferred_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-600">{req.preferred_time}</span>
                    </div>
                  </div>

                  {req.message && (
                    <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{req.message}"</p>
                    </div>
                  )}
                </div>

                <div className="flex lg:flex-col justify-end gap-2 shrink-0">
                  {req.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(req.id, 'scheduled')}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Schedule
                    </button>
                  )}
                  {req.status === 'scheduled' && (
                    <button 
                      onClick={() => updateStatus(req.id, 'completed')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      Complete
                    </button>
                  )}
                  {req.status !== 'cancelled' && req.status !== 'completed' && (
                    <button 
                      onClick={() => updateStatus(req.id, 'cancelled')}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
