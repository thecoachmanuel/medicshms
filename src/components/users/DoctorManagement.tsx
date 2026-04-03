'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCog, Plus, Search, Edit2, RotateCcw, 
  Power, Trash2, X, Download, Loader2, 
  User as UserIcon, Stethoscope, Globe, Star, Mail, Phone,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersAPI, departmentsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User, Department } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorManagement() {
  const { user: currentUser, updateUser } = useAuth();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', 
    departmentId: '', isActive: true 
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.getAdminAll();
      setDepartments(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch departments:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch departments');
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUsersByRole('Doctor');
      setDoctors(res.data || []);
    } catch {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await usersAPI.updateUser(editingDoctor._id, formData);
        toast.success('Doctor updated successfully');
        
        if (editingDoctor._id === currentUser?.id) {
          updateUser({ name: formData.name, email: formData.email, phone: formData.phone });
        }
      } else {
        await usersAPI.createUser({ ...formData, role: 'Doctor' });
        toast.success('Doctor created successfully with password: hms@doctor');
      }
      fetchDoctors();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await usersAPI.toggleStatus(id);
      toast.success(`Doctor ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      
      if (id === currentUser?.id) {
        updateUser({ isActive: !currentStatus } as any);
      }
      
      fetchDoctors();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm('Reset password to hms@doctor?')) return;
    try {
      await usersAPI.resetPassword(id);
      toast.success('Password reset to: hms@doctor');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await usersAPI.deleteUser(id);
      toast.success('Doctor deleted successfully');
      fetchDoctors();
    } catch {
      toast.error('Failed to delete doctor');
    }
  };

  const handleEdit = (doctor: User) => {
    setEditingDoctor(doctor);
    setFormData({ 
      name: doctor.name, 
      email: doctor.email, 
      phone: doctor.phone || '',
      departmentId: doctor.doctorInfo?.departmentId || '',
      isActive: doctor.isActive 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setFormData({ name: '', email: '', phone: '', departmentId: '', isActive: true });
  };

  const handleViewDetail = async (doctor: User) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await usersAPI.getProfile(doctor._id);
      setDetailData(res.data);
    } catch {
      toast.error('Failed to fetch doctor details');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.phone && doctor.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-primary-600" />
            Physician Management
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Coordinate medical practitioners and clinical access levels.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-2.5 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-gray-900/10 active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          Onboard Doctor
        </button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Filter by name, email, or credentials..." 
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
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Practitioner Identity</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Connectivity</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Specialization</th>
                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">Authorization</th>
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
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-4">
                      <Stethoscope className="w-16 h-16 opacity-10" />
                      <p className="font-bold text-sm uppercase tracking-widest">No physician profiles found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.map((doctor) => (
                <tr key={doctor._id} className="group hover:bg-gray-50/40 transition-all duration-300">
                  <td className="px-10 py-6">
                    <button 
                      onClick={() => handleViewDetail(doctor)}
                      className="flex items-center gap-5 text-left group/id"
                    >
                      <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100/50 flex items-center justify-center shadow-sm group-hover/id:scale-110 transition-transform duration-500">
                        <span className="text-primary-700 font-black text-base">{doctor.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors tracking-tight">Dr. {doctor.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">NPI: #{doctor._id.slice(-8)}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                        <div className="w-6 h-6 rounded-lg bg-gray-50/50 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {doctor.email}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                        <div className="w-6 h-6 rounded-lg bg-gray-50/50 flex items-center justify-center">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {doctor.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {doctor.doctorInfo?.primaryDepartment ? (
                      <span className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-100/50 shadow-sm">
                        {doctor.doctorInfo.primaryDepartment.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">Unassigned Unit</span>
                    )}
                  </td>
                  <td className="px-10 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-500",
                      doctor.isActive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", doctor.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                      {doctor.isActive ? 'Authorized' : 'Suspended'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center gap-2.5">
                      <button onClick={() => handleEdit(doctor)} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all active:scale-90" title="Edit Profile">
                        <Edit2 className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleResetPassword(doctor._id)} className="p-3 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all active:scale-90" title="Reset Credentials">
                        <RotateCcw className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleToggleStatus(doctor._id, doctor.isActive)} className={cn("p-3 rounded-2xl transition-all active:scale-90 shadow-sm border border-transparent", doctor.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100")} title={doctor.isActive ? "Revoke Access" : "Grant Authorization"}>
                        <Power className="w-4.5 h-4.5" />
                      </button>
                      <button onClick={() => handleDelete(doctor._id)} className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90" title="Remove Profile">
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
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-blue-500 to-primary-500" />
            
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {editingDoctor ? 'Credential Editor' : 'Medical Onboarding'}
                </h2>
                <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Practitioner Uplink Configuration</p>
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
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Professional Designation</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-2 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="Dr. John Carter" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Clinical Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-2 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="doctor@medics.com" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Direct Uplink</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-2 px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" placeholder="+00 000 000" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] pl-1">Clinical Unit Assignment</label>
                <div className="relative mt-2">
                  <select 
                    required 
                    value={formData.departmentId} 
                    onChange={e => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full appearance-none px-6 py-4.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-[6px] focus:ring-primary-500/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Departmental Node</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-8 bg-primary-50/20 rounded-[2.5rem] border border-primary-100/30">
                <div className="space-y-1">
                  <p className="text-base font-bold text-gray-900">Clinical Authorization</p>
                  <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", formData.isActive ? "text-primary-600" : "text-rose-500")}>
                    {formData.isActive ? 'Authorized & Monitored' : 'Revoked / Off-Grid'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                  className={cn(
                    "relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formData.isActive ? "bg-primary-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-xl ring-0 transition duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    formData.isActive ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              {!editingDoctor && (
                <div className="p-6 bg-primary-50/40 border border-primary-100/30 rounded-[2rem] text-[13px] text-primary-700 font-bold flex items-center gap-4 shadow-sm shadow-primary-900/5">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-primary-100/50">
                    <Star className="w-6 h-6 text-primary-500" />
                  </div>
                  <p className="leading-relaxed">
                    Standard provisioning key generated: <span className="font-black underline decoration-2 decoration-primary-500 underline-offset-4">hms@doctor</span>
                  </p>
                </div>
              )}

              <div className="flex gap-5 pt-8">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-8 py-5 bg-white border border-gray-100 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-gray-50 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 px-8 py-5 bg-gray-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-gray-900/10 hover:bg-black transition-all active:scale-95">{editingDoctor ? 'Sync Profile' : 'Authorize User'}</button>
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
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Clinical Portfolio</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Verified Medical practitioner profile</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-4 hover:bg-gray-50 rounded-2xl transition-all active:scale-90">
                <X className="w-7 h-7 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar focus:outline-none">
              <div className="flex flex-col md:flex-row gap-16 items-start">
                <div className="w-48 h-48 rounded-[3.5rem] bg-gradient-to-br from-primary-50 to-blue-50 border-8 border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-500">
                  {detailData.doctorProfile?.profilePhoto ? (
                    <img src={detailData.doctorProfile.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-primary-200" />
                  )}
                </div>
                <div className="flex-1 space-y-12 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 pb-12 border-b border-gray-100/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Qualifications</p>
                      <p className="text-base font-bold text-gray-950">{detailData.doctorProfile?.qualifications || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Clinical Tenure</p>
                      <p className="text-base font-bold text-gray-950">{detailData.doctorProfile?.experience ? `${detailData.doctorProfile.experience} Seasons` : 'Residency'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Council ID</p>
                      <p className="text-base font-bold text-gray-950">{detailData.doctorProfile?.medicalCouncilId || 'VERIFIED'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-primary-500 rounded-full" />
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Professional Biography</h3>
                    </div>
                    <p className="text-[15px] text-gray-600 leading-[1.8] font-medium bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                      {detailData.doctorProfile?.shortBio || 'The practitioner has not provided a detailed biography yet.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Focus & Specializations</p>
                      <div className="flex flex-wrap gap-3">
                        {detailData.doctorProfile?.specialInterests?.length > 0 ? (
                          detailData.doctorProfile.specialInterests.map((item: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-white text-primary-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-100 shadow-sm">{item}</span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">General Practice</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Verified Signature</p>
                      <div className="h-24 px-8 bg-white rounded-3xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {detailData.doctorProfile?.digitalSignature ? (
                          <img src={detailData.doctorProfile.digitalSignature} alt="" className="h-full object-contain grayscale opacity-80" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                             <AlertCircle className="w-5 h-5 text-gray-200" />
                             <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Pending Sync</p>
                          </div>
                        )}
                      </div>
                    </div>
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
