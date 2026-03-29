'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, Activity,
  Search, Plus, Filter, MoreVertical,
  ChevronRight, Calendar, ShieldCheck, AlertCircle,
  TrendingUp, BarChart3, Loader2, CheckCircle2,
  XCircle, Clock, Settings, Pause, Play
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { platformAdminAPI } from '@/lib/api';
import HospitalLogo from '@/components/common/HospitalLogo';

interface Hospital {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: 'active' | 'inactive' | 'onboarding';
  subscription_status: 'trial' | 'active' | 'expired' | 'paused';
  trial_end_date: string;
  created_at: string;
}

export default function PlatformAdminDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    expired: 0,
    paused: 0
  });

  // New Hospital Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    subscription_status: 'trial' as const
  });

  // Subscription Management State
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    subscription_status: 'trial' as Hospital['subscription_status'],
    trial_end_date: ''
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const data = await platformAdminAPI.getHospitals() as any;
      setHospitals(data.hospitals);
      setStats(data.stats);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateHospitalStatus = async (id: string, status: string) => {
    try {
      await platformAdminAPI.updateHospital(id, { status });
      toast.success('Hospital updated');
      fetchHospitals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await platformAdminAPI.createHospital(formData);
      
      toast.success('Hospital created successfully');
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', email: '', subscription_status: 'trial' });
      fetchHospitals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;

    try {
      setIsSubmitting(true);
      await platformAdminAPI.updateHospital(selectedHospital.id, subscriptionForm);
      toast.success('Subscription updated successfully');
      setIsSubscriptionModalOpen(false);
      fetchHospitals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSubscriptionModal = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setSubscriptionForm({
      subscription_status: hospital.subscription_status,
      trial_end_date: new Date(hospital.trial_end_date).toISOString().split('T')[0]
    });
    setIsSubscriptionModalOpen(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Super Admin</h1>
              <p className="text-slate-500 font-medium">Manage and monitor all hospital institutions</p>
            </div>
          </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-4 px-8 rounded-2xl shadow-xl shadow-primary-600/20 group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
          Add New Hospital
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { icon: Building2, label: "Total Hospitals", value: stats.total, color: "bg-primary-600" },
          { check: CheckCircle2, label: "Active Subscriptions", value: stats.active, color: "bg-emerald-600" },
          { clock: Clock, label: "Free Trials", value: stats.trial, color: "bg-amber-600" },
          { alert: AlertCircle, label: "Expired Plans", value: stats.expired, color: "bg-rose-600" },
          { pause: Pause, label: "Paused Services", value: stats.paused, color: "bg-slate-600" }
        ].map((s, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              {s.icon && <s.icon className="w-6 h-6 text-white" />}
              {s.check && <s.check className="w-6 h-6 text-white" />}
              {s.clock && <s.clock className="w-6 h-6 text-white" />}
              {s.alert && <s.alert className="w-6 h-6 text-white" />}
              {s.pause && <s.pause className="w-6 h-6 text-white" />}
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Hospital List Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-900">Registered Institutions</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search hospitals..." 
                  className="bg-slate-50 border-slate-100 rounded-xl py-2 pl-10 text-sm font-medium focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all w-64"
                />
             </div>
             <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                <Filter className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital Name</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan & Status</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trial Ends</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined On</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary-600 font-black shrink-0 shadow-inner group-hover:bg-white group-hover:shadow-md transition-all">
                        {h.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{h.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{h.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1.5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit shadow-sm
                        ${h.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          h.subscription_status === 'trial' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          h.subscription_status === 'paused' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {h.subscription_status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : 
                         h.subscription_status === 'paused' ? <Pause className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {h.subscription_status}
                      </div>
                      <p className={`text-[10px] font-bold uppercase transition-all
                        ${h.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        System: {h.status}
                      </p>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium italic">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      {new Date(h.trial_end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-6 text-sm text-slate-500 font-medium">
                    {new Date(h.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => openSubscriptionModal(h)}
                        className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                        title="Manage Subscription"
                       >
                         <Settings className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => updateHospitalStatus(h.id, h.status === 'active' ? 'inactive' : 'active')}
                        className={`p-2 rounded-xl transition-colors ${h.status === 'active' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                         {h.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                       </button>
                       <Link 
                        href={`/${h.slug}`}
                        target="_blank"
                        className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                       >
                         <ChevronRight className="w-4 h-4" />
                       </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hospital Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">New Hospital Integration</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <Filter className="w-5 h-5 rotate-45" /> {/* Using Filter as a close icon for simplicity if X not available */}
              </button>
            </div>
            
            <form onSubmit={handleCreateHospital} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Hospital Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none"
                    placeholder="Enter full name..."
                  />
                </div>
                
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Hospital Slug (URL)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none"
                    placeholder="e.g. city-hospital"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Admin Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none"
                    placeholder="admin@hospital.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Initial Plan</label>
                  <select
                    value={formData.subscription_status}
                    onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value as any })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none appearance-none"
                  >
                    <option value="trial">Free Trial (30 Days)</option>
                    <option value="active">Active Subscription</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-4 rounded-2xl font-bold shadow-xl shadow-primary-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {isSubmitting ? 'Initializing...' : 'Confirm Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Subscription Modal */}
      {isSubscriptionModalOpen && selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Manage Subscription</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedHospital.name}</p>
              </div>
              <button 
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubscription} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Subscription Status</label>
                  <select
                    value={subscriptionForm.subscription_status}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, subscription_status: e.target.value as any })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none appearance-none"
                  >
                    <option value="trial">Free Trial</option>
                    <option value="active">Active Subscription</option>
                    <option value="paused">Paused / Suspended</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Trial / Subscription End Date</label>
                  <input 
                    type="date" 
                    required
                    value={subscriptionForm.trial_end_date}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, trial_end_date: e.target.value })}
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-4 rounded-2xl font-bold shadow-xl shadow-primary-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
