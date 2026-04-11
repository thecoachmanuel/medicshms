'use client';

import React, { use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SettingsContext';
import { Copy, Code, CheckCircle2, LayoutTemplate, Smartphone, Globe, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function EmbedIntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { settings, loading } = useSiteSettings();
  const [copied, setCopied] = React.useState(false);
  const [mode, setMode] = React.useState('full');

  if (loading) {
    return <div className="p-8 animate-pulse grid gap-6"><div className="h-40 bg-slate-100 rounded-3xl" /><div className="h-64 bg-slate-100 rounded-3xl" /></div>;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://medicshms.com';
  
  // The user can embed the full app or a specific portal route
  const getEmbedUrl = () => {
    if (mode === 'booking') return `${baseUrl}/${slug}/login?flow=booking`;
    if (mode === 'patient') return `${baseUrl}/${slug}/patient/dashboard`;
    return `${baseUrl}/${slug}`; // Full HMS Experience
  };

  const embedCode = `<iframe 
  src="${getEmbedUrl()}"
  width="100%" 
  height="800px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" 
  allow="camera; microphone; geolocation"
  title="${settings?.hospital_name || 'Hospital'} Management System"
></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
          <Code className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Integration & Embed</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Embed the HMS seamlessly into your existing hospital website</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-indigo-900/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100px] -z-10" />
             
             <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6">Configuration Options</h2>
             
             <div className="grid sm:grid-cols-3 gap-4 mb-8">
               {[
                 { id: 'full', label: 'Full HMS', icon: LayoutTemplate, desc: 'Complete software' },
                 { id: 'booking', label: 'Booking', icon: Globe, desc: 'Direct to booking' },
                 { id: 'patient', label: 'Patient Portal', icon: Smartphone, desc: 'Patient Dashboard' }
               ].map((m) => {
                 const isSelected = mode === m.id;
                 const Icon = m.icon;
                 return (
                   <button
                     key={m.id}
                     onClick={() => setMode(m.id)}
                     className={cn(
                       "p-4 rounded-3xl border-2 text-left transition-all",
                       isSelected 
                         ? "border-indigo-600 bg-indigo-50/30" 
                         : "border-gray-100 hover:border-indigo-200"
                     )}
                   >
                     <div className={cn(
                       "w-8 h-8 rounded-xl flex items-center justify-center mb-3",
                       isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                     )}>
                       <Icon className="w-4 h-4" />
                     </div>
                     <p className={cn("text-xs font-black uppercase tracking-widest mb-1", isSelected ? "text-indigo-900" : "text-gray-900")}>{m.label}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.desc}</p>
                   </button>
                 );
               })}
             </div>

             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Your Code Snippet</h2>
                 <button 
                   onClick={copyToClipboard}
                   className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                 >
                   {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   {copied ? 'Copied!' : 'Copy Code'}
                 </button>
               </div>
               
               <div className="relative">
                 <pre className="p-6 bg-gray-900 text-indigo-200 rounded-[2rem] text-sm font-mono overflow-x-auto border border-gray-800 shadow-inner">
                   {embedCode}
                 </pre>
               </div>
             </div>
          </div>
          
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] border border-indigo-700 shadow-xl shadow-indigo-900/20 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
             <h2 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-6 border-b border-indigo-500/50 pb-4">Implementation Notes</h2>
             <ul className="space-y-4">
               {[
                 'SSL/HTTPS is required on your parent website for embedding to work.',
                 'The iframe has permission to access camera/microphone for telemedicine.',
                 'Responsive design: the iframe will automatically adjust to mobile screens.',
                 'We recommend setting the parent container to at least 800px height for optimal usage.'
               ].map((note, idx) => (
                 <li key={idx} className="flex gap-4">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                   <p className="text-sm font-medium leading-relaxed text-indigo-50">{note}</p>
                 </li>
               ))}
             </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
           <div className="sticky top-24 border-4 border-gray-900 rounded-[3rem] p-2 bg-white shadow-2xl h-[700px] flex flex-col overflow-hidden">
             <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-[2.5rem] border-b border-gray-100">
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-rose-400" />
                 <div className="w-3 h-3 rounded-full bg-amber-400" />
                 <div className="w-3 h-3 rounded-full bg-emerald-400" />
               </div>
               <div className="px-4 py-1.5 bg-white rounded-full border border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 Preview <ExternalLink className="w-3 h-3" />
               </div>
             </div>
             <div className="flex-1 bg-gray-50 relative pointer-events-none p-1">
               {/* Non-interactive preview to prove concept without recursive iframe nesting issues */}
               <iframe 
                 src={getEmbedUrl()}
                 className="w-full h-full border-none rounded-b-[2.5rem] bg-white opacity-80"
                 title="Preview"
                 tabIndex={-1}
               />
               <div className="absolute inset-0 bg-transparent z-10" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
