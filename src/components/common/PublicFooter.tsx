'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Mail, Phone, MapPin, Globe, Share2, Edit3 } from 'lucide-react';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import SectionEditorModal from '@/components/cms/SectionEditorModal';
import HospitalLogo from './HospitalLogo';

export default function PublicFooter({ slug }: { slug?: string }) {
  const { user } = useAuth();
  const { settings } = useSettings(slug);
  const { getContent, refresh } = useContent('common', slug);
  const [isEditing, setIsEditing] = useState(false);
  const isEditor = user?.role === 'Admin' || (user?.role === 'platform_admin' && !slug);

  const footer = getContent('footer');

  return (
    <footer className="bg-gray-900 border-t border-gray-800 pt-20 pb-10 relative">
      {isEditor && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 z-50 p-2 bg-primary-600 text-white rounded-xl shadow-xl hover:scale-110 transition-all group flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Edit Footer</span>
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
        {/* Company Info */}
        <div className="space-y-6">
          <Link href={slug ? `/${slug}` : "/"} className="hover:opacity-80 transition-opacity">
            <HospitalLogo slug={slug} textClassName="text-white" />
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed">
            {footer.description || "Revolutionizing healthcare management with cutting-edge technology and compassionate care. Our platform ensures seamless coordination between patients and doctors."}
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all">
              <Share2 className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all">
              <Heart className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4">
            {['Home', 'About Us', 'Our Services', 'Meet Doctors', 'Contact'].map((item) => {
              const base = item.toLowerCase().split(' ')[0];
              const href = slug ? `/${slug}/${base === 'home' ? '' : base}` : `/${base === 'home' ? '' : base}`;
              return (
                <li key={item}>
                  <Link href={href} className="text-gray-400 text-sm hover:text-primary-500 transition-colors flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary-600"></div>
                    {item}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Departments */}
        <div>
          <h4 className="text-white font-bold mb-6">Departments</h4>
          <ul className="space-y-4">
            {['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics'].map((item) => (
              <li key={item}>
                <Link href="/services" className="text-gray-400 text-sm hover:text-primary-500 transition-colors flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary-600"></div>
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-bold mb-6">Get in Touch</h4>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm text-gray-300">{settings?.address || footer.location || "123 Health Ave, Medical District, NY 10001"}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Phone</p>
                <p className="text-sm text-gray-300">{settings?.contact_phone || footer.phone || "+1 (800) 123-4567"}</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm text-gray-300">{settings?.contact_email || footer.email || "contact@medicshms.com"}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 border-t border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs font-medium">
            © {new Date().getFullYear()} {settings?.hospital_name || getContent('footer').hospital_name || 'MedicsHMS'}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href={slug ? `/${slug}/privacy` : "/privacy"} className="text-gray-500 text-xs hover:text-white transition-colors">Privacy Policy</Link>
            <Link href={slug ? `/${slug}/terms` : "/terms"} className="text-gray-500 text-xs hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {isEditing && (
        <SectionEditorModal 
          pagePath="common"
          sectionKey="footer"
          initialContent={footer}
          onClose={() => setIsEditing(false)}
          onSave={refresh}
        />
      )}
    </footer>
  );
}
