'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

const ThemeContext = createContext({});

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
    
    // If it's platform admin, we should NOT apply any tenant-specific theme
    if (isPlatformAdmin) {
      const root = document.documentElement;
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--primary-50');
      root.style.removeProperty('--primary-100');
      root.style.removeProperty('--primary-500');
      root.style.removeProperty('--primary-600');
      root.style.removeProperty('--primary-700');
      return;
    }

    if (settings?.theme_color || settings?.primary_color) {
      const color = settings.primary_color || settings.theme_color;
      document.documentElement.style.setProperty('--primary-color', color);
      
      const root = document.documentElement;
      const isHex = /^#[0-9A-F]{6}$/i.test(color);
      
      root.style.setProperty('--primary-50', isHex ? `${color}10` : color);
      root.style.setProperty('--primary-100', isHex ? `${color}20` : color);
      root.style.setProperty('--primary-500', color);
      root.style.setProperty('--primary-600', color);
      root.style.setProperty('--primary-700', color);
    } else if (!loading) {
      // Clear properties to use defaults from CSS only if we're done loading and no theme was found
      const root = document.documentElement;
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--primary-50');
      root.style.removeProperty('--primary-100');
      root.style.removeProperty('--primary-500');
      root.style.removeProperty('--primary-600');
      root.style.removeProperty('--primary-700');
    }
  }, [settings, pathname, loading]);

  // If we're loading settings for a specific tenant, block render to prevent flicker
  if (loading && slug) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
}
