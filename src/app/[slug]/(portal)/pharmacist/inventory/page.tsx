'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pharmacyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Package, Plus, Search, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PharmacyInventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
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
    status: 'In Stock'
  });

  useEffect(() => {
    fetchInventory();
  }, [searchTerm]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response: any = await pharmacyAPI.getInventory({ search: searchTerm });
      setItems(response.data || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        toast.success('Item updated');
      } else {
        await pharmacyAPI.createInventoryItem(payload);
        toast.success('Item added');
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" /> Pharmacy Inventory
          </h1>
          <p className="text-gray-500 mt-1">Manage medicines and consumables stock</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 py-2.5 px-6 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 font-semibold text-gray-500">Item Name</th>
                  <th className="py-3 px-4 font-semibold text-gray-500">Category</th>
                  <th className="py-3 px-4 font-semibold text-gray-500 text-right">Qty</th>
                  <th className="py-3 px-4 font-semibold text-gray-500 text-right">Unit Price</th>
                  <th className="py-3 px-4 font-semibold text-gray-500">Expiry</th>
                  <th className="py-3 px-4 font-semibold text-gray-500">Status</th>
                  <th className="py-3 px-4 font-semibold text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.item_name}</td>
                    <td className="py-3 px-4 text-gray-500">{item.category || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-700">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">₦{parseInt(item.unit_price).toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-500">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4">
                      {item.status === 'In Stock' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 className="w-3 h-3"/> In Stock</span>}
                      {item.status === 'Low Stock' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><AlertTriangle className="w-3 h-3"/> Low Stock</span>}
                      {item.status === 'Out of Stock' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100"><AlertTriangle className="w-3 h-3"/> Out of Stock</span>}
                      {item.status === 'Expired' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Expired</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Inventory Item' : 'Add New Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="md:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">Item Name *</label>
                  <input required name="item_name" value={formData.item_name} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Category</label>
                  <input name="category" value={formData.category} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" placeholder="e.g. Antibiotics" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Unit</label>
                  <input name="unit" value={formData.unit} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" placeholder="e.g. Tablets, ml, Ampoule" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Quantity *</label>
                  <input required name="quantity" value={formData.quantity} onChange={handleChange} type="number" min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Unit Price ($) *</label>
                  <input required name="unit_price" value={formData.unit_price} onChange={handleChange} type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input name="reorder_level" value={formData.reorder_level} onChange={handleChange} type="number" min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input name="expiry_date" value={formData.expiry_date} onChange={handleChange} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Batch Number</label>
                  <input name="batch_number" value={formData.batch_number} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">{editingItem ? 'Save Changes' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
