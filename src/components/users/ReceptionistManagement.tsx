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

export default function ReceptionistManagement() {
  const { user: currentUser, updateUser } = useAuth();
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReceptionist, setEditingReceptionist] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', 
    isActive: true 
  });
  const [downloading, setDownloading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUsersByRole('Receptionist') as any;
      setReceptionists(res.data || []);
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
        
        // Sync if updating own profile
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
      
      // Sync if toggling own status
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

  const handleEdit = (receptionist: any) => {
    setEditingReceptionist(receptionist);
    setFormData({ 
      name: receptionist.name, 
      email: receptionist.email, 
      phone: receptionist.phone,
      isActive: receptionist.isActive 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReceptionist(null);
    setFormData({ name: '', email: '', phone: '', isActive: true });
  };

  const handleViewDetail = async (receptionist: any) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await usersAPI.getProfile(receptionist._id) as any;
      setDetailData(res.data);
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
    r.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receptionist Management</h1>
          <p className="text-gray-500 text-sm">Manage administrative staff, shifts and operational access.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary shadow-lg shadow-primary-100"
          >
            <Plus className="w-4 h-4" />
            Add Receptionist
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
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Office Staff</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shift</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-20 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : filteredReceptionists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">
                    No records found
                  </td>
                </tr>
              ) : filteredReceptionists.map((staff) => (
                <tr key={staff._id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => handleViewDetail(staff)}
                      className="flex items-center gap-3 text-left group/name"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-100/50 flex items-center justify-center">
                        <span className="text-primary-600 font-black text-xs">{staff.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover/name:text-primary-600 transition-colors">{staff.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">UID: #{staff._id.slice(-6)}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {staff.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {staff.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {staff.receptionistInfo?.shift ? (
                      <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                        {staff.receptionistInfo.shift}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">TBD</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                      staff.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {staff.isActive ? 'Active' : 'Locked'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleEdit(staff)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(staff._id)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Reset Password">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(staff._id, staff.isActive)} className={cn("p-2 rounded-xl transition-all", staff.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50")} title={staff.isActive ? "Suspend" : "Activate"}>
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(staff._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingReceptionist ? 'Modify Staff Record' : 'Onboard Front Office'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input py-3" placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Work Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input py-3" placeholder="jane@hospital.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mobile Contact</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input py-3" placeholder="+91 00000 00000" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900">Account Status</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {formData.isActive ? 'Active / Multi-login' : 'Locked / Restricted'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formData.isActive ? "bg-primary-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    formData.isActive ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
              {!editingReceptionist && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-bold">
                  System default password: <span className="font-black text-amber-900 ml-1">hms@receptionist</span>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200 hover:bg-black">{editingReceptionist ? 'Update Staff' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Staff Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border-4 border-white shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {detailData.receptionistProfile?.profilePhoto ? (
                    <img src={detailData.receptionistProfile.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-200" />
                  )}
                </div>
                <div className="flex-1 space-y-8 w-full">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Shift Timing</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.receptionistProfile?.shift || 'Flexible'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Onboarding Date</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.receptionistProfile?.joiningDate ? new Date(detailData.receptionistProfile.joiningDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                     <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Staff Seniority</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.receptionistProfile?.experience ? `${detailData.receptionistProfile.experience} Years` : 'Trainee'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Education</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.receptionistProfile?.educationLevel || 'Graduate'}</p>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Verification & Docs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                           <div className="flex items-center gap-3">
                             <Shield className="w-5 h-5 text-primary-500" />
                             <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase">{detailData.receptionistProfile?.idProofType || 'Identity Proof'}</p>
                               <p className="text-xs font-bold text-gray-900">{detailData.receptionistProfile?.idProofNumber || 'VERIFIED_USER_01'}</p>
                             </div>
                           </div>
                         </div>
                       </div>
                       <div>
                         {detailData.receptionistProfile?.idProofDocument ? (
                           <div className="relative group">
                             <img src={detailData.receptionistProfile.idProofDocument} alt="" className="w-full h-32 object-cover rounded-2xl border border-gray-200" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl cursor-pointer">
                               <Download className="w-6 h-6 text-white" />
                             </div>
                           </div>
                         ) : (
                           <div className="w-full h-32 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                             <AlertCircle className="w-5 h-5 text-gray-300" />
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Document Pending</span>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-400">Created {new Date(detailData.createdAt).toLocaleDateString()}</span>
                    </div>
                    {detailData.receptionistProfile?.digitalSignature && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-300 uppercase mb-2">Signature Stamp</p>
                        <img src={detailData.receptionistProfile.digitalSignature} alt="" className="h-12 w-auto grayscale" />
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
