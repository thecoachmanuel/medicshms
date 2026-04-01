'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useSiteSettings } from '@/context/SettingsContext';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { settings, loading: settingsLoading, slug } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(slug ? `/${slug}/login` : '/login');
    } else if (!authLoading && user) {
      // Direct access check: If user's hospital doesn't match the slug, redirect them
      if (user.role !== 'platform_admin' && user.hospital_slug !== slug) {
        console.error('Multi-tenant mismatch: User hospital slug does not match URL slug');
        router.push(`/${user.hospital_slug}/${user.role.toLowerCase()}/dashboard`);
      }
    }
  }, [user, authLoading, router, slug]);

  const loading = authLoading || settingsLoading;
 
  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">Loading Workspace</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isExpired = user.role !== 'platform_admin' && (
    user.subscription_status === 'expired' || 
    (user.subscription_status === 'trialing' && user.trial_end_date && new Date(user.trial_end_date) < new Date())
  );
  const isPaused = user.role !== 'platform_admin' && user.subscription_status === 'paused';
  const isSuspended = user.role !== 'platform_admin' && user.subscription_status === 'suspended';

  // Calculate days remaining if trialing
  const getTrialDaysRemaining = () => {
    if (user.subscription_status !== 'trialing' || !user.trial_end_date) return null;
    const diff = new Date(user.trial_end_date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialDaysRemaining = getTrialDaysRemaining();

  const pathname = usePathname();
  const isExemptRoute = pathname?.endsWith('/admin/billing') || pathname?.endsWith('/admin/support') || pathname?.endsWith('/admin/subscription');

  if ((isExpired || isPaused || isSuspended) && !isExemptRoute) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 space-y-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-sm
            ${isSuspended ? 'bg-rose-50' : isPaused ? 'bg-amber-50' : 'bg-slate-50'}`}>
            <span className="text-4xl">
              {isSuspended ? '🚫' : isPaused ? '⏸️' : '🔒'}
            </span>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">
              {isSuspended ? 'Account Suspended' : isPaused ? 'Services Paused' : 'Subscription Expired'}
            </h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              {isSuspended 
                ? 'Your access has been suspended due to an administrative decision or policy violation. Please contact support immediately.'
                : isPaused
                ? 'Your hospital workspace is temporarily on hold. You can still access billing to resume services or contact support.'
                : "Your hospital's premium access has ended. Upgrade your plan now to restore all patient records and management features."}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {(isExpired || isPaused) && (
              <Link href={`/${slug}/admin/billing`} className="block w-full btn-primary py-5 rounded-2xl text-lg font-bold shadow-xl shadow-primary-600/20 group text-center no-underline">
                {isPaused ? 'Resume Subscription' : 'Upgrade to Premium'}
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Link>
            )}
            
            {(isSuspended || isPaused) && (
              <Link href={`/${slug}/admin/support`} className="block w-full py-4 rounded-2xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all no-underline">
                Contact Support
              </Link>
            )}
            
            {isExpired && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Payment via Paystack</p>
            )}
          </div>

          <button onClick={() => logout()} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest pt-4 block mx-auto underline decoration-slate-200 underline-offset-8">
            Switch Account / Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 relative">
        <div className="absolute top-0 right-0 w-1/3 h-1/4 bg-primary-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <AdminHeader toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
