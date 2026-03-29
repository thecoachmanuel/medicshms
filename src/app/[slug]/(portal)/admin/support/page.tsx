'use client';

import React, { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import { Headphones, Search, Filter, MessageSquare, User, Calendar, Clock, ChevronRight, CheckCircle2, AlertCircle, Loader2, X, ExternalLink, Mail, Phone, Hash, ShieldCheck, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supportAPI, siteSettingsAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SupportTicketsPage() {
  const { slug } = useParams() as { slug: string };
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'patient' | 'platform'>('patient');
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platformTicket, setPlatformTicket] = useState({
    issueType: '',
    description: ''
  });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, activeTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await supportAPI.getAll({ 
        status: statusFilter, 
        ticket_type: activeTab === 'platform' ? 'tenant' : activeTab 
      }) as any;
      setTickets(res.tickets || []);
    } catch {
      toast.error('Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleContactPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformTicket.issueType || !platformTicket.description) return toast.error('Fill all fields');
    
    setIsSubmitting(true);
    try {
      // Get hospital settings for metadata
      const settingsRes = await siteSettingsAPI.get();
      const hospitalName = settingsRes.data?.hospital_name || 'Hospital Tenant';

      await supportAPI.create({
        ...platformTicket,
        name: hospitalName,
        email: 'admin@tenant.com', // In reality, get from user profile
        ticket_type: 'tenant',
        slug
      });
      toast.success('Your request has been sent to Platform Support');
      setShowPlatformModal(false);
      setPlatformTicket({ issueType: '', description: '' });
      fetchTickets(); // Refresh list if on platform tab
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (ticket: any) => {
    const newStatus = ticket.status === 'Resolved' ? 'Open' : 'Resolved';
    try {
      await supportAPI.update(ticket._id, { status: newStatus });
      toast.success(`Ticket marked as ${newStatus}`);
      fetchTickets();
      if (selectedTicket?._id === ticket._id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch {
      toast.error('Failed to update ticket status');
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t._id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Support Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === 'patient' 
              ? 'Manage inquiries and patient feedback.' 
              : 'Technical assistance from the Platform Admin.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'platform' && (
            <button 
              onClick={() => setShowPlatformModal(true)}
              className="btn-primary py-2 text-xs font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800"
            >
              <ShieldCheck className="w-4 h-4" />
              New Request
            </button>
          )}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-2 text-xs font-bold uppercase tracking-widest border-gray-200"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('patient')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
            activeTab === 'patient' ? "bg-slate-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
          )}
        >
          Patient Tickets
        </button>
        <button 
          onClick={() => setActiveTab('platform')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
            activeTab === 'platform' ? "bg-primary-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
          )}
        >
          Platform Support
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search tickets by patient info or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm"
        />
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse"></div>
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center card bg-gray-50 border-none">
            {activeTab === 'patient' ? (
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-primary-200 mx-auto mb-4" />
            )}
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              {activeTab === 'patient' ? 'No patient tickets found' : 'No platform requests found'}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket._id} className="card p-6 hover:shadow-xl transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                     <span className={cn(
                       "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                       ticket.status === 'Open' ? "bg-rose-50 text-rose-600" :
                       ticket.status === 'In Progress' ? "bg-amber-50 text-amber-600" :
                       "bg-emerald-50 text-emerald-600"
                     )}>
                       {ticket.status}
                     </span>
                     <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                       <Hash className="w-3 h-3 text-gray-200" />
                       {ticket._id.slice(-8).toUpperCase()}
                     </span>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Clock className="w-3 h-3 text-gray-200" />
                       {new Date(ticket.created_at).toLocaleDateString()}
                     </span>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{ticket.issueType}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                  </div>
  
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                        {ticket.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-900">{ticket.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{ticket.email}</p>
                      </div>
                    </div>
                    {ticket.phone && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <Phone className="w-3 h-3 text-gray-200" />
                        {ticket.phone}
                      </div>
                    )}
                  </div>
                </div>
  
                <div className="flex lg:flex-col items-center gap-2 lg:border-l lg:border-gray-50 lg:pl-8 min-w-[140px]">
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="btn-secondary w-full text-[10px] uppercase font-black py-2"
                  >
                    View Details
                  </button>
                  {activeTab === 'patient' && (
                    <button 
                      onClick={() => handleToggleStatus(ticket)}
                      className={cn(
                        "w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                        ticket.status === 'Resolved' ? "bg-emerald-50 text-emerald-600" : "bg-gray-900 text-white"
                      )}
                    >
                      {ticket.status === 'Resolved' ? 'Reopen' : 'Resolve'}
                    </button>
                  )}
                  {activeTab === 'platform' && (
                    <div className="w-full text-center py-2 bg-gray-50 rounded-xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Controlled by Platform</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedTicket.status === 'Open' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {selectedTicket.status === 'Open' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedTicket.issueType}</h2>
                    <p className="text-xs text-slate-400 font-bold tracking-tight">Status: {selectedTicket.status}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-200" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</p>
                  <p className="text-sm font-bold text-slate-900">{selectedTicket.name}</p>
                  <p className="text-xs text-slate-500">{selectedTicket.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</p>
                  <p className="text-sm font-bold text-slate-900"># {selectedTicket._id.toUpperCase()}</p>
                  <p className="text-xs text-slate-500">Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Description</p>
                <div className="bg-white border border-slate-100 p-6 rounded-3xl min-h-[150px]">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                {activeTab === 'patient' && (
                  <button 
                    onClick={() => handleToggleStatus(selectedTicket)}
                    className={cn(
                      "flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all",
                      selectedTicket.status === 'Resolved' ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                    )}
                  >
                    {selectedTicket.status === 'Resolved' ? 'Reopen Inquiry' : 'Mark as Resolved'}
                  </button>
                )}
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
    {/* Platform Support Modal */}
    {showPlatformModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPlatformModal(false)}></div>
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Platform Support</h2>
                  <p className="text-xs text-slate-400 font-bold tracking-tight">Contact Super Admin for technical help.</p>
                </div>
              </div>
              <button onClick={() => setShowPlatformModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-200" />
              </button>
            </div>

            <form onSubmit={handleContactPlatform} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Type</label>
                <select 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-black text-xs uppercase tracking-widest"
                  value={platformTicket.issueType}
                  onChange={e => setPlatformTicket({...platformTicket, issueType: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="Technical Bug">Technical Bug</option>
                  <option value="Billing Issue">Billing Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Account Access">Account Access</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Describe the Issue</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-medium text-sm resize-none"
                  placeholder="Provide as much detail as possible..."
                  value={platformTicket.description}
                  onChange={e => setPlatformTicket({...platformTicket, description: e.target.value})}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
