'use client';

import React, { useState } from 'react';
import { X, Lock, Key, ShieldCheck, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ newPassword: formData.newPassword });
      toast.success('Password changed successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 border border-white/60 overflow-hidden ring-1 ring-black/5">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500" />
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Lock className="w-6 h-6 text-rose-500" />
              Security Update
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Update Account Cipher</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-50/50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-2xl transition-all active:scale-95"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">New Password</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                required 
                type="password" 
                value={formData.newPassword} 
                onChange={e => setFormData({...formData, newPassword: e.target.value})} 
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-rose-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Confirm New Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                required 
                type="password" 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-[6px] focus:ring-rose-500/10 outline-none transition-all placeholder:text-gray-300 font-medium" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
              Updating your password will require you to log out and re-authenticate on all other active devices.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Security Key'}
          </button>
        </form>
      </div>
    </div>
  );
}
