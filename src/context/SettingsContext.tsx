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
  hasFeature: (feature: string) => boolean;
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
    try {
      let params: any = { slug };
      
      // Domain-based resolution for custom domains
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const platformDomains = ['medicshms.com', 'localhost', 'www.medicshms.com', 'medicshms.vercel.app'];
        
        // If it's not a platform domain, try to resolve by domain
        if (!platformDomains.some(d => hostname.includes(d))) {
          params = { domain: hostname };
        }
      }

      const res = await siteSettingsAPI.get(params) as any;
      
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

  const hasFeature = (featureName: string): boolean => {
    if (!settings?.plan?.features) return false;
    // Allow case-insensitive matching and partial matches for flexibility
    return settings.plan.features.some((f: string) => 
      f.toLowerCase().includes(featureName.toLowerCase())
    );
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, slug, pathname, hasFeature }}>
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
