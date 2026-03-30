'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X, Phone, Calendar, Edit3 } from 'lucide-react';
import { useSiteSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useContent } from '@/hooks/useContent';
import SectionEditorModal from '@/components/cms/SectionEditorModal';
import { clsx } from 'clsx';

const getNavLinks = (slug?: string) => [
  { name: 'Home', href: slug ? `/${slug}` : '/' },
  { name: 'About', href: slug ? `/${slug}/about` : '/about' },
  { name: 'Services', href: slug ? `/${slug}/services` : '/services' },
  { name: 'Contact', href: slug ? `/${slug}/contact` : '/contact' },
];

import HospitalLogo from './HospitalLogo';

export default function PublicHeader({ slug: propSlug, settings: initialSettings }: { slug?: string, settings?: any }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings: contextSettings, loading, slug } = useSiteSettings();
  const settings = initialSettings || contextSettings;
  const { getContent, refresh } = useContent('common', slug);
  const NAV_LINKS = getNavLinks(slug);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isEditor = user?.role === 'Admin' || (user?.role === 'platform_admin' && !slug);
  const header = getContent('header');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={clsx(
      "sticky top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/80 backdrop-blur-md shadow-lg py-3" : "bg-white py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href={slug ? `/${slug}` : "/"}>
          <HospitalLogo slug={slug} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className={clsx(
                "text-sm font-bold transition-colors",
                pathname === link.href ? "text-primary-600" : "text-gray-600 hover:text-primary-500"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href={slug ? `/${slug}/contact` : "/contact"} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 transition-colors mr-4">
            <Phone className="w-4 h-4" />
            <span>Emergency: {settings?.emergency_phone || '+1 (800) 123-4567'}</span>
          </Link>
          {user ? (
            <Link 
              href={user.role === 'platform_admin' ? '/platform-admin/dashboard' : `/${slug || user.hospital_slug || ''}/${user.role.toLowerCase()}/dashboard`} 
              className="bg-secondary-900 text-white py-2.5 px-6 rounded-xl shadow-lg shadow-secondary-900/20 hover:bg-secondary-800 transition-all font-bold text-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link href={slug ? `/${slug}/login` : "/login"} className="bg-secondary-900 text-white py-2.5 px-6 rounded-xl shadow-lg shadow-secondary-900/20 hover:bg-secondary-800 transition-all font-bold text-sm">
              Portal Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {isEditor && (
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 bg-primary-600 text-white rounded-lg shadow-lg hover:scale-110 transition-all group flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-gray-600">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isEditing && (
        <SectionEditorModal 
          pagePath="common"
          sectionKey="header"
          initialContent={header}
          onClose={() => setIsEditing(false)}
          onSave={refresh}
        />
      )}

      {/* Mobile Nav */}
      <div className={clsx(
        "fixed inset-0 top-[72px] bg-white z-40 md:hidden transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 space-y-6">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={clsx(
                "block text-2xl font-black transition-colors",
                pathname === link.href ? "text-primary-600" : "text-gray-900 border-b border-gray-100 pb-2"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-6 space-y-4">
            {user ? (
              <Link 
                href={user.role === 'platform_admin' ? '/platform-admin/dashboard' : `/${slug || user.hospital_slug || ''}/${user.role.toLowerCase()}/dashboard`} 
                onClick={() => setIsOpen(false)}
                className="block w-full btn-primary text-center py-4 rounded-2xl"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link 
                href={slug ? `/${slug}/login` : "/login"} 
                onClick={() => setIsOpen(false)}
                className="block w-full btn-primary text-center py-4 rounded-2xl"
              >
                Portal Login
              </Link>
            )}
            <div className="flex items-center justify-center gap-2 text-gray-500 font-bold">
              <Phone className="w-4 h-4" />
              <span>Emergency: {settings?.emergency_phone || '+1 (800) 123-4567'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
