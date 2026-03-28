'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CreditCard, CheckCircle2, Zap, 
  ShieldCheck, ArrowRight, Loader2,
  AlertCircle, Sparkles, Building2,
  Calendar, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { subscriptionPlansAPI, siteSettingsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const planId = searchParams.get('plan');
  const cycle = searchParams.get('cycle') as 'monthly' | 'yearly';
  const isNew = searchParams.get('new') === 'true';

  useEffect(() => {
    const init = async () => {
      try {
        const res = await subscriptionPlansAPI.getPublic();
        const activePlans = res.data || [];
        setPlans(activePlans);
        
        if (planId) {
          const plan = activePlans.find((p: any) => p.id === planId);
          if (plan) {
            setSelectedPlan(plan);
          }
        }
        
        if (cycle) {
          setBillingCycle(cycle);
        }
      } catch (error) {
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [planId, cycle]);

  const handlePayment = async () => {
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    try {
      // 1. Initialize Paystack Transaction
      const amount = billingCycle === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_yearly;
      
      const res = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          metadata: {
            hospitalId: (user as any).hospital_id || (user as any).hospital?.id,
            planId: selectedPlan.id,
            cycle: billingCycle,
            type: 'subscription_upgrade'
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment initialization failed');

      // 2. Redirect to Paystack Checkout
      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      toast.error(error.message);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Configuring your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Left Side: Plan Summary */}
          <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-primary-100 shadow-sm">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-700">Premium Activation</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                {isNew ? 'Almost there! Complete your setup.' : 'Upgrade your Clinical Power.'}
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
                Connect your hospital with the best tools in the industry. Your selected plan provides enterprise-grade reliability and patient care management.
              </p>
            </div>

            <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Plan Selection</h3>
                    <p className="text-xl font-black text-primary-600">{selectedPlan?.name || 'No Plan Selected'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Billing Cycle</p>
                  <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    {billingCycle}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Included Features</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlan?.features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 tracking-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                  <p className="text-3xl font-black text-slate-900">
                    ₦{(billingCycle === 'monthly' ? selectedPlan?.price_monthly : selectedPlan?.price_yearly)?.toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/')}
                  className="text-primary-600 font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Change Plan
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Action */}
          <div className="w-full md:w-[400px] shrink-0 animate-in slide-in-from-right-8 duration-700">
            <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl shadow-primary-600/20 text-white space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/30 rounded-full blur-3xl"></div>
               
               <div className="space-y-2">
                 <h2 className="text-2xl font-black italic">Checkout Safe.</h2>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                   Your transaction is secured by enterprise-grade SSL and handled via Paystack.
                 </p>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <ShieldCheck className="w-6 h-6 text-primary-400" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest leading-none mb-1">Encrypted Data</p>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">AES-256 standard encryption for all metadata.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <CreditCard className="w-6 h-6 text-indigo-400" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest leading-none mb-1">Flexible Payment</p>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Pay via Card, USSD, Transfer or QR Code.</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                 <button 
                   onClick={handlePayment}
                   disabled={isProcessing || !selectedPlan}
                   className="w-full h-20 bg-primary-600 hover:bg-primary-500 rounded-3xl font-black text-lg uppercase tracking-widest shadow-xl shadow-primary-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                 >
                   {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                     <>
                        Pay ₦{(billingCycle === 'monthly' ? selectedPlan?.price_monthly : selectedPlan?.price_yearly)?.toLocaleString()} 
                        <ArrowRight className="w-6 h-6" />
                     </>
                   )}
                 </button>
                 
                 <div className="flex items-center justify-center gap-2 text-slate-500">
                    <Info className="w-4 h-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Billing will recur {billingCycle}</p>
                 </div>
               </div>
               
               <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                  <img src="https://paystack.com/assets/img/v3/logo-blue.svg" alt="Paystack" className="h-6" />
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
