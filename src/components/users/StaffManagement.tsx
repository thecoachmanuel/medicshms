'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit2, RotateCcw, 
  Power, Trash2, X, AlertCircle, Phone, Mail, CheckCircle2, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersAPI, departmentAPI } from '@/lib/api';
import { User, Department } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', role: 'Nurse' as User['role'], departmentId: '', isActive: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles: User['role'][] = ['Nurse', 'Lab Scientist', 'Pharmacist', 'Radiologist', 'Receptionist'];

  useEffect(() => {
    fetchDepartments();
    fetchAllStaff();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAdminAll();
      if (res.data) setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchAllStaff = async () => {
    setLoading(true);
    try {
      const promises = roles.map(role => 
        usersAPI.getUsersByRole(role)
          .then((res) => res.data || [])
          .catch(() => [])
      );
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
    setIsSubmitting(true);
    try {
      if (editingStaff) {
        await usersAPI.updateUser(editingStaff._id, formData);
        toast.success('Staff updated successfully');
      } else {
        await usersAPI.createUser(formData);
        const pw = formData.role === 'Lab Scientist' ? 'lab' : 
                   formData.role === 'Pharmacist' ? 'pharmacy' : 
                   formData.role === 'Radiologist' ? 'radiology' : 
                   formData.role.toLowerCase().replace(' ', '');
        toast.success(`${formData.role} provisioned successfully. Default Credentials: hms@${pw}`);
      }
      fetchAllStaff();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
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
      departmentId: staff.departmentId || '',
      isActive: staff.isActive 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({ name: '', email: '', phone: '', role: 'Nurse', departmentId: '', isActive: true });
  };

  const filteredStaff = staffList.filter(s => {
    const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    const matchesRole = filterRole === 'All' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hospital Staff</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Manage auxiliary clinical and administrative nodes.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="group flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> 
          Add Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-5 bg-white/70 backdrop-blur-xl p-5 rounded-[2rem] shadow-sm border border-white/50">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-400 font-medium"
          />
        </div>
        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all min-w-[220px] appearance-none cursor-pointer"
        >
          <option value="All">All Departments</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30 border-b border-gray-100/50">
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Identity</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Job Role</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Unit/Department</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Connectivity</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Status</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-10 py-10 h-24 bg-gray-50/10"></td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">No active staff records found</p>
                  </td>
                </tr>
              ) : filteredStaff.map((staff) => (
                <tr key={staff._id} className="group hover:bg-gray-50/40 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 text-emerald-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform duration-500">
                        {staff.name[0]}
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors tracking-tight">{staff.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">ID: #{staff._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 text-gray-600 shadow-sm group-hover:border-emerald-200 group-hover:text-emerald-700 transition-colors">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      {staff.department || 'General'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="text-xs text-gray-600 space-y-2 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-gray-400"/>
                        </div>
                        {staff.email}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Phone className="w-3.5 h-3.5 text-gray-400"/>
                        </div>
                        {staff.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500",
                      staff.isActive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full animate-ping", staff.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                      {staff.isActive ? 'Online' : 'Suspended'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-end gap-2.5">
                      <button onClick={() => handleEdit(staff)} className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all active:scale-90" title="Edit Properties"><Edit2 className="w-4.5 h-4.5" /></button>
                      <button onClick={() => handleResetPassword(staff._id, staff.role)} className="p-3 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all active:scale-90" title="Reset Credentials"><RotateCcw className="w-4.5 h-4.5" /></button>
                      <button onClick={() => handleToggleStatus(staff._id, staff.isActive, staff.role)} className={cn("p-3 rounded-2xl transition-all active:scale-90", staff.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50")} title={staff.isActive ? "Disable Uplink" : "Restore Uplink"}><Power className="w-4.5 h-4.5" /></button>
                      <button onClick={() => handleDelete(staff._id)} className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90" title="Purge Record"><Trash2 className="w-4.5 h-4.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={handleCloseModal}></div>
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] max-w-2xl w-full p-6 sm:p-12 border border-white/60 overflow-hidden ring-1 ring-black/5 max-h-[96vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
            
            <div className="flex justify-between items-start mb-8 sm:mb-12">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight truncate">
                  {editingStaff ? 'Identity Editor' : 'System Provisioning'}
                </h2>
                <p className="text-gray-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] mt-2 truncate">Node Credential Management</p>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-2 sm:p-4 bg-gray-50/50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl sm:rounded-[1.5rem] transition-all duration-300 active:scale-95 shrink-0 ml-2"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="sm:col-span-2">
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-2 sm:mt-3 px-6 py-4 sm:py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">E-Mail</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-2 sm:mt-3 px-6 py-4 sm:py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="jane@hospital.com" />
                </div>
                <div>
                  <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-2 sm:mt-3 px-6 py-4 sm:py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="+234 810 123 4567" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 sm:col-span-2">
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Professional Role</label>
                    <div className="relative mt-2 sm:mt-3">
                      <select 
                        disabled={!!editingStaff}
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value as User['role']})} 
                        className="w-full appearance-none px-6 py-4 sm:py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Clinical Unit</label>
                    <div className="relative mt-2 sm:mt-3">
                      <select 
                        required 
                        value={formData.departmentId} 
                        onChange={e => setFormData({...formData, departmentId: e.target.value})} 
                        className="w-full appearance-none px-6 py-4 sm:py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-[6px] focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                      >
                        <option value="">Select Unit</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 bg-emerald-50/20 rounded-2xl sm:rounded-[2.5rem] border border-emerald-100/30 gap-4">
                <div className="space-y-1 w-full sm:w-auto">
                  <p className="text-base font-bold text-gray-900">System Integration Status</p>
                  <p className={cn("text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]", formData.isActive ? "text-emerald-600" : "text-rose-500")}>
                    {formData.isActive ? 'Synchronized and Active' : 'Uplink Terminated'}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})} 
                  className={cn(
                    "relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-auto sm:ml-0",
                    formData.isActive ? "bg-emerald-500" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-7 w-7 transform rounded-full bg-white shadow-xl ring-0 transition duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    formData.isActive ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              {!editingStaff && (
                <div className="p-4 sm:p-6 bg-amber-50/30 border border-amber-100/50 rounded-2xl sm:rounded-[2rem] flex items-start gap-4 sm:gap-5 text-amber-900 shadow-sm shadow-amber-900/5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] mb-1.5 text-amber-700">Security Requirement</p>
                    <p className="text-xs sm:text-[13px] font-medium leading-relaxed opacity-80 break-words">
                      Standard initialization key generated: <span className="font-black underline decoration-2 decoration-amber-500 underline-offset-4">
                        hms@{
                          formData.role === 'Lab Scientist' ? 'lab' : 
                          formData.role === 'Pharmacist' ? 'pharmacy' : 
                          formData.role === 'Radiologist' ? 'radiology' : 
                          formData.role.toLowerCase().replace(' ', '')
                        }
                      </span>. Cipher rotation mandatory on primary uplink.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 sm:pt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-[1.75rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    editingStaff ? 'Synchronize Record' : `Initialize ${formData.role}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
