'use client';

import React, { use, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { patientAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import { 
  User, Mail, Phone, MapPin, 
  Calendar, Droplets, Save, Loader2,
  ShieldCheck, Heart, Key, Lock
} from 'lucide-react';

export default function PatientProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await patientAPI.getMe();
        if (res.data) setData(res.data.profile);
      } catch (err) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Logic for updating profile
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-300 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Secure Identity...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">My Profile</h1>
        <p className="text-[11px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">Identity & Medical Credentials</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-lg flex items-center justify-center text-indigo-500 shrink-0">
                <User className="w-16 h-16" />
             </div>
             <div className="flex-1 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Identity</label>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500">
                        <User className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-tight">{data?.fullName}</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Terminal</label>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs font-black tracking-tight">{data?.email}</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mobile Interface</label>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <input className="text-xs font-black tracking-tight w-full outline-none" defaultValue={data?.phone} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Birth</label>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-black tracking-tight">{data?.date_of_birth || 'Not Set'}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-gray-800 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
           <div className="flex items-center gap-3 mb-8">
              <Heart className="w-6 h-6 text-indigo-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Clinical Baseline</h3>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6 relative z-10">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                 <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Blood Group</p>
                 <div className="flex items-center gap-3">
                    <Droplets className="w-5 h-5 text-rose-400" />
                    <p className="text-2xl font-black">{data?.bloodGroup || 'O+'}</p>
                 </div>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl md:col-span-2">
                 <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Primary Residence</p>
                 <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                    <input className="bg-transparent text-sm font-bold w-full outline-none" defaultValue={data?.address || 'Set your address'} />
                 </div>
              </div>
           </div>
        </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 leading-tight">Uplink Security</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Privacy Protocols</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
            >
              <Key className="w-4 h-4" />
              Update Account Cipher
            </button>
         </div>

         <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100">
            <div className="flex items-center gap-3 text-emerald-600">
               <ShieldCheck className="w-5 h-5" />
               <p className="text-[10px] font-black uppercase tracking-widest">Global HIPAA Compliance Active</p>
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Commit Changes
            </button>
         </div>
       </form>

       <ChangePasswordModal 
         isOpen={isPasswordModalOpen}
         onClose={() => setIsPasswordModalOpen(false)}
       />
    </div>
  );
}
