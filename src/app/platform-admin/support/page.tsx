'use client';

import React, { useState, useEffect } from 'react';
import { 
  Headphones, Search, Filter, MessageSquare, 
  Building2, Calendar, Clock, ChevronRight, 
  CheckCircle2, AlertCircle, Loader2, X,
  ExternalLink, Mail, Phone, Hash, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supportAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PlatformSupportManagement() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, typeFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportAPI.getAll({ status: statusFilter, ticket_type: typeFilter }) as any;
      setTickets(res.tickets || []);
    } catch {
      toast.error('Failed to fetch system-wide support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ticket: any) => {
    const newStatus = ticket.status === 'Resolved' ? 'Open' : 'Resolved';
    try {
      await supportAPI.update(ticket._id, { status: newStatus });
      toast.success(`Ticket #${ticket._id.slice(-6).toUpperCase()} marked as ${newStatus}`);
      fetchTickets();
      if (selectedTicket?._id === ticket._id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t._id.includes(searchTerm)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Support</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and resolve technical issues across all hospital institutions.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border-slate-200 rounded-xl py-2 px-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-600/5 transition-all shadow-sm"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border-slate-200 rounded-xl py-2 px-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-600/5 transition-all shadow-sm"
          >
            <option value="">All Types</option>
            <option value="patient">Patient Tickets</option>
            <option value="tenant">Tenant Tickets</option>
          </select>
          <button 
            onClick={fetchTickets}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary-600 transition-colors shadow-sm"
          >
            <Clock className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
        <input 
          type="text" 
          placeholder="Search tickets by hospital, issue, or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-medium focus:ring-8 focus:ring-primary-600/5 focus:border-primary-600 outline-none shadow-xl shadow-slate-200/20 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-white border border-slate-100 rounded-[2rem] animate-pulse"></div>
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="py-24 text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
            <MessageSquare className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No support tickets found</p>
          </div>
        ) : filteredTickets.map((ticket) => (
          <div key={ticket._id} className="bg-white border border-slate-50 p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                   <div className={cn(
                     "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm flex items-center gap-2",
                     ticket.status === 'Open' ? "bg-rose-50 text-rose-600" :
                     ticket.status === 'In Progress' ? "bg-amber-50 text-amber-600" :
                     "bg-emerald-50 text-emerald-600"
                   )}>
                     <div className={cn("w-1.5 h-1.5 rounded-full", 
                        ticket.status === 'Open' ? "bg-rose-600" : 
                        ticket.status === 'In Progress' ? "bg-amber-600" : "bg-emerald-600"
                     )}></div>
                     {ticket.status}
                   </div>

                   <div className={cn(
                     "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-sm flex items-center gap-2",
                     ticket.ticket_type === 'tenant' ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-500 border border-slate-100"
                   )}>
                     {ticket.ticket_type === 'tenant' ? 'Hospital Support' : 'Patient Inquiry'}
                   </div>

                   <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                     <Building2 className="w-3 h-3 text-slate-300" />
                     {ticket.hospital?.name || ticket.hospital_name || 'System Level'}
                   </div>

                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                     <Hash className="w-3 h-3 text-slate-200" />
                     {ticket._id.slice(-8).toUpperCase()}
                   </div>

                   <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                     <Clock className="w-3 h-3 text-slate-200" />
                     {new Date(ticket.created_at).toLocaleDateString()}
                   </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">{ticket.issueType}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-3xl line-clamp-2 italic">"{ticket.description}"</p>
                </div>

                <div className="flex flex-wrap items-center gap-8 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shadow-inner">
                      {ticket.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-none mb-1">{ticket.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-tight">{ticket.email}</p>
                    </div>
                  </div>
                  {ticket.phone && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                      <Phone className="w-3.5 h-3.5 text-slate-200" />
                      {ticket.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex lg:flex-col items-center gap-3 lg:border-l lg:border-slate-100 lg:pl-10 min-w-[180px]">
                <button 
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full btn-secondary font-black text-[10px] uppercase py-3.5 tracking-widest opacity-60 hover:opacity-100 transition-all bg-slate-50 border-none"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleToggleStatus(ticket)}
                  className={cn(
                    "w-full px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                    ticket.status === 'Resolved' ? "bg-emerald-50 text-emerald-600 shadow-emerald-600/5 border border-emerald-100" : "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800"
                  )}
                >
                  {ticket.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    selectedTicket.status === 'Open' ? "bg-rose-500 text-white shadow-rose-200" : "bg-emerald-500 text-white shadow-emerald-200"
                  )}>
                    {selectedTicket.status === 'Open' ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTicket.issueType}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{selectedTicket._id.toUpperCase()}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[8px] font-black uppercase",
                        selectedTicket.ticket_type === 'tenant' ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {selectedTicket.ticket_type === 'tenant' ? 'Hospital Support' : 'Patient Inquiry'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <X className="w-6 h-6 text-slate-300 group-hover:text-slate-900" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2rem]">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="w-3 h-3" /> Requester
                  </p>
                  <p className="text-sm font-black text-slate-900">{selectedTicket.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedTicket.email}</p>
                  {selectedTicket.hospital_name && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white border border-slate-100 rounded-lg w-fit">
                      <Building2 className="w-3 h-3 text-primary-400" />
                      <span className="text-[9px] font-bold text-slate-600 uppercase">{selectedTicket.hospital_name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Timeline
                  </p>
                  <p className="text-sm font-black text-slate-900">Submitted On</p>
                  <p className="text-xs text-slate-500 font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white border border-slate-100 rounded-lg w-fit">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-bold text-slate-600 uppercase">Status: {selectedTicket.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Issue Description</p>
                <div className="bg-white border-2 border-slate-50 p-8 rounded-[2rem] min-h-[180px] shadow-sm">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap">"{selectedTicket.description}"</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => handleToggleStatus(selectedTicket)}
                  className={cn(
                    "flex-2 py-5 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3",
                    selectedTicket.status === 'Resolved' ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10"
                  )}
                >
                  {selectedTicket.status === 'Resolved' ? (
                    <>Reopen Ticket</>
                  ) : (
                    <>Mark as Resolved</>
                  )}
                </button>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
