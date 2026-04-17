'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Heart, Loader2 } from 'lucide-react';
import { patientsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Patient } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: Patient;
}

export default function EditPatientModal({ isOpen, onClose, onSuccess, patient }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    emailAddress: '',
    mobileNumber: '',
    gender: 'Male',
    dateOfBirth: '',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        fullName: patient.fullName || '',
        emailAddress: patient.emailAddress || '',
        mobileNumber: patient.mobileNumber || '',
        gender: patient.gender || 'Male',
        dateOfBirth: patient.dateOfBirth || '',
        bloodGroup: patient.bloodGroup || '',
        address: patient.address || '',
        emergencyContactName: patient.emergencyContactName || '',
        emergencyContactNumber: patient.emergencyContactNumber || '',
      });
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patientsAPI.update(patient.patientId || patient._id, formData);
      toast.success('Patient updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-orange-600 flex items-center justify-center shadow-xl shadow-orange-100 shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Edit Patient Details</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">Update record for #{patient.patientId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0 ml-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-10 no-scrollbar custom-scrollbar overscroll-behavior-contain">
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 group-focus-within:text-orange-600 transition-colors">Full Identity</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 group-focus-within:text-orange-600 transition-colors">Primary Contact</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    required
                    type="tel"
                    placeholder="Mobile Number"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-black focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 group-focus-within:text-orange-600 transition-colors">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="username@email.com"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Biological Gender</label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-black focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 group-focus-within:text-orange-600 transition-colors">Birth Date</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="date"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 group-focus-within:text-rose-600 transition-colors">Haematological Group</label>
                <div className="relative">
                  <Heart className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="e.g. O+ve"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-black text-rose-600 focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition-all shadow-inner uppercase"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3 group">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-1 group-focus-within:text-orange-600 transition-colors">Residential Domicile</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-6 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <textarea
                  placeholder="Complete home address..."
                  rows={3}
                  className="w-full pl-14 pr-5 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] text-sm font-medium focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none shadow-inner"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-10 border-t border-gray-100 space-y-8">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] ml-1">Emergency Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Emergency Contact Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Primary Kin</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>

                {/* Emergency Contact Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Kin Hotline</label>
                  <input
                    type="tel"
                    placeholder="Contact Number"
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-black focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                    value={formData.emergencyContactNumber}
                    onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-4 text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors tracking-widest shrink-0"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-12 py-5 bg-gray-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 group shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            Persist Updates
          </button>
        </div>
    </div>
  );
}
