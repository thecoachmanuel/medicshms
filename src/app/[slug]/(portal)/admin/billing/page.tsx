'use client';

import BillingList from '@/components/billing/BillingList';
import Link from 'next/link';
import { CreditCard, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

export default function AdminBillingPage() {
  const { user } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;
  const hospital = (user as any)?.hospital;

  return (
    <div className="min-h-screen bg-gray-50/30 space-y-8">
      {/* Subscription Management Header */}
      {hospital && (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary-50 rounded-[1.5rem] flex items-center justify-center text-primary-600">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Your SaaS Subscription</h3>
              <p className="text-xl font-black text-slate-900 leading-none">
                Standard Managed Plan
                <span className="ml-3 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                  {user?.subscription_status || 'Trial'}
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
      )}

      <BillingList />
    </div>
  );
}
