'use client';

import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, use } from 'react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';
import CMSOverlay from '@/components/cms/CMSOverlay';

export default function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { settings, loading: settingsLoading } = useSettings(slug);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!settingsLoading && settings?.maintenance_mode && !authLoading) {
      if (user?.role !== 'Admin' && !pathname.includes('/maintenance')) {
        router.push(`/${slug}/maintenance`);
      }
    }
  }, [settings, settingsLoading, user, authLoading, router, pathname, slug]);

  if (settingsLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="h-4 w-32 bg-slate-100 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader slug={slug} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter slug={slug} />
      <CMSOverlay />
    </div>
  );
}
