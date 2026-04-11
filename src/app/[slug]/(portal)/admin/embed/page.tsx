'use client';

import React, { use, useState } from 'react';
import { 
  Code, Copy, Check, Globe, Layout, 
  Smartphone, Shield, Info, ExternalLink,
  Monitor, Cpu, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function EmbedIntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'iframe' | 'widget'>('iframe');

  const portalUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/${slug}` : `https://medics-hms.com/${slug}`;
  
  const iframeCode = `<iframe 
  src="${portalUrl}" 
  style="width: 100%; height: 800px; border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" 
  title="Patient Portal"
  allow="camera; microphone; geolocation;"
></iframe>`;

  const widgetCode = `<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/scripts/embed-widget.js" 
  data-hospital-slug="${slug}"
  data-primary-color="#4f46e5"
  async
></script>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
              <Code className="w-6 h-6 text-indigo-600" />
            </div>
            Embed Integration
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Seamlessly integrate your Patient Portal into your existing hospital website.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Integration Options */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm overflow-hidden min-h-[500px]">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('iframe')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'iframe' ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20" : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Legacy Iframe
                </button>
                <button 
                  onClick={() => setActiveTab('widget')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'widget' ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20" : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Smart Widget (BETA)
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900">How to implement</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {activeTab === 'iframe' 
                    ? "Copy the code below and paste it into any HTML page on your hospital website. This will render the full patient portal experience in a dedicated container."
                    : "The Smart Widget allows you to add a floating 'Book Appointment' button to your site. It loads the portal in a modal context for a superior user experience."
                  }
                </p>
              </div>

              {/* Code Snippet Box */}
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gray-900 rounded-[2rem] p-8 text-indigo-300 font-mono text-xs leading-relaxed overflow-hidden">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(activeTab === 'iframe' ? iframeCode : widgetCode)}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white border border-white/10 flex items-center gap-2 group/copy"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/copy:opacity-100 transition-opacity whitespace-nowrap">Copy Code</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all pr-12">
                    {activeTab === 'iframe' ? iframeCode : widgetCode}
                  </pre>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <Shield className="w-6 h-6 text-amber-600 shrink-0" />
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight leading-relaxed">
                  <span className="font-black">Security Note:</span> Make sure your hospital website domain is whitelisted in Portal Settings to allow framed interactions and prevent CORS blocking.
                </p>
              </div>
            </div>
          </div>

          {/* Preview Container */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm p-8 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                   <Monitor className="w-5 h-5 text-indigo-400" /> Interface Preview
                </h3>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Context</span>
             </div>
             
             <div className="aspect-video rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent" />
                <div className="relative z-10 text-center space-y-4">
                   <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mx-auto animate-bounce-short">
                      <Layout className="w-8 h-8 text-indigo-600" />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Portal Mockup</p>
                   <a href={`/${slug}`} target="_blank" className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 mx-auto px-4 py-2 bg-indigo-50 rounded-lg transition-all group">
                      Open Direct Portal <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </a>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 blur-[60px] -mr-16 -mt-16" />
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                 <Settings className="w-6 h-6 text-indigo-400" /> Configuration
              </h3>
              <div className="space-y-6">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1">Target Slug</p>
                    <p className="text-sm font-black text-white">{slug}</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1">SSO Bridging</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active & Secure</p>
                 </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/10">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <Smartphone className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                       <p className="text-xs font-black">Mobile Responsive</p>
                       <p className="text-[9px] text-indigo-300/60 uppercase font-bold">Native feel on all devices</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <Cpu className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                       <p className="text-xs font-black">Fast Rendering</p>
                       <p className="text-[9px] text-indigo-300/60 uppercase font-bold">Optimized edge delivery</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 space-y-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                 <Info className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">Integration Support</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">Need help with a custom UI bridge? Our engineering team is available for deep-level technical integrations.</p>
              <button className="w-full py-4 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                 Request Engineering Patch
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
