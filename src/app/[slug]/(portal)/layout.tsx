'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useSettings } from '@/hooks/useSettings';

export default function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { slug } = React.use(params);
  const { settings, loading: settingsLoading } = useSettings(slug);
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

  // Compute theme color: Use settings color or fallback to standard primary
  const themeColor = settings?.theme_color || '#2563eb';

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

  // Calculate days remaining if trialing
  const getTrialDaysRemaining = () => {
    if (user.subscription_status !== 'trialing' || !user.trial_end_date) return null;
    const diff = new Date(user.trial_end_date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialDaysRemaining = getTrialDaysRemaining();

  if (isExpired || isPaused) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 space-y-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <span className="text-4xl">{isPaused ? '⏸️' : '🔒'}</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">
              {isPaused ? 'Services Paused' : 'Subscription Expired'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isPaused 
                ? 'Your hospital access has been temporarily paused by the system administrator. Please contact support for more information.'
                : "Your hospital's access has ended. Upgrade now to restore all features and records."}
            </p>
          </div>
          {!isPaused && (
            <div className="space-y-4">
              <Link href={`/${slug}/admin/billing`} className="block w-full btn-primary py-5 rounded-2xl text-lg font-bold shadow-xl shadow-primary-600/20 group text-center no-underline">
                Upgrade to Premium
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Link>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Payment via Paystack</p>
            </div>
          )}
          <button onClick={() => logout()} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden" style={{ '--primary-600': themeColor } as any}>
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
