'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscriptionAPI, subscriptionPlansAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, ShieldCheck, CheckCircle2, Clock, CalendarIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchHistory();
  }, []);

  const fetchPlans = async () => {
    try {
      const res: any = await subscriptionPlansAPI.getPublic();
      setPlans(res.data || []);
    } catch {
      toast.error('Failed to load pricing plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res: any = await subscriptionAPI.getHistory();
      setHistory(res.data || []);
    } catch {
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = user?.subscription_status || 'trial';
  const isExpired = currentStatus === 'expired' || currentStatus === 'suspended';

  const handlePaystackSuccessAction = async (reference: any, planId: string, cycle: 'monthly' | 'yearly') => {
    setVerifying(true);
    const toastId = toast.loading('Synchronizing with billing server...', { id: 'billing' });
    try {
      const res: any = await subscriptionAPI.verifyPayment({
        reference: reference.reference,
        planId,
        cycle
      });
      toast.success(res.message || 'Subscription Activated!', { id: toastId });
      
      updateUser({
        subscription_status: 'active',
        trial_end_date: res.next_billing_date 
      });
      fetchHistory();
    } catch (error: any) {
       const msg = error.response?.data?.message || 'Verification failed';
       toast.error(msg, { id: toastId });
    } finally {
      setVerifying(false);
    }
  };

  const handlePaystackCloseAction = () => {
    toast.error('Payment window closed');
  };

  const getPaystackConfig = (amount: number) => ({
    reference: (new Date()).getTime().toString(),
    email: user?.email || 'admin@hospital.com',
    amount: Math.round(amount * 100), // Kobo. Round to be safe with numeric
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
  });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Billing & Subscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">Scale your medical facility with our enterprise-grade hospital management tiers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Current Plan Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden h-full">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isExpired ? 'bg-rose-500' : 'bg-primary-500'}`}></div>
            
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100/50">
              <ShieldCheck className={`w-7 h-7 ${isExpired ? 'text-rose-500' : 'text-primary-500'}`} />
            </div>
            
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</h2>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-black text-gray-900 capitalize">{currentStatus}</p>
              {currentStatus === 'active' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            </div>

            <div className="mt-8 space-y-4">
               {(user?.trial_end_date || user?.next_billing_date) && (
                 <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3"/> Next Billing Cycle
                      </span>
                      <span className="text-sm font-black text-gray-900">{new Date((user.next_billing_date || user.trial_end_date) as string).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                   </div>
                 </div>
               )}
            </div>
            
            {isExpired && (
              <div className="mt-6 p-5 bg-rose-50 rounded-2xl text-[11px] text-rose-700 font-bold border border-rose-100/50 flex items-start gap-3 leading-relaxed shadow-sm shadow-rose-100/20">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                Access is strictly limited. Renew your subscription immediately to restore operations for your clinic.
              </div>
            )}
            
            {verifying && (
               <div className="mt-8 flex items-center justify-center gap-2 text-xs font-black text-primary-600 uppercase tracking-widest animate-pulse">
                 <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" />
                 Synchronizing Payment...
               </div>
            )}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Available Medical Tiers</h2>
              <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[9px] font-black text-primary-500 uppercase tracking-widest shadow-sm">Updated Today</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plansLoading ? (
                [1,2,3].map(i => (
                  <div key={i} className="h-64 bg-gray-50 rounded-[2rem] animate-pulse border border-gray-100"></div>
                ))
              ) : plans.map((plan) => {
                const isFree = Number(plan.price_monthly) === 0;
                
                return (
                  <div key={plan.id} className={cn(
                    "bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-primary-100 hover:shadow-2xl hover:shadow-primary-100/20 transition-all duration-500 relative flex flex-col group",
                    plan.slug === 'pro' && "bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-900/10"
                  )}>
                    {plan.slug === 'pro' && (
                      <div className="absolute top-6 right-6 px-3 py-1 bg-primary-500 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary-500/30">BEST VALUE</div>
                    )}
                    
                    <h3 className={cn("text-xl font-black mb-2", plan.slug === 'pro' ? "text-white" : "text-gray-900")}>{plan.name}</h3>
                    <p className={cn("text-xs mb-8 transition-colors duration-500", plan.slug === 'pro' ? "text-gray-400 group-hover:text-gray-300" : "text-gray-500 group-hover:text-gray-600")}>
                      {plan.description}
                    </p>
                    
                    {!isFree ? (
                      <div className="mb-10 flex flex-col gap-4">
                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary-200 transition-all">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monthly</span>
                              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Flexible</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                             <span className={cn("text-2xl font-black", plan.slug === 'pro' ? "text-gray-900" : "text-gray-900")}>₦{Number(plan.price_monthly).toLocaleString()}</span>
                             <span className="text-[10px] text-gray-500 font-bold">/mo</span>
                           </div>
                           <PaystackButton 
                              {...getPaystackConfig(plan.price_monthly)} 
                              text="Subscribe Monthly" 
                              className="w-full mt-4 bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                              onSuccess={(ref: any) => handlePaystackSuccessAction(ref, plan.id, 'monthly')}
                              onClose={handlePaystackCloseAction}
                            />
                        </div>

                        <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary-200 transition-all">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Yearly</span>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Save 17%</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                             <span className={cn("text-2xl font-black", plan.slug === 'pro' ? "text-gray-900" : "text-gray-900")}>₦{Number(plan.price_yearly).toLocaleString()}</span>
                             <span className="text-[10px] text-gray-500 font-bold">/yr</span>
                           </div>
                           <PaystackButton 
                              {...getPaystackConfig(plan.price_yearly)} 
                              text="Subscribe Yearly" 
                              className="w-full mt-4 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-gray-900/10 active:scale-95"
                              onSuccess={(ref: any) => handlePaystackSuccessAction(ref, plan.id, 'yearly')}
                              onClose={handlePaystackCloseAction}
                            />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-10 py-10 flex flex-col items-center justify-center opacity-40">
                         <ShieldCheck className="w-10 h-10 mb-2" />
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center italic leading-relaxed">Included in standard<br/>onboarding cycles</p>
                      </div>
                    )}

                    <ul className="space-y-4 text-[11px] font-bold">
                       {(Array.isArray(plan.features) ? plan.features : []).map((feature: any, idx: number) => (
                         <li key={idx} className="flex items-start gap-3">
                           <CheckCircle2 className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", plan.slug === 'pro' ? "text-primary-400" : "text-primary-500")}/> 
                           <span className={plan.slug === 'pro' ? "text-gray-300" : "text-gray-600"}>{feature}</span>
                         </li>
                       ))}
                    </ul>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-white">
          <h2 className="font-black text-gray-900 flex items-center gap-3 text-lg uppercase tracking-tight">
            <CreditCard className="w-6 h-6 text-primary-500" />
            Billing Archives
          </h2>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Real-time ledger</span>
          </div>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="p-10 space-y-6">
              {[1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded-3xl w-full animate-pulse"></div>)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/30">
              <div className="w-20 h-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-6">
                 <Clock className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">No historical transactions cached</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="pl-10 pr-6 py-6">Reference</th>
                    <th className="px-6 py-6">Tier Selection</th>
                    <th className="px-6 py-6">Net Amount</th>
                    <th className="px-6 py-6">Date Processed</th>
                    <th className="pr-10 pl-6 py-6 text-right">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold">
                  {history.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-gray-50/80 transition-all duration-300">
                      <td className="pl-10 pr-6 py-6 font-mono text-gray-400 group-hover:text-primary-500 transition-colors uppercase">#{tx.reference.slice(-8)}</td>
                      <td className="px-6 py-6">
                        <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-600 uppercase tracking-tighter">{tx.plan}</span>
                      </td>
                      <td className="px-6 py-6 font-black text-gray-900 text-sm">₦{Number(tx.amount).toLocaleString()}</td>
                      <td className="px-6 py-6 text-gray-500">{new Date(tx.paid_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                      <td className="pr-10 pl-6 py-6 text-right">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {tx.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
