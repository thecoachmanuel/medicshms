'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Shield, Globe, Zap, CheckCircle2, 
  ArrowRight, Activity, Users, Heart,
  BarChart3, CloudUpload, Lock, Smartphone,
  Loader2, Edit3, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscriptionPlansAPI, uploadAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DemoBookingModal from '@/components/modals/DemoBookingModal';
import { useRouter } from 'next/navigation';
import HospitalLogo from '@/components/common/HospitalLogo';
import GlobalBanner from '@/components/common/GlobalBanner';
import PlatformInlineEditor, { EditableSection, InlineText, InlineImage } from '@/components/common/PlatformInlineEditor';

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
  const [siteContent, setSiteContent] = React.useState<any[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isSuperAdmin = user?.role === 'Platform Admin';

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansRes, contentRes] = await Promise.all([
          subscriptionPlansAPI.getPublic(),
          fetch('/api/site-content?page=home').then(res => res.json())
        ]);
        setPlans(plansRes.data || []);
        // Ensure defaults if no content exists yet
        const sections = Array.isArray(contentRes) ? contentRes : (contentRes?.data || []);
        if (sections.length === 0) {
            setSiteContent([
                { section_key: 'hero', content: { 
                    title: "One Platform.\nInfinite Hospitals.", 
                    description: "Empower your healthcare institution with our enterprise-grade SaaS platform. Isolated data, unified management, and seamless patient care—all in one place.",
                    button_primary: "Launch Your Hospital",
                    button_secondary: "Book a demo",
                    hero_image: "https://images.unsplash.com/photo-1540331547168-8b63109228b7?auto=format&fit=crop&q=80&w=2000"
                }},
                { section_key: 'features_header', content: {
                    badge: "Core Capabilities",
                    title: "Engineered for Excellence",
                    description: "Everything you need to run a modern, efficient, and patient-centric hospital at scale."
                }},
                { section_key: 'features_list', content: {
                    items: [
                        { icon: 'Shield', title: "Data Isolation", desc: "Strict multi-tenant architecture ensures each hospital's data is completely isolated and secure." },
                        { icon: 'Zap', title: "Instant Deployment", desc: "Launch new hospital branches or independent clinics in seconds with one-click cloning." },
                        { icon: 'Globe', title: "Global Scale", desc: "Optimized for speed and accessibility across the globe with Cloudinary and Supabase edge." },
                        { icon: 'BarChart3', title: "Advanced Analytics", desc: "Deep insights into patient flow, staff performance, and financial metrics." },
                        { icon: 'Lock', title: "Role-Based Access", desc: "Fine-grained permissions for admins, doctors, receptionists, and patients." },
                        { icon: 'Smartphone', title: "Patient Portal", desc: "Dedicated mobile-first interface for patients to book and view records." }
                    ]
                }}
            ]);
        } else {
            setSiteContent(sections);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSection = (key: string) => siteContent.find(s => s.section_key === key)?.content || {};

  const handleUpdateSection = (sectionKey: string, field: string, value: any) => {
      setSiteContent(prev => {
          const exists = prev.find(s => s.section_key === sectionKey);
          if (exists) {
              return prev.map(item => 
                  item.section_key === sectionKey 
                  ? { ...item, content: { ...item.content, [field]: value } }
                  : item
              );
          } else {
              return [...prev, { section_key: sectionKey, content: { [field]: value }, page_path: 'home', hospital_id: null }];
          }
      });
  };

  const heroContent = getSection('hero');
  const featuresHeader = getSection('features_header');

  const featuresContent = getSection('features_list')?.items || [
    { icon: 'Shield', title: "Data Isolation", desc: "Strict multi-tenant architecture ensures each hospital's data is completely isolated and secure." },
    { icon: 'Zap', title: "Instant Deployment", desc: "Launch new hospital branches or independent clinics in seconds with one-click cloning." },
    { icon: 'Globe', title: "Global Scale", desc: "Optimized for speed and accessibility across the globe with Cloudinary and Supabase edge." },
    { icon: 'BarChart3', title: "Advanced Analytics", desc: "Deep insights into patient flow, staff performance, and financial metrics." },
    { icon: 'Lock', title: "Role-Based Access", desc: "Fine-grained permissions for admins, doctors, receptionists, and patients." },
    { icon: 'Smartphone', title: "Patient Portal", desc: "Dedicated mobile-first interface for patients to book and view records." }
  ];

  const iconMap: any = { Shield, Zap, Globe, BarChart3, Lock, Smartphone };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans">
      <GlobalBanner />

      {isSuperAdmin && (
          <PlatformInlineEditor 
            page="home"
            initialContent={siteContent}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onSave={(updated) => setSiteContent(updated)}
          />
      )}

      {/* Navigation */}
      <nav className={cn(
        "sticky top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300"
      )}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <HospitalLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
             <a href="#features" className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors uppercase tracking-widest">Features</a>
             <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors uppercase tracking-widest">Pricing</a>
             <Link href="/contact" className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors uppercase tracking-widest">Contact</Link>
             <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors uppercase tracking-widest">Login</Link>
             
             {isSuperAdmin ? (
                 <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all uppercase tracking-widest",
                        isEditing ? "bg-slate-900 text-white" : "bg-primary-50 text-primary-600 hover:bg-primary-100"
                    )}
                 >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Live Editing' : 'Edit Page'}
                 </button>
             ) : (
                <Link href="/signup" className="btn-primary py-2.5 px-6 rounded-xl shadow-lg shadow-primary-600/20 text-sm font-bold uppercase tracking-widest">
                    Start Free Trial
                </Link>
             )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 md:hidden text-slate-600 hover:text-primary-600 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={cn(
          "fixed inset-0 z-[60] md:hidden transition-all duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={cn(
            "absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="flex flex-col h-full bg-slate-50">
              <div className="flex items-center justify-between px-6 h-20 bg-white border-b border-slate-100">
                <HospitalLogo size="md" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 -mr-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-10 px-8 space-y-10">
                <div className="flex flex-col gap-8">
                  <a 
                    href="#features" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] hover:text-primary-600 transition-colors"
                  >
                    Features
                  </a>
                  <a 
                    href="#pricing" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] hover:text-primary-600 transition-colors"
                  >
                    Pricing
                  </a>
                  <Link 
                    href="/contact" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] hover:text-primary-600 transition-colors"
                  >
                    Contact Area
                  </Link>
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] hover:text-primary-600 transition-colors"
                  >
                    Login Portal
                  </Link>
                </div>
                
                <div className="pt-10 border-t border-slate-200">
                   <Link 
                    href="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full py-5 rounded-[2rem] text-center font-black uppercase tracking-[0.25em] shadow-2xl shadow-primary-600/30 text-xs"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-6">Patient Priority Care</p>
                <div className="flex justify-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Shield className="w-5 h-5" />
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Zap className="w-5 h-5" />
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Globe className="w-5 h-5" />
                   </div>
                </div>
              </div>
            </div>
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
          
          <EditableSection isEditing={isEditing} sectionKey="hero" title="Hero Content">
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1] tracking-tighter">
                <InlineText 
                    value={heroContent.title || "One Platform. Infinite Hospitals."} 
                    onChange={(val) => handleUpdateSection('hero', 'title', val)}
                    isEditing={isEditing}
                    multiline
                />
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mt-10">
                <InlineText 
                    value={heroContent.description || "Empower your healthcare institution..."} 
                    onChange={(val) => handleUpdateSection('hero', 'description', val)}
                    isEditing={isEditing}
                    multiline
                />
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                <div className="relative group/btn">
                    <Link href="/signup" className="btn-primary py-5 px-12 rounded-2xl text-lg font-bold shadow-2xl shadow-primary-600/30">
                        <InlineText 
                            value={heroContent.button_primary || "Launch Your Hospital"} 
                            onChange={(val) => handleUpdateSection('hero', 'button_primary', val)}
                            isEditing={isEditing}
                        />
                        <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <button 
                  onClick={() => setDemoModalOpen(true)}
                  className="btn-secondary py-5 px-12 rounded-2xl text-lg font-bold bg-white shadow-xl shadow-slate-200/50 border-slate-100 hover:bg-slate-50"
                >
                  <InlineText 
                    value={heroContent.button_secondary || "Book a demo"} 
                    onChange={(val) => handleUpdateSection('hero', 'button_secondary', val)}
                    isEditing={isEditing}
                  />
                </button>
            </div>

            <div className="mt-20 relative max-w-6xl mx-auto rounded-[3.5rem] border border-white/50 bg-white/30 backdrop-blur-2xl p-4 shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="bg-slate-100 rounded-[3rem] overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center h-[300px] md:h-[500px] relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <InlineImage 
                        url={heroContent.hero_image || "https://images.unsplash.com/photo-1540331547168-8b63109228b7?auto=format&fit=crop&q=80&w=2000"} 
                        onChange={(e: any) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('folder', 'platform-landing');
                            uploadAPI.upload(formData).then((res: any) => handleUpdateSection('hero', 'hero_image', res.url));
                        }}
                        isEditing={isEditing}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                           <Activity className="w-8 h-8 text-white animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
          </EditableSection>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <EditableSection isEditing={isEditing} sectionKey="features_header" title="Features Header">
            <div className="text-center mb-24 space-y-4">
                <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.4em]">
                    <InlineText 
                        value={featuresHeader.badge || "Core Capabilities"} 
                        onChange={(val) => handleUpdateSection('features_header', 'badge', val)}
                        isEditing={isEditing}
                    />
                </h2>
                <h3 className="text-4xl md:text-5xl font-black text-slate-900">
                    <InlineText 
                        value={featuresHeader.title || "Engineered for Excellence"} 
                        onChange={(val) => handleUpdateSection('features_header', 'title', val)}
                        isEditing={isEditing}
                    />
                </h3>
                <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                    <InlineText 
                        value={featuresHeader.description || "Everything you need to run a modern..."} 
                        onChange={(val) => handleUpdateSection('features_header', 'description', val)}
                        isEditing={isEditing}
                        multiline
                    />
                </p>
            </div>
          </EditableSection>

          <EditableSection isEditing={isEditing} sectionKey="features_list" title="Features List">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuresContent.map((f: any, i: number) => {
                const Icon = typeof f.icon === 'string' ? (iconMap[f.icon] || Shield) : (f.icon || Shield);
                return (
                    <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-primary-500 transition-all hover:shadow-2xl hover:shadow-primary-600/5 group">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-4">
                        <InlineText 
                            value={f.title} 
                            onChange={(val) => {
                                const newItems = [...featuresContent];
                                newItems[i] = { ...newItems[i], title: val };
                                handleUpdateSection('features_list', 'items', newItems);
                            }}
                            isEditing={isEditing}
                        />
                    </h4>
                    <p className="text-slate-500 leading-relaxed font-medium">
                        <InlineText 
                            value={f.desc} 
                            onChange={(val) => {
                                const newItems = [...featuresContent];
                                newItems[i] = { ...newItems[i], desc: val };
                                handleUpdateSection('features_list', 'items', newItems);
                            }}
                            isEditing={isEditing}
                            multiline
                        />
                    </p>
                    </div>
                );
                })}
            </div>
          </EditableSection>
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
                             router.push(`/signup?plan=${plan.slug}&cycle=${billingCycle}`);
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
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 MedicsHMS Platform. All Rights Reserved.</p>
        </div>
      </footer>

      <DemoBookingModal 
        isOpen={demoModalOpen} 
        onClose={() => setDemoModalOpen(false)} 
      />
    </div>
  );
}
