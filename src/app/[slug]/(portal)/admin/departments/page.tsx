'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Power, X, Eye, Phone, Mail, 
  Upload, Loader2, Download, Search, CheckCircle2, AlertCircle, Stethoscope,
  MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { departmentAPI } from '@/lib/api';
import { Department } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
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
      const res = await departmentAPI.getAdminAll();
      setDepartments(res.data.data || []);
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

  const handleEdit = (dept: Department) => {
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
    if (!confirm('Are you sure you want to delete this department?')) return;
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-600" />
            Medical Departments
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Architect your hospital's clinical units and operational nodes.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search clinical units..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl text-sm focus:ring-8 focus:ring-primary-500/5 outline-none w-72 transition-all shadow-sm font-medium placeholder:text-gray-400"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="group flex items-center gap-2.5 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-gray-900/10 active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            Define Unit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-50/50 backdrop-blur rounded-[2.5rem] animate-pulse border border-white/50"></div>
          ))
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full py-32 text-center">
            <Building2 className="w-20 h-20 mx-auto text-gray-100 mb-6" />
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-sm">No clinical units defined in system</p>
          </div>
        ) : filteredDepartments.map((dept) => (
          <div key={dept._id} className="group relative bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="aspect-[16/10] relative overflow-hidden">
              {dept.imageUrl ? (
                <img src={dept.imageUrl} alt={dept.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
                  <Building2 className="w-16 h-16 text-primary-200 group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                <button onClick={() => handleEdit(dept)} className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl hover:bg-white text-gray-700 hover:text-primary-600 active:scale-90 transition-all">
                  <Edit2 className="w-4.5 h-4.5" />
                </button>
                <button onClick={() => handleDelete(dept._id)} className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl hover:bg-white text-gray-700 hover:text-rose-600 active:scale-90 transition-all">
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="absolute bottom-4 left-4">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md shadow-lg border border-white/20",
                  dept.isActive ? "bg-emerald-500/80 text-white" : "bg-gray-500/80 text-white"
                )}>
                  {dept.isActive ? 'Operational' : 'Off-Line'}
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-xl tracking-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">{dept.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-gray-400 font-black text-[10px] uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    {dept.contact?.location || 'Main Medical Complex'}
                  </div>
                </div>
                <div className="text-right shrink-0 bg-primary-50 px-4 py-2 rounded-2xl border border-primary-100/50">
                  <p className="text-[9px] text-primary-400 font-black uppercase tracking-widest leading-none mb-1">Base Fee</p>
                  <p className="font-black text-primary-600 tracking-tight text-lg">₦{dept.defaultConsultationFee.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-3 mb-8 font-medium">
                {dept.description || 'No departmental clinical overview provided in system architecture.'}
              </p>
              
              <div className="mt-auto pt-6 border-t border-gray-100/50 grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
                    <Stethoscope className="w-4.5 h-4.5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.15em]">Staffing</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight">{dept.doctorCount || 0} Physicians</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner transition-all",
                    dept.isActive ? "bg-emerald-50 border-emerald-100/50" : "bg-gray-100 border-gray-200"
                  )}>
                    <Power className={cn("w-4.5 h-4.5", dept.isActive ? "text-emerald-500" : "text-gray-400")} />
                  </div>
                  <button 
                    onClick={() => handleToggleStatus(dept._id)}
                    className="text-left group/toggle active:scale-95 transition-transform"
                  >
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.15em] group-hover/toggle:text-primary-500">System Link</p>
                    <p className="text-sm font-black text-gray-900 underline decoration-gray-200 group-hover/toggle:decoration-primary-500 transition-all">{dept.isActive ? 'Terminate' : 'Re-Link'}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={handleCloseModal}></div>
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/60">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-blue-500 to-primary-500" />
            
            <div className="px-12 py-10 border-b border-gray-100/50 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{editingDepartment ? 'Unit Configuration' : 'Node Initialization'}</h2>
                <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-1">Clinical Department Architecture</p>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-4 bg-gray-50/50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-[1.5rem] transition-all duration-300 active:scale-95"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-12 py-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Clinical Designation</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-3xl text-sm focus:ring-[8px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-bold tracking-tight" 
                    placeholder="e.g. Oncology & Radiobiology" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Functional Overview</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-[2rem] text-sm focus:ring-[8px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium leading-relaxed" 
                    placeholder="Describe the department's primary clinical focus and specialized services..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Entry Consultation Fee (₦)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.defaultConsultationFee || ''}
                    onChange={(e) => setFormData({ ...formData, defaultConsultationFee: parseInt(e.target.value) || 0 })}
                    className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[8px] focus:ring-primary-500/10 outline-none transition-all font-black text-primary-600" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Direct Dial Identity</label>
                  <input 
                    type="text" 
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                    className="w-full mt-3 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[8px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" 
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Visual representation (Uplink)</label>
                  <div className="flex items-center gap-10 mt-4 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                    <div className="w-36 h-36 rounded-[2.5rem] bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                           <Upload className="w-10 h-10 text-gray-200" />
                           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No Uplink</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Required: High-fidelity clinical imagery. Formats: RAW, HEIC, PNG (Max 8MB). Recommended aspect: Ultra-wide clinical focus.</p>
                      <label className="inline-flex items-center gap-2.5 px-6 py-3 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer shadow-sm active:scale-95 transition-all">
                        <Upload className="w-4 h-4" />
                        Select Satellite Image
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              setImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 flex items-center justify-end gap-5">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-8 py-5 bg-white border border-gray-100 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Terminate
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="min-w-[200px] px-8 py-5 bg-gray-900 hover:bg-black text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-gray-900/10 active:scale-95 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingDepartment ? 'Commit Changes' : 'Initialize Unit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
