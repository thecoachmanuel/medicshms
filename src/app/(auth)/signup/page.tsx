'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Hospital, ArrowRight, Loader2, 
  Building2, Mail, Lock, User, 
  Phone, CheckCircle2, ShieldCheck,
  Zap, Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hospital_name: '',
    hospital_email: '',
    admin_name: '',
    admin_email: '',
    password: '',
    phone: '',
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API call to /api/auth/signup-hospital
      const res = await fetch('/api/auth/signup-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      toast.success('Hospital registered successfully! Redirecting to dashboard...');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:block space-y-12">
           <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-600/20">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter italic">Medics<span className="text-primary-600">HMS</span></span>
          </div>

          <h1 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
            Join the <span className="text-primary-600">Future</span> of <br />
            Medical Care.
          </h1>

          <div className="space-y-8">
            {[
              { icon: Zap, title: "30-Day Free Trial", desc: "Full access to all features with no credit card required." },
              { icon: ShieldCheck, title: "Enterprise Grade Security", desc: "Isolated patient data and top-tier encryption standards." },
              { icon: Globe, title: "Custom Branding", desc: "Your hospital, your rules. Fully customize your public presence." }
            ].map((f, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{f.title}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-white flex items-center gap-6 shadow-2xl shadow-slate-200/40">
             <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 shadow-sm"></div>
                ))}
             </div>
             <p className="text-sm font-bold text-slate-600 italic">"Joined by 500+ clinics this month alone."</p>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-right-10 duration-1000">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Step {step} of 2: {step === 1 ? 'Hospital Details' : 'Admin Credentials'}</p>
            <div className="flex gap-2 mt-4">
               <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary-600 shadow-md shadow-primary-600/30' : 'bg-slate-100'}`}></div>
               <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary-600 shadow-md shadow-primary-600/30' : 'bg-slate-100'}`}></div>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <div className="space-y-1.5 text-center sm:text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hospital Official Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={formData.hospital_name}
                      onChange={e => setFormData({...formData, hospital_name: e.target.value})}
                      placeholder="e.g. St. Mary's Medical Center"
                      className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Business Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={formData.hospital_email}
                      onChange={e => setFormData({...formData, hospital_email: e.target.value})}
                      placeholder="contact@yourhospital.com"
                      className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Official Contact Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-16 btn-primary rounded-2xl shadow-xl shadow-primary-600/30 text-lg group"
                >
                  Continue to Admin Details
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Admin Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={formData.admin_name}
                      onChange={e => setFormData({...formData, admin_name: e.target.value})}
                      placeholder="John Doe"
                      className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Admin Personal Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="email" 
                      required
                      value={formData.admin_email}
                      onChange={e => setFormData({...formData, admin_email: e.target.value})}
                      placeholder="johndoe@personal.com"
                      className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Secure Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl pl-12 focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                   <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 h-16 btn-secondary bg-slate-50 border-slate-100 rounded-2xl font-bold"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] h-16 btn-primary rounded-2xl shadow-xl shadow-primary-600/30 text-lg group"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                      <>
                        Launch Hospital
                        <CheckCircle2 className="w-6 h-6 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-10 text-center text-slate-400 text-sm font-bold">
            Already have an account? <Link href="/login" className="text-primary-600 hover:text-primary-700 underline">Login to Portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
