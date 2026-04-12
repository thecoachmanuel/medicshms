'use client';

import BillingList from '@/components/billing/BillingList';
import Link from 'next/link';
import { CreditCard, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SettingsContext';
import { useParams } from 'next/navigation';

export default function AdminBillingPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const params = useParams();
  const slug = params?.slug as string;
  const hospital = (user as any)?.hospital;
  const plan = settings?.plan;

  return (
    <div className="min-h-screen bg-gray-50/30 space-y-8">
      {/* Subscription Management Header */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary-50 rounded-[1.5rem] flex items-center justify-center text-primary-600">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Your SaaS Subscription</h3>
            <p className="text-xl font-black text-slate-900 leading-none">
              {plan?.name || 'Standard Managed Plan'}
              <span className={`ml-3 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                settings?.subscription_status === 'active' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {settings?.subscription_status || 'Trial'}
              </span>
            </p>
          </div>
        </div>
          
          <Link 
            href={`/${slug}/admin/subscription`}
            className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl shadow-primary-600/20 group"
          >
            <CreditCard className="w-5 h-5" />
            Manage Subscription
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      <BillingList />
    </div>
  );
}
