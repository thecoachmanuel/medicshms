'use client';

import React from 'react';
import { ShieldAlert, CreditCard, Settings, Mail, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionLockoutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-rose-100 selection:text-rose-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-50/50 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />

      <div className="relative max-w-2xl w-full">
        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white overflow-hidden">
          {/* Status Banner */}
          <div className="bg-rose-500 p-8 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldAlert className="w-6 h-6 text-white shrink-0" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-widest leading-none">Access Restricted</h1>
                <p className="text-xs text-rose-100 font-bold mt-1 opacity-80 uppercase tracking-wider">Institution ID: #HS-REQ-551</p>
              </div>
            </div>
          </div>

          <div className="p-12 space-y-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                This institution's services are <span className="text-rose-500">temporarily withheld.</span>
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Hospital management services for this tenant have been restricted by the Platform Governance module. This typically occurring during billing reconciliation, scheduled maintenance, or policy verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3 group hover:bg-white hover:shadow-xl transition-all duration-500">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-800">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Billing & Plans</h3>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-tighter">If you are the Administrator, please verify your subscription status in the billing portal.</p>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3 group hover:bg-white hover:shadow-xl transition-all duration-500">
                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-800">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">System Health</h3>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-tighter">Ongoing technical audits or infrastructure migrations may temporarily restrict access.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Technical Support</p>
                   <p className="text-xs font-bold text-slate-900">support@medicshms.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Link 
                  href="/"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-lg active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return Home
                </Link>
                <a 
                  href="https://medicshms.com/support"
                  target="_blank"
                  className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
                  title="Official Help Center"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Powered by MedicsHMS Resilience Engine v4.2
        </p>
      </div>
    </div>
  );
}
