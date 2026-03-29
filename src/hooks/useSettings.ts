'use client';

import { useState, useEffect } from 'react';
import { siteSettingsAPI } from '@/lib/api';

import { useAuth } from '@/context/AuthContext';

export function useSettings(slug?: string) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchSettings() {
      // If we are still loading auth and don't have a slug, wait
      if (!slug && authLoading) return;

      // If we don't have a slug and we finished loading auth but still no hospital_id, 
      // then we are likely on a platform page or not logged in.
      if (!slug && !user?.hospital_id && !authLoading) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await siteSettingsAPI.get(
          slug ? { slug } : (user?.hospital_id ? { hospital_id: user.hospital_id } : {})
        ) as any;
        
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
  }, [slug, user?.hospital_id, user?.role, authLoading]);

  return { settings, loading };
}
