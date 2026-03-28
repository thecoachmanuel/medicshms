'use client';

import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Building2, 
  User, Mail, Phone, MessageSquare, 
  CheckCircle2, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DemoBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoBookingModal({ isOpen, onClose }: DemoBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    hospital_name: '',
    contact_name: '',
    email: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to submit request');
      
      setSubmitted(true);
      toast.success('Demo request submitted successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative z-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Request Received!</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Thank you for your interest in MedicsHMS. Our team will contact you shortly to confirm your demo schedule.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-black transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-2xl w-full relative z-10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Book a Demo</h2>
          <p className="text-slate-500 font-medium">Experience the power of MedicsHMS firsthand.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hospital Name</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="text" required
                value={formData.hospital_name}
                onChange={e => setFormData({...formData, hospital_name: e.target.value})}
                placeholder="Hospital Name"
                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Contact Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="text" required
                value={formData.contact_name}
                onChange={e => setFormData({...formData, contact_name: e.target.value})}
                placeholder="Full Name"
                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="email" required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="contact@hospital.com"
                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="tel" required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+123..."
                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Preferred Date</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="date" required
                value={formData.preferred_date}
                onChange={e => setFormData({...formData, preferred_date: e.target.value})}
                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Preferred Time</label>
            <div className="relative group">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="time" required
                value={formData.preferred_time}
                onChange={e => setFormData({...formData, preferred_time: e.target.value})}
                className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Message (Optional)</label>
            <div className="relative group">
              <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
              <textarea 
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Tell us about your requirements..."
                className="w-full h-32 bg-slate-50 border-slate-100 rounded-2xl pl-12 pt-4 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium resize-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="md:col-span-2 h-16 btn-primary rounded-2xl shadow-xl shadow-primary-600/30 text-lg group"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
              <>
                Confirm Booking
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
