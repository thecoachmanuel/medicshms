'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { Settings, Eye, Layout, Save, X, Edit3, Globe } from 'lucide-react';
import Link from 'next/link';

export default function CMSOverlay() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [isVisible, setIsVisible] = useState(true);

  if (!user || user.role !== 'Admin') return null;
  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
      >
        <Settings className="w-5 h-5 animate-spin-slow" />
      </button>
    );
  }

  const editorPath = slug ? `/${slug}/admin/site-editor` : '/admin/site-editor';

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl flex items-center gap-2">
        <div className="flex items-center gap-3 px-4 py-2 border-r border-white/10 mr-2">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Live Editor</p>
            <p className="text-xs font-bold text-white leading-none">Admin Mode</p>
          </div>
        </div>

        <Link 
          href={editorPath}
          className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
          title="Open Full CMS"
        >
          <Layout className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>

        <button 
          onClick={() => window.location.reload()}
          className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
          title="Refresh Views"
        >
          <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => setIsVisible(false)}
          className="p-3 text-white/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
