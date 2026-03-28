'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Shield, Globe, Zap, CheckCircle2, 
  ArrowRight, Activity, Users, Heart,
  BarChart3, CloudUpload, Lock, Smartphone,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscriptionPlansAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DemoBookingModal from '@/components/modals/DemoBookingModal';
import { useRouter } from 'next/navigation';
import HospitalLogo from '@/components/common/HospitalLogo';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  is_recommended: boolean;
}

export default function SaaSLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [demoModalOpen, setDemoModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await subscriptionPlansAPI.getPublic();
        setPlans(res.data || []);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <HospitalLogo size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
             <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors uppercase tracking-widest">Features</a>
             <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors uppercase tracking-widest">Pricing</a>
             <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors uppercase tracking-widest">Login</Link>
             <Link href="/signup" className="btn-primary py-2.5 px-6 rounded-xl shadow-lg shadow-primary-600/20 text-sm font-bold uppercase tracking-widest">
               Start Free Trial
             </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full border border-primary-100 animate-bounce-short">
            <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-700">The Future of Hospital Management</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1] tracking-tighter">
            One Platform. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">Infinite Hospitals.</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl text-slate-500 font-medium leading-relaxed">
            Empower your healthcare institution with our enterprise-grade SaaS platform. 
            Isolated data, unified management, and seamless patient care—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link href="/signup" className="btn-primary py-5 px-12 rounded-2xl text-lg font-bold shadow-2xl shadow-primary-600/30">
              Launch Your Hospital
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={() => setDemoModalOpen(true)}
              className="btn-secondary py-5 px-12 rounded-2xl text-lg font-bold bg-white shadow-xl shadow-slate-200/50 border-slate-100 hover:bg-slate-50"
            >
              Book a demo
            </button>
          </div>

          <div className="mt-20 relative max-w-5xl mx-auto rounded-[3rem] border border-white/50 bg-white/30 backdrop-blur-2xl p-4 shadow-2xl">
             <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-100">
                <img src="https://images.unsplash.com/photo-1540331547168-8b63109228b7?auto=format&fit=crop&q=80&w=2000" alt="Dashboard Preview" className="w-full opacity-90 h-[500px] object-cover" />
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.4em]">Core Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900">Engineered for Excellence</h3>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Everything you need to run a modern, efficient, and patient-centric hospital at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Data Isolation", desc: "Strict multi-tenant architecture ensures each hospital's data is completely isolated and secure." },
              { icon: Zap, title: "Instant Deployment", desc: "Launch new hospital branches or independent clinics in seconds with one-click cloning." },
              { icon: Globe, title: "Global Scale", desc: "Optimized for speed and accessibility across the globe with Cloudinary and Supabase edge." },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Deep insights into patient flow, staff performance, and financial metrics." },
              { icon: Lock, title: "Role-Based Access", desc: "Fine-grained permissions for admins, doctors, receptionists, and patients." },
              { icon: Smartphone, title: "Patient Portal", desc: "Dedicated mobile-first interface for patients to book and view records." }
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-primary-500 transition-all hover:shadow-2xl hover:shadow-primary-600/5 group">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <f.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4">{f.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription/Pricing */}
      <section id="pricing" className="py-32 relative bg-white">
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
               <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.4em]">Simple Plans</h2>
               <h3 className="text-4xl md:text-5xl font-black text-slate-900">Scale as You Grow</h3>
               
               {/* Billing Toggle */}
               <div className="flex items-center justify-center gap-4 pt-8">
                  <span className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
                  <button 
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className="w-16 h-8 bg-slate-200 rounded-full relative p-1 transition-all"
                  >
                    <div className={`w-6 h-6 bg-primary-600 rounded-full transition-all transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                    Yearly <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full ml-1 uppercase tracking-widest font-black">Save 20%</span>
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center min-h-[400px]">
               {loading ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-4">
                     <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                     <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading Enterprise Plans...</p>
                  </div>
               ) : plans.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                     <p className="text-slate-500 font-bold italic">No active subscription plans available at the moment.</p>
                  </div>
               ) : (
                  plans.map((plan, i) => (
                    <div 
                      key={plan.id} 
                      className={cn(
                        "p-10 rounded-[3rem] border flex flex-col transition-all duration-500 relative bg-white",
                        plan.is_recommended ? "scale-110 z-20 shadow-2xl shadow-primary-600/20 py-14 border-primary-100" : "scale-100 z-10 shadow-xl shadow-slate-200/50 border-slate-100"
                      )}
                    >
                      {plan.is_recommended && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg">
                          Recommended
                        </div>
                      )}
                      <h4 className="text-xl font-black mb-2 uppercase tracking-widest text-slate-900">{plan.name}</h4>
                      <p className="text-xs font-bold mb-8 italic text-slate-400">
                        {plan.description}
                      </p>
                      <div className="text-4xl font-black mb-10 flex items-baseline gap-1 text-slate-900">
                        <span className="text-2xl">₦</span>
                        {billingCycle === 'monthly' ? plan.price_monthly.toLocaleString() : plan.price_yearly.toLocaleString()}
                        <span className="text-[10px] font-black ml-2 tracking-widest uppercase text-slate-400">
                          {billingCycle === 'monthly' ? '/ month' : '/ year'}
                        </span>
                      </div>
                      <ul className="space-y-4 flex-1 mb-10">
                        {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest leading-tight text-slate-600">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-primary-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => {
                          if (user?.role === 'Admin' && (user as any).hospital?.slug) {
                             router.push(`/${(user as any).hospital.slug}/admin/billing?plan=${plan.id}&cycle=${billingCycle}`);
                          } else {
                             router.push('/signup');
                          }
                        }}
                        className={cn(
                          "py-5 rounded-2xl font-black uppercase tracking-widest text-center transition-all shadow-xl text-xs",
                          plan.is_recommended 
                            ? "bg-primary-600 text-white hover:bg-primary-700 hover:scale-105" 
                            : "bg-slate-900 text-white hover:bg-black hover:scale-105"
                        )}
                      >
                        {plan.slug === 'free-trial' ? 'Start Trial' : 'Get Started'}
                      </button>
                    </div>
                  ))
               )}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <HospitalLogo size="md" className="justify-center" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 Medics HMS Platform. All Rights Reserved.</p>
        </div>
      </footer>

      <DemoBookingModal 
        isOpen={demoModalOpen} 
        onClose={() => setDemoModalOpen(false)} 
      />
    </div>
  );
}
