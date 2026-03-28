'use client';

import { useState, useEffect } from 'react';
import { siteSettingsAPI } from '@/lib/api';

import { useAuth } from '@/context/AuthContext';

export function useSettings(slug?: string) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await siteSettingsAPI.get(
          slug ? { slug } : (user?.hospital_id ? { hospital_id: user.hospital_id } : {})
        ) as any;
        const themeColor = data?.theme_color || '#2563eb';
        setSettings({
          ...data,
          theme_color: themeColor
        });
        
        // Apply theme color to CSS variables
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--primary-color', themeColor);
          // Optional: generate shades or specific classes if needed
        }
      } catch (error) {
        console.error('Settings hook error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();

    // Listen for custom "medics-settings-updated" event to refresh settings globally
    const handleRefresh = () => {
      setLoading(true);
      fetchSettings();
    };

    window.addEventListener('medics-settings-updated', handleRefresh);
    return () => window.removeEventListener('medics-settings-updated', handleRefresh);
  }, [slug, user?.hospital_id, user?.role]);

  return { settings, loading };
}
