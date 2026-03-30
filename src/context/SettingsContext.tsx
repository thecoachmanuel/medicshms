'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { siteSettingsAPI } from '@/lib/api';

interface SettingsContextType {
  settings: any;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  slug: string | undefined;
  pathname: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  // Detect slug from URL consistently
  const slug = useMemo(() => {
    const parts = pathname.split('/');
    // Reserved top-level paths that are NOT tenant slugs
    const reservedWords = ['platform-admin', 'api', '_next', 'static', 'favicon.ico', 'login', 'maintenance'];
    const firstPart = parts[1];
    
    return (parts.length > 1 && firstPart && !reservedWords.includes(firstPart)) 
      ? firstPart 
      : undefined;
  }, [pathname]);

  const fetchSettings = async () => {
    // If still loading auth and no slug (platform page), we can proceed to fetch platform settings
    // If it's a tenant page (slug exists), we wait for auth if needed (though usually we don't need auth for public settings)

    try {
      const res = await siteSettingsAPI.get({ slug }) as any;
      
      if (res?.data) {
        // Prioritize theme_color as it's the one edited in the Settings UI
        const primaryColor = res.data.theme_color || res.data.primary_color || '#2563eb';
        const secondaryColor = res.data.secondary_color || '#0f172a';
        
        setSettings({
          ...res.data,
          primary_color: primaryColor,
          theme_color: primaryColor,
          secondary_color: secondaryColor
        });
      }
    } catch (error) {
      console.error('SettingsProvider fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [slug, user?.hospital_id, authLoading]);

  // Listen for global refresh events (e.g. from Settings page)
  useEffect(() => {
    const handleRefresh = () => {
      setLoading(true);
      fetchSettings();
    };
    window.addEventListener('medics-settings-updated', handleRefresh);
    return () => window.removeEventListener('medics-settings-updated', handleRefresh);
  }, [slug, user?.hospital_id, authLoading]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, slug, pathname }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SettingsProvider');
  }
  return context;
};
