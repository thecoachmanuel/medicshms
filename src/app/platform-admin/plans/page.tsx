'use client';

import React, { useState, useEffect } from 'react';
import { subscriptionPlansAPI } from '@/lib/api';
import { 
  Package, Plus, Edit2, Trash2, CheckCircle2, 
  Settings2, Activity, DollarSign, List,
  MoreVertical, Check, X, Loader2, Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    features: [] as string[],
    is_active: true,
    is_recommended: false
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await subscriptionPlansAPI.getAll();
      setPlans(res.data || []);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan: any = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        features: plan.features || [],
        is_active: plan.is_active,
        is_recommended: plan.is_recommended || false
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        features: [],
        is_active: true,
        is_recommended: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await subscriptionPlansAPI.update(editingPlan.id, formData);
        toast.success('Plan updated successfully');
      } else {
        await subscriptionPlansAPI.create(formData);
        toast.success('Plan created successfully');
      }
      setIsModalOpen(false);
      loadPlans();
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await subscriptionPlansAPI.delete(id);
      toast.success('Plan deleted');
      loadPlans();
    } catch {
      toast.error('Delete failed');
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic text-black">
            Subscription <span className="text-primary-600">Plans</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage tiers, pricing, and feature sets for all hospitals.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-primary py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-5 h-5" />
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col group">
             <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6" />
                   </div>
                   <div className="flex gap-2">
                     {plan.is_recommended && (
                       <div className="px-3 py-1 bg-primary-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                         <Heart className="w-2.5 h-2.5 fill-current" />
                         Featured
                       </div>
                     )}
                     <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${plan.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                     </div>
                   </div>
                </div>
                
                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{plan.name}</h3>
                   <p className="text-xs text-slate-400 font-bold italic">{plan.description}</p>
                </div>

                <div className="pt-4 space-y-3">
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly</p>
                        <p className="text-lg font-black text-primary-600">₦{plan.price_monthly.toLocaleString()}</p>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">/ month</div>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly</p>
                        <p className="text-lg font-black text-primary-600">₦{plan.price_yearly.toLocaleString()}</p>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">/ year</div>
                   </div>
                </div>

                <div className="pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Included Features</p>
                    <ul className="space-y-2">
                      {Array.isArray(plan.features) && plan.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                </div>
             </div>
             
             <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-1.5"
                >
                   <Trash2 className="w-4 h-4" />
                   Delete
                </button>
                <button 
                  onClick={() => openModal(plan)}
                  className="btn-secondary py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-slate-200 hover:bg-white bg-transparent"
                >
                   <Edit2 className="w-4 h-4" />
                   Edit Plan
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">
                {editingPlan ? 'Edit' : 'Create'} <span className="text-primary-600">Plan</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Pro Hospital"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-900 placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug (URL friendly)</label>
                  <input 
                    required
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                    placeholder="e.g. pro-hospital"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Tell us what makes this plan special..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-900 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price Monthly (₦)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price_monthly}
                    onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-black text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price Yearly (₦)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price_yearly}
                    onChange={e => setFormData({...formData, price_yearly: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Features (one per line)</label>
                <textarea 
                  value={formData.features.join('\n')}
                  onChange={e => setFormData({...formData, features: e.target.value.split('\n').filter(f => f.trim())})}
                  placeholder="Unlimited Patients&#10;White-label Options"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-900 min-h-[120px]"
                />
              </div>

              <div className="flex items-center gap-8 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Plan Active</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox"
                      checked={formData.is_recommended}
                      onChange={e => setFormData({...formData, is_recommended: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Featured Plan</span>
                </label>
              </div>

              <div className="pt-6 flex gap-4 sticky bottom-0 bg-white">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-3"
                >
                  <Check className="w-5 h-5" />
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
