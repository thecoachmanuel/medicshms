'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscriptionAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, ShieldCheck, CheckCircle2, Clock, CalendarIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { PaystackButton } from 'react-paystack';

export default function SubscriptionPage() {
  const { user, updateUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

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
  
  // Example pricing logic (in Kobo for Paystack)
  const monthlyPriceNGN = 50000;
  const yearlyPriceNGN = 500000;

  const handlePaystackSuccessAction = async (reference: any, planType: 'monthly' | 'yearly') => {
    setVerifying(true);
    toast.loading('Verifying payment...', { id: 'billing' });
    try {
      const res: any = await subscriptionAPI.verifyPayment({
        reference: reference.reference,
        planType
      });
      toast.success(res.data?.message || 'Subscription Activated!', { id: 'billing' });
      
      // Speculatively update local context so the UI reflects the change immediately
      updateUser({
        subscription_status: 'active',
        trial_end_date: res.data?.next_billing_date 
      });
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment verification failed', { id: 'billing' });
    } finally {
      setVerifying(false);
    }
  };

  const handlePaystackCloseAction = () => {
    toast.error('Payment window closed');
  };

  const getPaystackConfig = (amount: number, planType: 'monthly' | 'yearly') => ({
    reference: (new Date()).getTime().toString(),
    email: user?.email || 'admin@hospital.com',
    amount: amount * 100, // Paystack expects Kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder', // Provide fallback to avoid crash if env matches missing
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your SaaS billing and view payment history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden h-full">
            <div className={`absolute top-0 left-0 w-full h-2 ${isExpired ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
            
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
              <ShieldCheck className={`w-7 h-7 ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`} />
            </div>
            
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</h2>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-black text-gray-900 capitalize">{currentStatus}</p>
              {currentStatus === 'active' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            </div>

            <div className="mt-8 space-y-4">
               {user?.trial_end_date && (
                 <div className="flex justify-between items-center text-sm py-4 border-t border-gray-100">
                   <span className="text-gray-500 flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> Next Billing Date</span>
                   <span className="font-bold text-gray-900">{new Date(user.trial_end_date).toLocaleDateString()}</span>
                 </div>
               )}
            </div>
            
            {isExpired && (
              <div className="mt-6 p-4 bg-rose-50 rounded-xl text-xs text-rose-700 font-bold border border-rose-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Your hospital portal access is restricted. Please renew your subscription to restore full functionality for all your staff.
              </div>
            )}
            
            {verifying && (
               <div className="mt-6 text-center text-sm text-primary-600 font-bold animate-pulse">
                 Synchronizing payment with billing server...
               </div>
            )}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2">Available Plans</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-colors relative flex flex-col">
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Monthly Billed</h3>
                 <p className="text-gray-500 text-sm mb-6">Perfect for scaling hospitals needing flexible commitments.</p>
                 <div className="mb-8">
                   <span className="text-4xl font-black text-gray-900">₦{monthlyPriceNGN.toLocaleString()}</span>
                   <span className="text-gray-500 font-medium"> / month</span>
                 </div>
                 <ul className="space-y-3 mb-8 text-sm text-gray-600">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Unlimited Patient Records</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> All Specialized Roles (Nurse, Lab, etc)</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Standard Support</li>
                 </ul>
                 
                 <div className="mt-auto">
                   <PaystackButton 
                     {...getPaystackConfig(monthlyPriceNGN, 'monthly')} 
                     text="Subscribe Monthly"
                     className="w-full bg-white border-2 border-primary-500 text-primary-600 font-bold py-4 rounded-xl hover:bg-primary-50 transition-colors"
                     onSuccess={(ref: any) => handlePaystackSuccessAction(ref, 'monthly')}
                     onClose={handlePaystackCloseAction}
                   />
                 </div>
              </div>

              {/* Yearly Plan */}
              <div className="bg-primary-900 rounded-3xl p-8 border-2 border-primary-900 shadow-xl relative overflow-hidden text-white flex flex-col">
                 <div className="absolute top-6 right-6 px-3 py-1 bg-primary-800 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-200">Save 17%</div>
                 <h3 className="text-xl font-bold mb-2">Yearly Billed</h3>
                 <p className="text-primary-200 text-sm mb-6">The best value for established, growing medical centers.</p>
                 <div className="mb-8">
                   <span className="text-4xl font-black">₦{yearlyPriceNGN.toLocaleString()}</span>
                   <span className="text-primary-300 font-medium"> / year</span>
                 </div>
                 <ul className="space-y-3 mb-8 text-sm text-primary-100">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary-400"/> Unlimited Patient Records</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary-400"/> All Specialized Roles</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary-400"/> Priority 24/7 Support</li>
                 </ul>
                 
                 <div className="mt-auto">
                   <PaystackButton 
                     {...getPaystackConfig(yearlyPriceNGN, 'yearly')} 
                     text="Subscribe Annually"
                     className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-xl transition-colors shrink-0"
                     onSuccess={(ref: any) => handlePaystackSuccessAction(ref, 'yearly')}
                     onClose={handlePaystackCloseAction}
                   />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            Billing History
          </h2>
        </div>
        <div className="p-8">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl w-full"></div>)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="pb-4">Transaction Ref</th>
                    <th className="pb-4">Plan</th>
                    <th className="pb-4">Amount</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 font-mono text-gray-500">#{tx.reference}</td>
                      <td className="py-4 font-bold capitalize">{tx.plan}</td>
                      <td className="py-4 font-medium text-gray-900">₦{Number(tx.amount).toLocaleString()}</td>
                      <td className="py-4 text-gray-500">{new Date(tx.paid_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> {tx.status}
                        </span>
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
