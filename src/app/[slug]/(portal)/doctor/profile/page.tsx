'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Shield, Calendar, 
  Save, Upload, Loader2, Key,
  CheckCircle2, AlertCircle, Camera, X,
  Settings2, Bell, Clock, Layout
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DoctorProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'clinical'>('personal');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinical_preferences: {
      default_appointment_duration: 30,
      auto_finalize_results: false,
      notification_sounds: true,
      sidebar_collapsed: false
    }
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        clinical_preferences: user.clinical_preferences || {
          default_appointment_duration: 30,
          auto_finalize_results: false,
          notification_sounds: true,
          sidebar_collapsed: false
        }
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
        toast.success('Doctor profiles & preferences updated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clinical Profile</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your professional identity and diagnostic workspace settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-4">
           <button 
             onClick={() => setActiveTab('personal')}
             className={cn(
               "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
               activeTab === 'personal' 
                 ? "bg-white border-indigo-100 shadow-sm text-indigo-600 font-bold" 
                 : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
             )}
           >
             <User className="w-5 h-5" />
             <span className="text-sm">Personal Info</span>
           </button>
           <button 
             onClick={() => setActiveTab('clinical')}
             className={cn(
               "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
               activeTab === 'clinical' 
                 ? "bg-white border-indigo-100 shadow-sm text-indigo-600 font-bold" 
                 : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
             )}
           >
             <Settings2 className="w-5 h-5" />
             <span className="text-sm">Clinical Settings</span>
           </button>
        </div>

        {/* Form Area */}
        <div className="lg:col-span-9">
          <form onSubmit={handleUpdateProfile} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-10 shadow-sm space-y-10">
            
            {activeTab === 'personal' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-8">
                   <div className="relative group">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                         {user?.profilePhoto ? (
                           <img src={user.profilePhoto} className="w-full h-full object-cover" />
                         ) : (
                           <User className="w-12 h-12 text-indigo-200" />
                         )}
                      </div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-gray-900 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         const fd = new FormData();
                         fd.append('photo', file);
                         try {
                           const res = await authAPI.uploadPhoto(fd);
                           if (res.data?.url) {
                             updateUser({ profilePhoto: res.data.url });
                             toast.success('Photo updated');
                           }
                         } catch (err) { toast.error('Upload failed'); }
                      }} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <div className="px-2 py-0.5 rounded-md bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                           {user?.role}
                         </div>
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                           ID: {user?.id.slice(0, 8)}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                         type="text" 
                         className="w-full flex h-12 rounded-2xl border bg-white pl-12 pr-4 text-sm font-bold outline-none border-gray-100 focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Email</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                         disabled
                         type="email" 
                         className="w-full flex h-12 rounded-2xl border bg-gray-50/50 pl-12 pr-4 text-sm font-bold border-gray-100 cursor-not-allowed text-gray-400"
                         value={formData.email}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Access</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                         type="tel" 
                         className="w-full flex h-12 rounded-2xl border bg-white pl-12 pr-4 text-sm font-bold outline-none border-gray-100 focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all"
                         value={formData.phone}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clinical' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-500" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900">Standard Consultation</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Default Slot Duration</p>
                         </div>
                      </div>
                      <select 
                        className="w-full flex h-12 rounded-2xl border bg-white px-4 text-sm font-bold outline-none border-gray-100 focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none"
                        value={formData.clinical_preferences.default_appointment_duration}
                        onChange={e => setFormData({
                          ...formData, 
                          clinical_preferences: { ...formData.clinical_preferences, default_appointment_duration: Number(e.target.value) }
                        })}
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                      </select>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-500" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900">Audio Alerts</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">In-App Notifications</p>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                         <span className="text-xs font-bold text-gray-600">Enable Notification Sounds</span>
                         <button 
                           type="button"
                           onClick={() => setFormData({
                             ...formData,
                             clinical_preferences: { ...formData.clinical_preferences, notification_sounds: !formData.clinical_preferences.notification_sounds }
                           })}
                           className={cn(
                             "w-12 h-6 rounded-full transition-all relative",
                             formData.clinical_preferences.notification_sounds ? "bg-indigo-600" : "bg-gray-200"
                           )}
                         >
                           <div className={cn(
                             "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                             formData.clinical_preferences.notification_sounds ? "left-7" : "left-1"
                           )} />
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900">Smart Release</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Diagnostic Finalization</p>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                         <span className="text-xs font-bold text-gray-600">Auto-Finalize Verified Results</span>
                         <button 
                           type="button"
                           onClick={() => setFormData({
                             ...formData,
                             clinical_preferences: { ...formData.clinical_preferences, auto_finalize_results: !formData.clinical_preferences.auto_finalize_results }
                           })}
                           className={cn(
                             "w-12 h-6 rounded-full transition-all relative",
                             formData.clinical_preferences.auto_finalize_results ? "bg-indigo-600" : "bg-gray-200"
                           )}
                         >
                           <div className={cn(
                             "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                             formData.clinical_preferences.auto_finalize_results ? "left-7" : "left-1"
                           )} />
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Layout className="w-5 h-5 text-purple-500" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900">EHR Interface</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Layout Preference</p>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                         <span className="text-xs font-bold text-gray-600">Compact Sidebar by Default</span>
                         <button 
                           type="button"
                           onClick={() => setFormData({
                             ...formData,
                             clinical_preferences: { ...formData.clinical_preferences, sidebar_collapsed: !formData.clinical_preferences.sidebar_collapsed }
                           })}
                           className={cn(
                             "w-12 h-6 rounded-full transition-all relative",
                             formData.clinical_preferences.sidebar_collapsed ? "bg-indigo-600" : "bg-gray-200"
                           )}
                         >
                           <div className={cn(
                             "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                             formData.clinical_preferences.sidebar_collapsed ? "left-7" : "left-1"
                           )} />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button disabled={loading} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-gray-800 transition-all shadow-xl shadow-gray-200/50 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Synchronize Profile</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
