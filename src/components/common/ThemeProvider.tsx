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

  const { settings } = useSettings(slug);

  useEffect(() => {
    const isPlatformAdmin = pathname.startsWith('/platform-admin');
    
    // If it's platform admin, we should NOT apply any tenant-specific theme
    // We can either clear the properties or let them stay as defaults
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

    if (settings?.theme_color) {
      document.documentElement.style.setProperty('--primary-color', settings.theme_color);
      
      const root = document.documentElement;
      // Use hex opacity if it's a hex color, otherwise fallback
      const color = settings.theme_color;
      const isHex = /^#[0-9A-F]{6}$/i.test(color);
      
      root.style.setProperty('--primary-50', isHex ? `${color}10` : color);
      root.style.setProperty('--primary-100', isHex ? `${color}20` : color);
      root.style.setProperty('--primary-500', color);
      root.style.setProperty('--primary-600', color);
      root.style.setProperty('--primary-700', color);
    } else {
      // Clear properties to use defaults from CSS
      const root = document.documentElement;
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--primary-50');
      root.style.removeProperty('--primary-100');
      root.style.removeProperty('--primary-500');
      root.style.removeProperty('--primary-600');
      root.style.removeProperty('--primary-700');
    }
  }, [settings, pathname]);

  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
}
