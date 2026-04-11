'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Mail, Phone, MapPin, Send, 
  ArrowLeft, CheckCircle2, MessageSquare,
  Globe, Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import HospitalLogo from '@/components/common/HospitalLogo';
import { toast } from 'react-hot-toast';

export default function SaaSContactPage() {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject') || 'General Inquiry',
      message: formData.get('message'),
      hospital_id: null // Platform message
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        setSubmitted(true);
        toast.success('Message sent successfully!');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Message Received</h1>
            <p className="text-slate-500 mt-4 leading-relaxed">
              Thank you for reaching out to MedicsHMS. Our strategic team will review your inquiry and contact you shortly.
            </p>
          </div>
          <Link href="/" className="btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <HospitalLogo size="md" />
          </Link>
          <Link href="/" className="text-sm font-black text-slate-400 hover:text-primary-600 transition-all flex items-center gap-2 uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Left Column: Info */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full border border-primary-100">
                <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-700">Connect with MedicsHMS</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                Let's Build the Future of <span className="text-primary-600">Healthcare</span> Together.
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
                Have questions about deployment, integration, or custom solutions? Our specialist team is ready to assist your institution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4 group hover:border-primary-500 transition-colors">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email us at</p>
                  <p className="text-lg font-black text-slate-900">medicsonlineng@gmail.com</p>
                </div>
              </div>
              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4 group hover:border-primary-500 transition-colors">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Call Support</p>
                  <p className="text-lg font-black text-slate-900">+2347028587375</p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-black tracking-tight">Enterprise Headquarters</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                       <MapPin className="w-6 h-6 text-primary-400 shrink-0 mt-1" />
                       <p className="text-slate-400 font-medium leading-relaxed">
                         Lagos Digital Hub, Nigeria<br />
                         Serving healthcare institutions globally.
                       </p>
                    </div>
                  </div>
                  <div className="pt-6 flex gap-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Uptime</span>
                       <span className="text-lg font-black text-primary-400">99.9%</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Response</span>
                       <span className="text-lg font-black text-primary-400">&lt; 4 Hours</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-600/10 to-indigo-600/10 rounded-[4rem] blur-2xl -z-10" />
            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Send a Message</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inquiry Protocol Initiation</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                    <input 
                      name="name"
                      type="text" 
                      required
                      placeholder="John Doe"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary-600 transition-all outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail Address</label>
                    <input 
                      name="email"
                      type="email" 
                      required
                      placeholder="john@hospital.com"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary-600 transition-all outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <input 
                      name="phone"
                      type="tel" 
                      placeholder="+234 ..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary-600 transition-all outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Interested In</label>
                    <select 
                      name="subject"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary-600 transition-all outline-none appearance-none"
                    >
                      <option>Platform Demo</option>
                      <option>Pricing Inquiry</option>
                      <option>Technical Support</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message Details</label>
                  <textarea 
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us about your institution..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-8 text-sm font-bold focus:ring-2 focus:ring-primary-600 transition-all outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/20 active:scale-95 transition-all text-sm"
                >
                  {loading ? (
                    'Transmitting...'
                  ) : (
                    <>
                      Transmit Inquiry
                      <Send className="w-5 h-5 ml-3" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6">
               {[
                 { icon: Globe, label: 'Global', color: 'text-blue-500' },
                 { icon: Shield, label: 'Secure', color: 'text-emerald-500' },
                 { icon: Zap, label: 'Fast', color: 'text-amber-500' }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
                   <item.icon className={cn("w-6 h-6", item.color)} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <HospitalLogo size="md" className="justify-center" />
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">© 2026 MedicsHMS Enterprise. Built for Modern Medicine.</p>
        </div>
      </footer>
    </div>
  );
}
