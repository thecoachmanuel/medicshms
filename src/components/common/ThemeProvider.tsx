'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

interface ThemeContextType {
  settings: any;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ settings: null, loading: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split('/');
  
  // Detect slug from path: /slug/...
  const slug = (parts.length > 1 && parts[1] !== 'login' && parts[1] !== 'platform-admin' && parts[1] !== 'admin') 
    ? parts[1] 
    : undefined;

  const { settings, loading } = useSettings(slug);

  useEffect(() => {
    const isPlatformAdmin = pathname.startsWith('/platform-admin');
    const root = document.documentElement;
    
    if (isPlatformAdmin) {
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--primary-50');
      root.style.removeProperty('--primary-100');
      root.style.removeProperty('--primary-500');
      root.style.setProperty('--primary-600', '#2563eb');
      root.style.removeProperty('--primary-700');
      return;
    }

    const color = settings?.primary_color || settings?.theme_color || '#2563eb';
    const isHex = /^#[0-9A-F]{6}$/i.test(color);
    
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-50', isHex ? `${color}10` : color);
    root.style.setProperty('--primary-100', isHex ? `${color}20` : color);
    root.style.setProperty('--primary-500', color);
    root.style.setProperty('--primary-600', color);
    root.style.setProperty('--primary-700', color);

  }, [settings, pathname]);

  // To avoid theme flicker, we wait for settings if we have a slug
  if (slug && loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ settings, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
