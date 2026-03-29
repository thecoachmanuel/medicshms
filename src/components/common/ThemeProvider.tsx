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
      const color = settings.primary_color || settings.theme_color;
      const secondary = settings.secondary_color || '#0f172a';
      
      const isHex = /^#[0-9A-F]{6}$/i.test(color);
      
      if (isHex) {
        // Helper to adjust brightness
        const adjust = (hex: string, amt: number) => {
          const col = parseInt(hex.slice(1), 16);
          const r = Math.max(0, Math.min(255, (col >> 16) + amt));
          const g = Math.max(0, Math.min(255, ((col >> 8) & 0x00FF) + amt));
          const b = Math.max(0, Math.min(255, (col & 0x0000FF) + amt));
          return "#" + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
        };

        root.style.setProperty('--primary-50', `${color}10`);
        root.style.setProperty('--primary-100', `${color}20`);
        root.style.setProperty('--primary-500', color);
        root.style.setProperty('--primary-600', adjust(color, -20));
        root.style.setProperty('--primary-700', adjust(color, -40));
        
        root.style.setProperty('--secondary-50', '#f8fafc');
        root.style.setProperty('--secondary-500', secondary);
        root.style.setProperty('--secondary-600', adjust(secondary, -20));
        root.style.setProperty('--secondary-700', adjust(secondary, -40));
      } else {
        root.style.setProperty('--primary-500', color);
        root.style.setProperty('--primary-600', color);
        root.style.setProperty('--primary-700', color);
        root.style.setProperty('--secondary-500', secondary);
      }
      
      root.style.setProperty('--primary-color', color);
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
