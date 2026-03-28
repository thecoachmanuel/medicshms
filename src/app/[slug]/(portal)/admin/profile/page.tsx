'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Shield, Calendar, 
  Edit2, Save, Upload, Loader2, Key,
  CheckCircle2, AlertCircle, Camera
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      if (res.data) {
        updateUser(res.data);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and login security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-8 flex flex-col items-center text-center">
             <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                   {user?.profilePhoto ? (
                     <img src={user.profilePhoto} className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-12 h-12 text-indigo-200" />
                   )}
                </div>
                <button className="absolute bottom-1 right-1 p-2 bg-gray-900 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </button>
             </div>
             
             <div className="mt-6">
               <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
               <div className="flex items-center justify-center gap-1.5 mt-1">
                 <Shield className="w-3.5 h-3.5 text-primary-500" />
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{user?.role}</span>
               </div>
             </div>

             <div className="w-full h-px bg-gray-100 my-6"></div>

             <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-xs">
                   <span className="text-gray-400 font-bold uppercase tracking-widest">ID Status</span>
                   <span className="text-emerald-500 font-black uppercase">Verified</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                   <span className="text-gray-400 font-bold uppercase tracking-widest">Joined</span>
                   <span className="text-gray-900 font-bold uppercase">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
             </div>
          </div>

          <button className="card p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 w-full group border-none">
             <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center transition-transform group-hover:scale-110">
                <Key className="w-5 h-5 text-rose-500" />
             </div>
             <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Security Settings</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Change Password</p>
             </div>
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile} className="card p-8 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5 md:col-span-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Display Name</label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input py-3 pl-12" />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Professional Email</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                   <input disabled type="email" value={formData.email} className="input py-3 pl-12 bg-gray-50 cursor-not-allowed" />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mobile Access</label>
                 <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                   <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input py-3 pl-12" />
                 </div>
               </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button disabled={loading} className="btn-primary min-w-[160px] shadow-xl shadow-primary-500/10">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Update Info</>}
              </button>
            </div>
          </form>

          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
             <AlertCircle className="w-6 h-6 text-amber-500 mt-0.5" />
             <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-1">Administrative Note</p>
                <p className="text-xs text-amber-700 leading-relaxed font-medium">To change your registered email address or update your professional role, please contact the lead administrator or the HR department for verification purposes.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
