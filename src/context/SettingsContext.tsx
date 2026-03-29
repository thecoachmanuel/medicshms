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
    const reservedWords = ['login', 'platform-admin', 'admin', 'register', 'api', '_next'];
    return (parts.length > 1 && !reservedWords.includes(parts[1])) 
      ? parts[1] 
      : undefined;
  }, [pathname]);

  const fetchSettings = async () => {
    // If still loading auth and no slug, wait
    if (!slug && authLoading) return;

    // Handle platform/non-tenant pages
    if (!slug && !user?.hospital_id && !authLoading) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const res = await siteSettingsAPI.get(
        slug ? { slug } : (user?.hospital_id ? { hospital_id: user.hospital_id } : {})
      ) as any;
      
      if (res?.data) {
        const primaryColor = res.data.primary_color || res.data.theme_color || '#2563eb';
        const secondaryColor = res.data.secondary_color || '#0f172a';
        
        setSettings({
          ...res.data,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          theme_color: primaryColor // Consistency alias
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
