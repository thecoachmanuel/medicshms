'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pharmacyAPI } from '@/lib/api';
import { InventoryItem } from '@/types';
import toast from 'react-hot-toast';
import { 
  Package, Plus, Search, Edit2, AlertTriangle, CheckCircle2, 
  X, Filter, Download, MoreVertical, Archive, ArrowUpDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PharmacyInventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    unit: '',
    quantity: 0,
    unit_price: 0,
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    reorder_level: 10,
    status: 'In Stock' as InventoryItem['status']
  });

  useEffect(() => {
    fetchInventory();
  }, [searchTerm]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await pharmacyAPI.getInventory({ search: searchTerm });
      setItems(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: InventoryItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_name: item.item_name,
        category: item.category || '',
        unit: item.unit || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        manufacturer: item.manufacturer || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        reorder_level: item.reorder_level,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({
        item_name: '', category: '', unit: '', quantity: 0, unit_price: 0,
        manufacturer: '', batch_number: '', expiry_date: '', reorder_level: 10, status: 'In Stock'
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'quantity' || name === 'unit_price' || name === 'reorder_level' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto compute standard status based on qty
      let currentStatus = formData.status;
      if (Number(formData.quantity) === 0) currentStatus = 'Out of Stock';
      else if (Number(formData.quantity) <= Number(formData.reorder_level)) currentStatus = 'Low Stock';
      else currentStatus = 'In Stock';

      const payload = { ...formData, status: currentStatus };

      if (editingItem) {
        await pharmacyAPI.updateInventoryItem({ id: editingItem.id, ...payload });
        toast.success('Stock record synchronized');
      } else {
        await pharmacyAPI.createInventoryItem(payload);
        toast.success('New item provisioned');
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Uplink failed');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-600" />
            Stock Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Manage pharmaceutical nodes, logic-based reordering, and expiry tracking.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="group flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> 
          Provision Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-5 bg-white/70 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-sm border border-white/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search inventory cluster..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl text-sm focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-gray-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-95">
            <Filter className="w-5 h-5" />
          </button>
          <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-95">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30 border-b border-gray-100/50">
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Pharmaceutical Node</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Classification</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-right">Volume</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-right">Unit Value</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Uplink Expiry</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Provision Status</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-10 py-10 h-24 bg-gray-50/10"></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-10 py-32 text-center text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">No active inventory records detected</p>
                  </td>
                </tr>
              ) : items.map(item => (
                <tr key={item.id} className="group hover:bg-emerald-50/10 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 text-emerald-600 flex items-center justify-center font-black text-base shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Archive className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors tracking-tight">{item.item_name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">BATCH: {item.batch_number || 'GEN-001'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-sm group-hover:border-emerald-200 transition-colors">
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="text-base font-black text-gray-900 tracking-tight">{item.quantity} <span className="text-[10px] text-gray-400 font-bold uppercase ml-1 opacity-60">{item.unit || 'Units'}</span></p>
                    {item.quantity <= item.reorder_level && (
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-tighter mt-1">Reorder Required</p>
                    )}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="inline-flex items-center bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/50 group-hover:bg-emerald-100 transition-colors">
                      <span className="text-sm font-black text-emerald-700">₦{parseInt(item.unit_price as any).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "text-xs font-bold",
                        item.expiry_date && new Date(item.expiry_date) < new Date() ? "text-rose-500" : "text-gray-600"
                      )}>
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                      {item.expiry_date && new Date(item.expiry_date) < new Date() && (
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Critical: Expired</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500",
                      item.status === 'In Stock' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                      item.status === 'Low Stock' && "bg-amber-50 text-amber-600 border-amber-100",
                      item.status === 'Out of Stock' && "bg-rose-50 text-rose-600 border-rose-100",
                      item.status === 'Expired' && "bg-gray-50 text-gray-400 border-gray-200"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full", item.status === 'In Stock' && "bg-emerald-500 animate-pulse", item.status === 'Low Stock' && "bg-amber-500", item.status === 'Out of Stock' && "bg-rose-500", item.status === 'Expired' && "bg-gray-400")} />
                      {item.status}
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button onClick={() => handleOpenModal(item)} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all active:scale-90" title="Modify Record">
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all active:scale-90 opacity-40 hover:opacity-100">
                        <MoreVertical className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] max-w-2xl w-full p-12 border border-white/60 overflow-hidden ring-1 ring-black/5">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
            
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {editingItem ? 'Metadata Refinement' : 'Node Provisioning'}
                </h2>
                <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Inventory Management Protocol</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-4 bg-gray-50/50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-[1.5rem] transition-all duration-300 active:scale-95"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Pharmaceutical Designation</label>
                  <input required name="item_name" value={formData.item_name} onChange={handleChange} type="text" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-bold tracking-tight" placeholder="e.g. Moxifloxacin 400mg" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Classification Unit</label>
                  <input name="category" value={formData.category} onChange={handleChange} type="text" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="Antibiotics" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Unit of Measurement</label>
                  <input name="unit" value={formData.unit} onChange={handleChange} type="text" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="Tablets / ml" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Current Volume</label>
                  <input required name="quantity" value={formData.quantity} onChange={handleChange} type="number" min="0" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all font-black text-emerald-600" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Clinical Value (₦/Unit)</label>
                  <input required name="unit_price" value={formData.unit_price} onChange={handleChange} type="number" min="0" step="0.01" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all font-black text-emerald-600" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Critical Reorder Threshold</label>
                  <input name="reorder_level" value={formData.reorder_level} onChange={handleChange} type="number" min="0" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all font-bold text-amber-500" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Uplink Expiry Identity</label>
                  <input name="expiry_date" value={formData.expiry_date} onChange={handleChange} type="date" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all font-medium" />
                </div>
                <div className="md:col-span-2">
                   <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Manufacturer Node</label>
                  <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} type="text" className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="Pharma Global Coruscant" />
                </div>
              </div>

              <div className="pt-8 flex justify-end gap-5 border-t border-gray-100/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-white border border-gray-100 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-50 transition-all active:scale-95">Abort Mission</button>
                <button type="submit" className="min-w-[200px] px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">{editingItem ? 'Synchronize Record' : 'Provision Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
