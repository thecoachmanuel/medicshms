'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layout, Globe, Image as ImageIcon, Type, 
  Save, Loader2, RefreshCw, ChevronRight,
  Home, Info, Briefcase, Phone, Plus, Trash2,
  AlertCircle, Eye, Sidebar
} from 'lucide-react';
import { contentAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PlatformSiteEditorPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [content, setContent] = useState<any[]>([]);

  const pages = [
    { id: 'home', icon: Home, label: 'Home Page' },
    { id: 'about', icon: Info, label: 'About Us' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'contact', icon: Phone, label: 'Contact Info' },
    { id: 'common', icon: Layout, label: 'Header & Footer' },
  ];

  useEffect(() => {
    fetchContent();
  }, [activePage]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Fetch platform-level content (hospital_id is null)
      const res = await contentAPI.getByPage(activePage) as any;
      setContent(Array.isArray(res) ? res : res.data || []);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast.error('Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = (sectionKey: string, newData: any) => {
    setContent(prev => prev.map(item => 
      item.section_key === sectionKey ? { ...item, content: newData } : item
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure we explicitly mark hospital_id as null for platform content
      const payload = content.map(item => ({
        ...item,
        hospital_id: null
      }));
      await contentAPI.update(payload);
      toast.success('Platform site content updated successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const addSection = (key: string) => {
      const newSection = {
          page_path: activePage,
          section_key: key,
          content: {},
          hospital_id: null
      };
      setContent([...content, newSection]);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Platform Content Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Directly edit the main landing page and platform-wide sections.</p>
        </div>
        <div className="flex items-center gap-3">
            <a href={`/${activePage === 'home' || activePage === 'common' ? '' : activePage}`} target="_blank" className="btn-secondary border-none hover:bg-gray-100 px-4">
                <Eye className="w-4 h-4" /> Preview Site
            </a>
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[140px] bg-slate-900 hover:bg-slate-800">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Publish Changes</>}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 border-r border-gray-100 pr-8 space-y-1">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                  activePage === page.id ? "bg-slate-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                    activePage === page.id ? "bg-white/10" : "bg-gray-50 group-hover:scale-110"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">{page.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4", activePage === page.id ? "opacity-100" : "opacity-0")} />
              </button>
            );
          })}
        </aside>

        <main className="lg:col-span-3 space-y-8">
            {content.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 card border-dashed border-2 border-gray-200 bg-gray-50">
                    <Layout className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No sections found for this page</p>
                    <button onClick={() => addSection('hero')} className="mt-4 text-primary-600 font-bold flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Section
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {content.map((section, idx) => (
                        <div key={idx} className="card p-8 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Type className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">
                                        Section: {section.section_key}
                                    </h3>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {section.updated_at ? `Last Change: ${new Date(section.updated_at).toLocaleDateString()}` : 'New Section'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {Object.keys(section.content).map((key) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            {key.split('_').join(' ')}
                                        </label>
                                        {key.includes('description') || key.includes('text') || key.includes('address') || key.includes('bio') ? (
                                            <textarea 
                                                value={section.content[key]}
                                                onChange={(e) => handleUpdateSection(section.section_key, { ...section.content, [key]: e.target.value })}
                                                className="input py-3 min-h-[100px]"
                                            />
                                        ) : (
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={section.content[key]}
                                                    onChange={(e) => handleUpdateSection(section.section_key, { ...section.content, [key]: e.target.value })}
                                                    className="input py-3"
                                                />
                                                {key.includes('image') || key.includes('url') ? (
                                                    <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {Object.keys(section.content).length === 0 && (
                                    <p className="text-gray-400 text-xs italic">Section exists but has no editable fields yet.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4 shadow-sm">
               <AlertCircle className="w-6 h-6 text-slate-500 mt-0.5" />
               <div>
                   <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">Global Content Editing</p>
                   <p className="text-xs text-slate-600 leading-relaxed font-medium">These changes affect the main platform website only. Section "common/footer" and "common/header" control platform-wide navigation and branding visibility. For hospital-specific changes, go to the hospital settings.</p>
               </div>
            </div>
        </main>
      </div>
    </div>
  );
}
