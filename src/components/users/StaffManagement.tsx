'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit2, RotateCcw, 
  Power, Trash2, X, AlertCircle, Phone, Mail, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', role: 'Nurse', isActive: true 
  });

  const roles = ['Nurse', 'Lab Scientist', 'Pharmacist', 'Radiologist', 'Receptionist'];

  useEffect(() => {
    fetchAllStaff();
  }, []);

  const fetchAllStaff = async () => {
    setLoading(true);
    try {
      const promises = roles.map(role => usersAPI.getUsersByRole(role).then((res: any) => res.data || []).catch(() => []));
      const results = await Promise.all(promises);
      const combined = results.flat();
      setStaffList(combined);
    } catch {
      toast.error('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await usersAPI.updateUser(editingStaff._id, formData);
        toast.success('Staff updated successfully');
      } else {
        await usersAPI.createUser(formData);
        toast.success(`${formData.role} created successfully. Password: hms@${formData.role.toLowerCase().replace(' ', '')}`);
      }
      fetchAllStaff();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, role: string) => {
    try {
      await usersAPI.toggleStatus(id);
      toast.success(`${role} ${currentStatus ? 'suspended' : 'activated'} successfully`);
      fetchAllStaff();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (id: string, role: string) => {
    const pw = `hms@${role.toLowerCase().replace(' ', '')}`;
    if (!confirm(`Reset password to ${pw}?`)) return;
    try {
      await usersAPI.resetPassword(id);
      toast.success(`Password reset to: ${pw}`);
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await usersAPI.deleteUser(id);
      toast.success('Staff deleted successfully');
      fetchAllStaff();
    } catch {
      toast.error('Failed to delete staff');
    }
  };

  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    setFormData({ 
      name: staff.name, 
      email: staff.email, 
      phone: staff.phone || '',
      role: staff.role,
      isActive: staff.isActive 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({ name: '', email: '', phone: '', role: 'Nurse', isActive: true });
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Staff</h1>
          <p className="text-gray-500 text-sm">Manage auxiliary clinical and administrative staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
          />
        </div>
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
        >
          <option value="All">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Staff Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-16 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold text-sm tracking-widest">
                    No staff members found
                  </td>
                </tr>
              ) : filteredStaff.map((staff) => (
                <tr key={staff._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                        {staff.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{staff.name}</p>
                        <p className="text-xs text-gray-400">ID: #{staff._id.slice(-5)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary-50 text-primary-700">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 space-y-1 font-medium">
                      <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400"/> {staff.email}</div>
                      <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400"/> {staff.phone || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      staff.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {staff.isActive ? 'Active' : 'Suspended'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(staff)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleResetPassword(staff._id, staff.role)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Reset Password"><RotateCcw className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleStatus(staff._id, staff.isActive, staff.role)} className={cn("p-2 rounded-lg transition-colors", staff.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50")}><Power className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(staff._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Phone</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input w-full mt-1" />
                </div>
                {!editingStaff && (
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Assign Role</label>
                    <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="input w-full mt-1">
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-6">
                <div>
                  <p className="text-sm font-bold text-gray-900">Account Status</p>
                  <p className="text-xs text-gray-500">{formData.isActive ? 'Active and allowed to login' : 'Suspended'}</p>
                </div>
                <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={cn("relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", formData.isActive ? "bg-emerald-500" : "bg-gray-200")}>
                  <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out", formData.isActive ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>

              {!editingStaff && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 mt-4 text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">
                    New accounts receive a default password based on their role (e.g., <span className="font-bold border-b border-amber-800">hms@nurse</span>). They will be prompted to change it upon first login.
                  </p>
                </div>
              )}

              <div className="mt-8">
                <button type="submit" className="w-full py-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all">
                  {editingStaff ? 'Save Changes' : `Create ${formData.role} Account`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
