'use client';

import { useState, useEffect } from 'react';
import { siteSettingsAPI } from '@/lib/api';

import { useAuth } from '@/context/AuthContext';

export function useSettings(slug?: string) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function fetchSettings() {
      // Don't start fetching if we don't have enough info yet
      if (!slug && !user?.hospital_id) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await siteSettingsAPI.get(
          slug ? { slug } : (user?.hospital_id ? { hospital_id: user.hospital_id } : {})
        ) as any;
        
        if (!isMounted) return;

        const primaryColor = data?.primary_color || data?.theme_color || '#2563eb';
        const secondaryColor = data?.secondary_color || '#0f172a';
        
        setSettings({
          ...data,
          primary_color: primaryColor,
          secondary_color: secondaryColor
        });
      } catch (error) {
        console.error('Settings hook error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSettings();

    const handleRefresh = () => {
      setLoading(true);
      fetchSettings();
    };

    window.addEventListener('medics-settings-updated', handleRefresh);
    return () => {
      isMounted = false;
      window.removeEventListener('medics-settings-updated', handleRefresh);
    };
  }, [slug, user?.hospital_id]);

  return { settings, loading };
}
