'use client';

import { useState, useEffect } from 'react';
import { contentAPI } from '@/lib/api';

export function useContent(page: string, slug?: string) {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await contentAPI.getByPage(page, slug);
      setSections((data as any) || []);
    } catch (error) {
      console.error(`Content hook error for ${page}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [page, slug]);

  const getContent = (sectionKey: string) => {
    const section = sections.find(s => s.section_key === sectionKey);
    return section?.content || {};
  };

  return { sections, loading, getContent, refresh: fetchContent };
}
