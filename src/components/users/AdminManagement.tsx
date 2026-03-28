'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCog, Plus, Search, Edit2, RotateCcw, 
  Power, Trash2, X, Download, Loader2, 
  User, Briefcase, Shield, Calendar, Mail, Phone,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminManagement() {
  const { user: currentUser, updateUser } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', 
    isActive: true 
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUsersByRole('Admin') as any;
      setAdmins(res.data || []);
    } catch {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await usersAPI.updateUser(editingAdmin._id, formData);
        toast.success('Admin updated successfully');
        
        // Sync if updating own profile
        if (editingAdmin._id === currentUser?.id) {
          updateUser({ name: formData.name, email: formData.email, phone: formData.phone });
        }
      } else {
        await usersAPI.createUser({ ...formData, role: 'Admin' });
        toast.success('Admin created successfully with password: hms@admin');
      }
      fetchAdmins();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await usersAPI.toggleStatus(id);
      toast.success(`Admin ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      
      // Sync if toggling own status (though admin shouldn't be able to deactivate self, API check)
      if (id === currentUser?.id) {
        updateUser({ isActive: !currentStatus } as any);
      }
      
      fetchAdmins();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Reset password to hms@admin?')) return;
    try {
      await usersAPI.resetPassword(id);
      toast.success('Password reset to: hms@admin');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      await usersAPI.deleteUser(id);
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch {
      toast.error('Failed to delete admin');
    }
  };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({ 
      name: admin.name, 
      email: admin.email, 
      phone: admin.phone || '',
      isActive: admin.isActive 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ name: '', email: '', phone: '', isActive: true });
  };

  const handleViewDetail = async (admin: any) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await usersAPI.getFullProfile(admin._id) as any;
      setDetailData(res.data);
    } catch {
      toast.error('Failed to fetch admin details');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-500 text-sm">Manage administrative users and their platform access.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name, email, or phone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-6 h-20 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">
                    No admins found
                  </td>
                </tr>
              ) : filteredAdmins.map((admin) => (
                <tr key={admin._id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => handleViewDetail(admin)}
                      className="flex items-center gap-3 text-left group/name"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-100/50 flex items-center justify-center">
                        <span className="text-primary-600 font-black text-xs">{admin.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover/name:text-primary-600 transition-colors">{admin.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">UID: #{admin._id.slice(-6)}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {admin.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {admin.phone || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                      admin.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {admin.isActive ? 'Active' : 'Locked'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleEdit(admin)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(admin._id)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Reset Password">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(admin._id, admin.isActive)} className={cn("p-2 rounded-xl transition-all", admin.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50")} title={admin.isActive ? "Suspend" : "Activate"}>
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(admin._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input py-3" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input py-3" placeholder="admin@hospital.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input py-3" placeholder="+91 00000 00000" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900">Access Control</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {formData.isActive ? 'Full Permissions' : 'Access Restricted'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formData.isActive ? "bg-indigo-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    formData.isActive ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
              {!editingAdmin && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-bold">
                  System default password: <span className="font-black text-amber-900 ml-1">hms@admin</span>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200 hover:bg-black">{editingAdmin ? 'Update Admin' : 'Add Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between font-bold">
              Admin Details
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-3xl bg-primary-100 flex items-center justify-center shadow-lg">
                  {detailData.adminProfile?.profilePhoto ? (
                    <img src={detailData.adminProfile.profilePhoto} className="w-full h-full object-cover rounded-3xl" />
                  ) : (
                    <Shield className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{detailData.name}</h2>
                  <p className="text-gray-500 font-medium">Administrator</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-900">{detailData.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold text-gray-900">{detailData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Onboarding Date</p>
                  <p className="text-sm font-bold text-gray-900">{detailData.adminProfile?.joiningDate ? new Date(detailData.adminProfile.joiningDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-bold text-emerald-600">{detailData.isActive ? 'Active' : 'Locked'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
