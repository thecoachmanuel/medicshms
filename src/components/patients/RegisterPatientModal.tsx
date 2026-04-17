'use client';

import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Heart, Loader2, ShieldCheck, CheckCircle } from 'lucide-react';
import { patientsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterPatientModal({ isOpen, onClose, onSuccess }: Props) {
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

  const [duplicatePatient, setDuplicatePatient] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDuplicatePatient(null);
    try {
      const res = (await patientsAPI.getAll({ search: formData.mobileNumber })) as any;
      const existing = (res.data || res.patients || []).find((p: any) => p.mobile_number === formData.mobileNumber || p.profile?.phone === formData.mobileNumber);
      
      if (existing) {
        setDuplicatePatient(existing);
        setLoading(false);
        return;
      }

      await patientsAPI.create(formData);
      
      toast.success('Patient registered successfully. Default Credentials: hms@patient');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const handleUseExisting = () => {
    toast.success('Using existing patient profile');
    onSuccess(); // The parent might need the patient ID, but usually it fetches the list again
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Register Patient</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">Lifetime Registry Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0 ml-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {duplicatePatient && (
          <div className="px-4 sm:px-8 py-4 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Existing Profile Found</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">{duplicatePatient.profile?.name || duplicatePatient.fullName} | {duplicatePatient.patient_id}</p>
              </div>
            </div>
            <button 
              onClick={handleUseExisting}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95"
            >
              Select Profile
            </button>
          </div>
        )}

         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 custom-scrollbar overscroll-behavior-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Mobile Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  required
                  type="tel"
                  placeholder="e.g. +234 81 2345 6789"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  placeholder="username@email.com"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Gender</label>
              <select
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Date of Birth</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="date"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Blood Group</label>
              <div className="relative group">
                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="e.g. O+ve"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Residential Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
              <textarea
                placeholder="Complete address..."
                rows={3}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            {/* Emergency Contact Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="Next of kin name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>

            {/* Emergency Contact Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Emergency Contact Phone</label>
              <input
                type="tel"
                placeholder="Emergency number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                value={formData.emergencyContactNumber}
                onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
              />
            </div>
          </div>
        </form>

         <div className="px-5 sm:px-10 py-5 sm:py-8 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors tracking-widest"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Enrollment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
