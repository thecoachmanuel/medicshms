'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCog, Plus, Search, Edit2, RotateCcw, 
  Power, Trash2, X, Download, Loader2, 
  User, Stethoscope, Globe, Star, Mail, Phone,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usersAPI, departmentsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorManagement() {
  const { user: currentUser, updateUser } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', 
    departmentId: '', isActive: true 
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.getAdminAll() as any;
      setDepartments(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch departments:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to fetch departments');
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUsersByRole('Doctor') as any;
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
        
        // Sync if updating own profile
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
      
      // Sync if toggling own status
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

  const handleEdit = (doctor: any) => {
    setEditingDoctor(doctor);
    setFormData({ 
      name: doctor.name, 
      email: doctor.email, 
      phone: doctor.phone,
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

  const handleViewDetail = async (doctor: any) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await usersAPI.getProfile(doctor._id) as any;
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
    doctor.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-500 text-sm">Organize and manage medical staff profiles and access.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
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
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctor Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-20 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold text-sm uppercase tracking-widest">
                    No doctors found matching criteria
                  </td>
                </tr>
              ) : filteredDoctors.map((doctor) => (
                <tr key={doctor._id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => handleViewDetail(doctor)}
                      className="flex items-center gap-3 text-left group/name"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center">
                        <span className="text-indigo-600 font-black text-xs">{doctor.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover/name:text-indigo-600 transition-colors">Dr. {doctor.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">UID: #{doctor._id.slice(-6)}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {doctor.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {doctor.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {doctor.doctorInfo?.primaryDepartment ? (
                      <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        {doctor.doctorInfo.primaryDepartment.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                      doctor.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {doctor.isActive ? 'Authorized' : 'Suspended'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(doctor)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(doctor._id)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Reset Password">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(doctor._id, doctor.isActive)} className={cn("p-2 rounded-xl transition-all", doctor.isActive ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50")} title={doctor.isActive ? "Suspend" : "Activate"}>
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(doctor._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingDoctor ? 'Update Doctor' : 'Onboard New Doctor'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input py-3" placeholder="e.g. Dr. John Carter" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input py-3" placeholder="doctor@hospital.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input py-3" placeholder="+91 00000 00000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Department</label>
                <select 
                  required 
                  value={formData.departmentId} 
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                  className="input py-3"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900">Account Access</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {formData.isActive ? 'Active / Authorized' : 'Suspended / Locked'}
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
              {!editingDoctor && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-600 font-bold">
                  System will assign default password: <span className="font-black text-indigo-900 ml-1">hms@doctor</span>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg shadow-gray-200 hover:bg-black">{editingDoctor ? 'Update Access' : 'Authorize User'}</button>
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
              <h2 className="text-xl font-bold text-gray-900">Doctor Profile</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gray-50 border-4 border-white shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {detailData.doctorProfile?.profilePhoto ? (
                    <img src={detailData.doctorProfile.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-200" />
                  )}
                </div>
                <div className="flex-1 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pb-8 border-b border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expertise</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.doctorProfile?.qualifications || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinical Experience</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.doctorProfile?.experience ? `${detailData.doctorProfile.experience} Years` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Medical License</p>
                      <p className="text-sm font-bold text-gray-900">{detailData.doctorProfile?.medicalCouncilId || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Personal Narrative</p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      {detailData.doctorProfile?.shortBio || 'Profile bio has not been updated yet by the practitioner.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Specialty Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {detailData.doctorProfile?.specialInterests?.map((item: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Professional Signature</p>
                      {detailData.doctorProfile?.digitalSignature ? (
                        <img src={detailData.doctorProfile.digitalSignature} alt="" className="h-16 object-contain grayscale" />
                      ) : (
                        <p className="text-xs text-gray-400 italic">No signature recorded</p>
                      )}
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
