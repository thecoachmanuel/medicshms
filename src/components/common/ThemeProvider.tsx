'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { generatePalette } from '@/lib/colors';

const ThemeContext = createContext({});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split('/');
  // Detect slug from path: /slug/...
  // Usually the slug is the first part after the domain, unless it's a platform-level page
  const reservedWords = ['login', 'platform-admin', 'admin', 'register', 'api', '_next'];
  const slug = (parts.length > 1 && !reservedWords.includes(parts[1])) 
    ? parts[1] 
    : undefined;

  const { settings, loading } = useSettings(slug);

  useEffect(() => {
    const isPlatformAdmin = pathname.startsWith('/platform-admin');
    
    const root = document.documentElement;
    const clearTheme = () => {
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach(v => {
        root.style.removeProperty(`--primary-${v}`);
        root.style.removeProperty(`--secondary-${v}`);
      });
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--secondary-color');
    };

    if (isPlatformAdmin) {
      clearTheme();
      return;
    }

    if (settings?.primary_color || settings?.theme_color) {
      const primary = settings.primary_color || settings.theme_color || '#2563eb';
      const secondary = settings.secondary_color || '#0f172a';
      
      // Generate full palettes
      const primaryPalette = generatePalette(primary);
      const secondaryPalette = generatePalette(secondary);

      // Apply primary shades
      Object.entries(primaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--primary-${shade}`, color as string);
      });

      // Apply secondary shades
      Object.entries(secondaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--secondary-${shade}`, color as string);
      });
      
      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--secondary-color', secondary);
    } else if (!loading) {
      clearTheme();
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
