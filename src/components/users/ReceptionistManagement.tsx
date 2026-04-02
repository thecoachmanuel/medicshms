'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCog, Plus, Search, Edit2, RotateCcw, 
  Power, Trash2, X, Download, Loader2, 
  User as UserIcon, Briefcase, Shield, Calendar, Mail, Phone,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ReceptionistManagement() {
  const { user: currentUser, updateUser } = useAuth();
  const [receptionists, setReceptionists] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReceptionist, setEditingReceptionist] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', 
    isActive: true 
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUsersByRole('Receptionist');
      setReceptionists(res.data.data || []);
    } catch {
      toast.error('Failed to fetch receptionists');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReceptionist) {
        await usersAPI.updateUser(editingReceptionist._id, formData);
        toast.success('Receptionist updated successfully');
        
        if (editingReceptionist._id === currentUser?.id) {
          updateUser({ name: formData.name, email: formData.email, phone: formData.phone });
        }
      } else {
        await usersAPI.createUser({ ...formData, role: 'Receptionist' });
        toast.success('Receptionist created successfully with password: hms@receptionist');
      }
      fetchReceptionists();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await usersAPI.toggleStatus(id);
      toast.success(`Receptionist ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      
      if (id === currentUser?.id) {
        updateUser({ isActive: !currentStatus } as any);
      }
      
      fetchReceptionists();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Reset password to hms@receptionist?')) return;
    try {
      await usersAPI.resetPassword(id);
      toast.success('Password reset to: hms@receptionist');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receptionist?')) return;
    try {
      await usersAPI.deleteUser(id);
      toast.success('Receptionist deleted successfully');
      fetchReceptionists();
    } catch {
      toast.error('Failed to delete receptionist');
    }
  };

  const handleEdit = (receptionist: User) => {
    setEditingReceptionist(receptionist);
    setFormData({ 
      name: receptionist.name, 
      email: receptionist.email, 
      phone: receptionist.phone || '',
      isActive: receptionist.isActive 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReceptionist(null);
    setFormData({ name: '', email: '', phone: '', isActive: true });
  };

  const handleViewDetail = async (receptionist: User) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await usersAPI.getProfile(receptionist._id);
      setDetailData(res.data.data);
    } catch {
      toast.error('Failed to fetch receptionist details');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredReceptionists = receptionists.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.phone && r.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            Front Office Management
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Coordinate administrative staff, shifts and operational access levels.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-2.5 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-gray-900/10 active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          Add Receptionist
        </button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search by name, email, or contact identity..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4.5 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl text-sm focus:ring-8 focus:ring-primary-500/5 outline-none transition-all shadow-sm font-medium placeholder:text-gray-400"
        />
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-sm border border-white/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/30 border-b border-gray-100/50">
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Office Personnel</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Contact Channel</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Assigned Shift</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Access Policy</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] text-center">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-10 py-10 h-24 bg-gray-50/10"></td>
                  </tr>
                ))
              ) : filteredReceptionists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-4">
                      <UserIcon className="w-16 h-16 opacity-10" />
                      <p className="font-bold text-sm uppercase tracking-widest">No staffing records detected</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReceptionists.map((staff) => (
                <tr key={staff._id} className="group hover:bg-gray-50/40 transition-all duration-300">
                  <td className="px-10 py-6">
                    <button 
                      onClick={() => handleViewDetail(staff)}
                      className="flex items-center gap-5 text-left group/id"
                    >
                      <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-primary-50 to-amber-50 border border-primary-100/30 flex items-center justify-center shadow-sm group-hover/id:scale-110 transition-transform duration-500">
                        <span className="text-primary-700 font-black text-base">{staff.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors tracking-tight">{staff.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">ID: #{staff._id.slice(-8)}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                        <div className="w-6 h-6 rounded-lg bg-gray-50/50 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {staff.email}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                        <div className="w-6 h-6 rounded-lg bg-gray-50/50 flex items-center justify-center">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {staff.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {staff.receptionistInfo?.shift ? (
                      <span className="inline-flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                         <Calendar className="w-3 h-3 mr-2" />
                        {staff.receptionistInfo.shift}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">Rolling Shift</span>
                    )}
                  </td>
                  <td className="px-10 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-500",
                      staff.isActive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", staff.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                      {staff.isActive ? 'Authorized' : 'Restricted'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center gap-2.5">
                       <button onClick={() => handleEdit(staff)} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all active:scale-90" title="Edit Properties">
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleResetPassword(staff._id)} className="p-3 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all active:scale-90" title="Rotate Credentials">
                        <RotateCcw className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleToggleStatus(staff._id, staff.isActive)} className={cn("p-3 rounded-2xl transition-all active:scale-90 shadow-sm border border-transparent", staff.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100")} title={staff.isActive ? "Terminate Uplink" : "Restore Access"}>
                        <Power className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleDelete(staff._id)} className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90" title="Purge Record">
                        <Trash2 className="w-4.5 h-4.5" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={handleCloseModal}></div>
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] max-w-xl w-full p-12 border border-white/60 overflow-hidden ring-1 ring-black/5">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-amber-500 to-primary-500" />
            
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {editingReceptionist ? 'Staff Modification' : 'Officer Onboarding'}
                </h2>
                <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Administrative Node Provisioning</p>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="p-4 bg-gray-50/50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-[1.5rem] transition-all duration-300 active:scale-95"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Designated Username</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-2 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="Jane Doe" />
              </div>

               <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Clinical Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-2 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="staff@medics.com" />
                </div>
                <div>
                   <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Direct Uplink</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-2 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="+00 000 000" />
                </div>
              </div>

              <div className="flex items-center justify-between p-8 bg-amber-50/20 rounded-[2.5rem] border border-amber-100/30">
                <div className="space-y-1">
                  <p className="text-base font-bold text-gray-900">Access Authorization</p>
                  <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", formData.isActive ? "text-amber-600" : "text-rose-500")}>
                    {formData.isActive ? 'Active Node' : 'Restricted Uplink'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={cn(
                    "relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formData.isActive ? "bg-amber-500" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-xl ring-0 transition duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    formData.isActive ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              {!editingReceptionist && (
                <div className="p-6 bg-amber-50/40 border border-amber-100/30 rounded-[2rem] text-[13px] text-amber-800 font-bold flex items-center gap-5 shadow-sm shadow-amber-900/5">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-100/50">
                    <Shield className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="leading-relaxed">
                    Standard provisioning key generated: <span className="font-black underline decoration-2 decoration-amber-500 underline-offset-4">hms@receptionist</span>
                  </p>
                </div>
              )}

              <div className="flex gap-5 pt-8">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-8 py-5 bg-white border border-gray-100 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-50 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 px-8 py-5 bg-gray-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-gray-900/10 hover:bg-black transition-all active:scale-95">{editingReceptionist ? 'Sync Profile' : 'Authorize Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white/95 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/60">
             <div className="px-12 py-8 border-b border-gray-100/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Personnel Dossier</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Verified Front Office Identity</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-4 hover:bg-gray-50 rounded-2xl transition-all active:scale-90">
                <X className="w-7 h-7 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar focus:outline-none">
               <div className="flex flex-col md:flex-row gap-16 items-start">
                  <div className="w-48 h-48 rounded-[3.5rem] bg-gradient-to-br from-amber-50 to-orange-50 border-8 border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-500">
                    {detailData.receptionistProfile?.profilePhoto ? (
                      <img src={detailData.receptionistProfile.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16 text-amber-200" />
                    )}
                  </div>
                  <div className="flex-1 space-y-12 w-full">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-gray-100/50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Operational Shift</p>
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">{detailData.receptionistProfile?.shift || 'Flexible'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Entry Date</p>
                        <p className="text-sm font-bold text-gray-900">{detailData.receptionistProfile?.joiningDate ? new Date(detailData.receptionistProfile.joiningDate).toLocaleDateString() : 'Active'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Seniority</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{detailData.receptionistProfile?.experience ? `${detailData.receptionistProfile.experience}Y` : 'Trainee'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Credential Level</p>
                        <p className="text-sm font-bold text-gray-900">{detailData.receptionistProfile?.educationLevel || 'Graduate'}</p>
                      </div>
                    </div>

                    <div className="space-y-8 bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-amber-500 rounded-full" />
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Identity Verification</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                         <div className="space-y-6">
                           <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 shadow-sm">
                               <Shield className="w-6 h-6 text-primary-500" />
                             </div>
                             <div>
                               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1.5">{detailData.receptionistProfile?.idProofType || 'Proof Identifier'}</p>
                               <p className="text-base font-black text-gray-900 tracking-tight">{detailData.receptionistProfile?.idProofNumber || 'VERIFIED_USER'}</p>
                             </div>
                           </div>
                         </div>
                         <div className="relative group">
                           {detailData.receptionistProfile?.idProofDocument ? (
                             <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-200 aspect-video shadow-xl">
                               <img src={detailData.receptionistProfile.idProofDocument} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                 <Download className="w-8 h-8 text-white animate-bounce" />
                               </div>
                             </div>
                           ) : (
                             <div className="w-full aspect-video bg-white/50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3">
                               <AlertCircle className="w-8 h-8 text-gray-200" />
                               <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Document Pending</span>
                             </div>
                           )}
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span className="text-[11px] font-black uppercase tracking-widest tracking-widest">Enrolled since {new Date(detailData.createdAt).toLocaleDateString()}</span>
                      </div>
                      {detailData.receptionistProfile?.digitalSignature && (
                        <div className="flex flex-col items-end gap-3 text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Operational Stamp</p>
                          <img src={detailData.receptionistProfile.digitalSignature} alt="" className="h-16 w-auto grayscale opacity-40 hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
