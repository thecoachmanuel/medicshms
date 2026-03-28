'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Power, X, Eye, Phone, Mail, 
  Upload, Loader2, Download, Search, CheckCircle2, AlertCircle, Stethoscope
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { departmentAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultConsultationFee: 0,
    contact: {
      phone: '',
      email: '',
      location: ''
    }
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await departmentAPI.getAdminAll() as any;
      setDepartments(res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      description: '',
      defaultConsultationFee: 0,
      contact: { phone: '', email: '', location: '' }
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (dept: any) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      defaultConsultationFee: dept.defaultConsultationFee || 0,
      contact: dept.contact || { phone: '', email: '', location: '' }
    });
    setImagePreview(dept.imageUrl || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('defaultConsultationFee', formData.defaultConsultationFee.toString());
      data.append('contact', JSON.stringify(formData.contact));
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingDepartment) {
        await departmentAPI.update(editingDepartment._id, data);
        toast.success('Department updated successfully');
      } else {
        await departmentAPI.create(data);
        toast.success('Department created successfully');
      }
      fetchDepartments();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await departmentAPI.toggleStatus(id);
      toast.success('Status updated');
      fetchDepartments();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await departmentAPI.delete(id);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (error: any) {
      toast.error('Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage medical departments and services.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-64"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))
        ) : filteredDepartments.map((dept) => (
          <div key={dept._id} className="card group overflow-hidden flex flex-col">
            <div className="aspect-video relative overflow-hidden bg-gray-100">
              {dept.imageUrl ? (
                <img src={dept.imageUrl} alt={dept.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-50">
                  <Building2 className="w-12 h-12 text-primary-200" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => handleEdit(dept)} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => handleDelete(dept._id)} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur shadow-sm",
                  dept.isActive ? "bg-emerald-500/90 text-white" : "bg-gray-500/90 text-white"
                )}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">{dept.name}</h3>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fee</p>
                  <p className="font-bold text-primary-600">₦{dept.defaultConsultationFee}</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">{dept.description || 'No description provided.'}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Doctors</p>
                    <p className="text-xs font-bold text-gray-700">{dept.doctorCount || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Power className={cn("w-4 h-4", dept.isActive ? "text-emerald-500" : "text-gray-400")} />
                  </div>
                  <button 
                    onClick={() => handleToggleStatus(dept._id)}
                    className="text-left"
                  >
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{dept.isActive ? 'Deactivate' : 'Activate'}</p>
                    <p className="text-xs font-bold text-gray-700">Quick Toggle</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingDepartment ? 'Edit Department' : 'Create Department'}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Department Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full" 
                    placeholder="e.g. Cardiology" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full" 
                    placeholder="Brief overview of the department..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Consultation Fee (₦)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.defaultConsultationFee || ''}
                    onChange={(e) => setFormData({ ...formData, defaultConsultationFee: parseInt(e.target.value) || 0 })}
                    className="input w-full" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contact Phone</label>
                  <input 
                    type="text" 
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                    className="input w-full" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Department Image</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-3 font-medium">Upload a profile image for this department. Max 5MB. PNG, JPG.</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[120px]">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingDepartment ? 'Save Changes' : 'Create Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
