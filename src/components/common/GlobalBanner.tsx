'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Bell } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Banner {
  _id: string;
  message: string;
  link_text?: string;
  link_url?: string;
  background_color?: string;
  text_color?: string;
}

export default function GlobalBanner({ slug }: { slug?: string }) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const url = slug ? `/api/site-updates/active?slug=${slug}` : '/api/site-updates/active';
        const res = await axios.get(url);
        if (res.data?.banner) {
          setBanner(res.data.banner);
          // Check if user dismissed this specific banner
          const dismissed = localStorage.getItem(`dismissed-banner-${res.data.banner._id}`);
          if (!dismissed) {
             setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [slug]);

  const handleDismiss = () => {
    if (banner) {
      localStorage.setItem(`dismissed-banner-${banner._id}`, 'true');
    }
    setIsVisible(false);
  };

  if (loading || !banner || !isVisible) return null;

  return (
    <div 
      className="relative z-[60] py-3 px-4 md:px-8 text-center animate-in fade-in slide-in-from-top duration-500"
      style={{ 
        backgroundColor: banner.background_color || '#0f172a',
        color: banner.text_color || '#ffffff'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 pr-10">
        <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-white/10">
           <Bell className="w-3.5 h-3.5" />
        </div>
        <p className="text-xs md:text-sm font-bold tracking-tight leading-none py-1">
          {banner.message}
        </p>
        {banner.link_url && (
          <Link 
            href={banner.link_url}
            className="inline-flex items-center gap-1 xl:gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] xl:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap"
          >
            {banner.link_text || 'Learn More'}
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      <button 
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
