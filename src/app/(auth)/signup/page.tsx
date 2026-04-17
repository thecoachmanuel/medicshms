'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Hospital, ArrowRight, Loader2, 
  Building2, Mail, Lock, User, 
  Phone, CheckCircle2, ShieldCheck,
  Zap, Globe, Copy, ExternalLink, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import HospitalLogo from '@/components/common/HospitalLogo';
import { INSTITUTION_CONFIGS, getGenericTerm } from '@/lib/institution-config';

const typeIcons: any = {
  hospital: Building2,
  dental_clinic: Zap, // Placeholder icons or specific ones
  diagnostic_center: Globe,
  eye_clinic: Globe
};

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hospital_name: '',
    institution_type: 'hospital' as any,
    hospital_email: '',
    admin_name: '',
    admin_email: '',
    password: '',
    phone: '',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ slug: string; name: string } | null>(null);

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const planSlug = searchParams?.get('plan') || 'free-trial';
  const billingCycle = searchParams?.get('cycle') || 'monthly';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Fetch plans to get the ID for the selected slug
      const plansRes = await fetch('/api/subscription-plans/public');
      const plansData = await plansRes.json();
      const selectedPlan = plansData.data?.find((p: any) => p.slug === planSlug);

      // API call to /api/auth/signup-hospital
      const res = await fetch('/api/auth/signup-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          plan_id: selectedPlan?.id,
          billing_cycle: billingCycle
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      toast.success('Hospital registered successfully!');

      // Redirect logic
      if (planSlug !== 'free-trial') {
        router.push(`/${data.slug}/admin/subscription?plan=${selectedPlan?.id}&cycle=${billingCycle}&new=true`);
      } else {
        setSuccessData({ slug: data.slug, name: formData.hospital_name });
        setIsSuccess(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  if (isSuccess && successData) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const tenantUrl = `${baseUrl}/${successData.slug}`;
    const adminUrl = `${baseUrl}/${successData.slug}/login`;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="w-full max-w-4xl bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl shadow-slate-200/60 border border-slate-100 relative z-10 text-center space-y-12 animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 shadow-xl shadow-emerald-500/20 rotate-12 scale-110">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Welcome to the Hub, <br />
              <span className="text-primary-600">{successData.name}!</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Your {getGenericTerm(formData.institution_type).toLowerCase()} ecosystem is ready. We've set up your isolated tenant environment with all the tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Public Website Card */}
            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest text-primary-600">Public Portal</h4>
                <p className="text-sm font-bold text-slate-700 break-all">{tenantUrl}</p>
                <p className="text-xs text-slate-400 font-medium">Your patients visit this link to book appointments.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => copyToClipboard(tenantUrl)}
                  className="p-3 bg-white rounded-xl text-slate-400 hover:text-primary-600 border border-slate-100 hover:border-primary-100 transition-all"
                  title="Copy Link"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <Link 
                  href={tenantUrl}
                  className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm border border-slate-100 hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  Visit Site <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-6 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl"></div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="font-black text-primary-400 uppercase text-[10px] tracking-widest">Admin Dashboard</h4>
                <p className="text-sm font-bold text-white break-all">{adminUrl}</p>
                <p className="text-xs text-slate-400 font-medium">Manage your staff, patients, and clinical settings.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => copyToClipboard(adminUrl)}
                  className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-primary-400 border border-white/5 hover:border-primary-400/30 transition-all"
                  title="Copy Link"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <Link 
                  href={adminUrl}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-500 transition-all flex items-center justify-center gap-2"
                >
                  Go to Admin <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-6">
            <p className="text-sm text-slate-400 font-medium italic">
              "We recommend bookmarking these links for easy access."
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="text-slate-400 hover:text-slate-900 font-bold text-sm flex items-center gap-2 group transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:block space-y-12">
          <Link href="/">
            <HospitalLogo size="lg" />
          </Link>

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
            <p className="text-slate-500 font-medium">Step {step} of 2: {step === 1 ? 'Institution Details' : 'Admin Credentials'}</p>
            <div className="flex gap-2 mt-4">
               <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary-600 shadow-md shadow-primary-600/30' : 'bg-slate-100'}`}></div>
               <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary-600 shadow-md shadow-primary-600/30' : 'bg-slate-100'}`}></div>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Institution Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.values(INSTITUTION_CONFIGS).map((type) => {
                      const Icon = typeIcons[type.id] || Building2;
                      const isSelected = formData.institution_type === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, institution_type: type.id })}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${
                            isSelected 
                              ? 'bg-primary-50 border-primary-600 text-primary-600 shadow-lg shadow-primary-600/10' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 sm:text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    {getGenericTerm(formData.institution_type)} Official Name
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={formData.hospital_name}
                      onChange={e => setFormData({...formData, hospital_name: e.target.value})}
                      placeholder={`e.g. St. Mary's ${getGenericTerm(formData.institution_type)}`}
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
                        Launch {getGenericTerm(formData.institution_type)}
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
