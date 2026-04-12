'use client';

import { useSiteSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import CMSOverlay from '@/components/cms/CMSOverlay';
import GlobalBanner from '@/components/common/GlobalBanner';

export default function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { settings, loading: settingsLoading, slug } = useSiteSettings();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!settingsLoading && settings?.maintenance_mode && !authLoading) {
      const isStaff = user?.role === 'Admin' || user?.role === 'Doctor' || user?.role === 'Receptionist' || user?.role === 'Platform Admin';
      const isMaintenancePage = pathname.endsWith('/maintenance');
      
      if (!isStaff && !isMaintenancePage) {
        router.push(`/${slug}/maintenance`);
      }
    }
  }, [settings, settingsLoading, user, authLoading, router, pathname, slug]);

  if (settingsLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-50 rounded-full blur-[100px] -ml-48 -mb-48 opacity-50" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
      
      <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-gray-900 flex items-center justify-center shadow-2xl shadow-gray-900/20">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center animate-bounce shadow-lg">
            <div className="w-4 h-4 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Synchronizing Hospital Feed</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-primary-200 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const isStaff = user?.role === 'Admin' || user?.role === 'Doctor' || user?.role === 'Receptionist' || user?.role === 'Platform Admin';
  const isMaintenancePage = pathname.endsWith('/maintenance');
  const showHeaderFooter = !settings?.maintenance_mode || isStaff || !isMaintenancePage;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showHeaderFooter && <GlobalBanner slug={slug} settings={settings} />}
      {showHeaderFooter && <PublicHeader slug={slug} settings={settings} />}
      <main className="flex-1">
        {children}
      </main>
      {showHeaderFooter && <PublicFooter slug={slug} settings={settings} />}
      <CMSOverlay />
    </div>
  );
}
