'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layout, Globe, Image as ImageIcon, Type, 
  Save, Loader2, RefreshCw, ChevronRight,
  Home, Info, Briefcase, Phone, Plus, Trash2,
  AlertCircle, Eye, Upload, List
} from 'lucide-react';
import { contentAPI, uploadAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Default Templates for Sections
const TEMPLATES: any = {
  home: {
    hero: { title: "Compassionate Care, Advanced Technology.", description: "We provide world-class medical services...", image_url: "", button_primary: "Book Consultation", button_secondary: "Portal Login", badge_text: "5000+ Happy Patients" },
    stats: [
        { label: "Specialist Doctors", value: "150+" },
        { label: "Patient Recovered", value: "45k+" },
        { label: "Success Rate", value: "98%" },
        { label: "Years Experience", value: "25+" }
    ],
    departments_intro: { tagline: "Our Departments", title: "Comprehensive Care in Every Specialty", description: "Equipped with state-of-the-art technology..." },
    departments_list: [
        { name: "Emergency", desc: "24/7 critical response", icon_name: "Activity" },
        { name: "Cardiology", desc: "Expert heart care", icon_name: "Heart" }
    ],
    doctors_section: { tagline: "Our Specialists", title: "Learn from Our Renowned Medical Professionals", button_text: "View All Doctors" },
    doctors_list: [
        { name: "Dr. Sarah Johnson", role: "Senior Surgeon", specialty: "Cardiology", image_url: "" },
        { name: "Dr. Michael Chen", role: "Chief Medical Officer", specialty: "Neurology", image_url: "" }
    ],
    cta: { title: "Ready to Experience Better Healthcare Management?", description: "Book your appointment today...", button_primary: "Book Visit Now", button_secondary: "Learn About MedicsHMS" }
  },
  about: {
    about_header: { tagline: "Our Story", title_part1: "A Legacy of", title_part2: "Care and Innovation", description: "Founded on the principles of empathy...", image_url: "", stat1_label: "Years of Excellence", stat1_value: "25+", stat2_label: "Staff Members", stat2_value: "500+" },
    mission: { title: "Our Mission", description: "To provide world-class, affordable healthcare to all..." },
    vision: { title: "Our Vision", description: "To become the most trusted healthcare partner globally..." },
    values_intro: { tagline: "Our Values", title: "The Pillars of MedicsHMS" },
    values_list: [
        { title: "Compassion", desc: "Treating with empathy", icon_name: "Heart" },
        { title: "Excellence", desc: "Clinical perfection", icon_name: "Zap" },
        { title: "Innovation", desc: "Pushing boundaries", icon_name: "Activity" }
    ]
  },
  services: {
    services_header: { tagline: "What We Do", title_part1: "Advanced Healthcare", title_part2: "Tailored for You.", description: "We offer a wide range of medical services..." },
    services_list: [
        { title: "General Checkup", desc: "Regular health screenings", icon_name: "Activity" },
        { title: "Cardiology", desc: "Expert heart care", icon_name: "Heart" }
    ],
    process_cta: { title: "Experience Seamless Patient Care Journey", button_text: "Get Started Today", subtext: "No payment required for booking" }
  },
  contact: {
    contact_header: { tagline: "Get in Touch", title: "Contact Us", description: "We are here for you 24/7." },
    contact_info: { email: "", phone: "", address: "", emergency: "" },
    quick_access: [
        { title: "Emergency", desc: "Call 911 for immediate help", path: "/emergency" },
        { title: "Portal", desc: "Access your records", path: "/login" }
    ]
  }
};

export default function SiteEditorPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [content, setContent] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const pages = [
    { id: 'home', icon: Home, label: 'Home Page' },
    { id: 'about', icon: Info, label: 'About Us' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'contact', icon: Phone, label: 'Contact Info' },
  ];

  useEffect(() => {
    fetchContent();
  }, [activePage]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await contentAPI.getByPage(activePage) as any;
      const data = Array.isArray(res) ? res : res.data || [];
      setContent(data);
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
      await contentAPI.update(content);
      toast.success('Page content published successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const initializePage = () => {
      const template = TEMPLATES[activePage] || {};
      const newSections = Object.keys(template).map(key => ({
          page_path: activePage,
          section_key: key,
          content: template[key],
          updated_at: new Date().toISOString()
      }));
      setContent(newSections);
      toast.success(`Standard ${activePage} sections initialized`);
  };

  const addCustomSection = () => {
      const section_key = prompt("Enter a key for this section (e.g., 'highlights')");
      if (!section_key) return;

      const newSection = {
          page_path: activePage,
          section_key: section_key.toLowerCase().replace(/ /g, '_'),
          content: { title: "", description: "" },
          updated_at: new Date().toISOString()
      };
      setContent([...content, newSection]);
  };

  const handleImageUpload = async (sectionKey: string, fieldKey: string, file: File) => {
    try {
        setUploading(`${sectionKey}:${fieldKey}`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'site-content');
        
        const res = await uploadAPI.upload(formData) as any;
        const section = content.find(s => s.section_key === sectionKey);
        if (section) {
            handleUpdateSection(sectionKey, { ...section.content, [fieldKey]: res.url });
        }
        toast.success('Image uploaded');
    } catch (error) {
        toast.error('Upload failed');
    } finally {
        setUploading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Public Site Editor</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Customize your hospital's online presence</p>
        </div>
        <div className="flex items-center gap-3">
            <a href={`/${activePage === 'home' ? '' : activePage}`} target="_blank" className="btn-secondary border-none hover:bg-gray-100 px-4">
                <Eye className="w-4 h-4" /> Preview
            </a>
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-[140px] shadow-xl shadow-primary-600/20">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
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
                  activePage === page.id ? "bg-primary-50 text-primary-600" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                    activePage === page.id ? "bg-white shadow-sm" : "bg-gray-50 group-hover:scale-110"
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
                <div className="flex flex-col items-center justify-center py-24 card border-dashed border-2 border-slate-200 bg-slate-50 rounded-[3rem]">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                        <Layout className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-black uppercase tracking-[0.2em] text-xs">No Content Found</h3>
                    <p className="text-slate-400 text-xs mt-2 font-medium mb-8">Start by initializing the standard page sections</p>
                    <button onClick={initializePage} className="btn-primary px-8 rounded-2xl">
                        <Plus className="w-4 h-4" /> Initialize {activePage} Sections
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {content.map((section, idx) => (
                        <div key={idx} className="card p-8 space-y-8 relative group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                                        {Array.isArray(section.content) ? <List className="w-5 h-5 text-primary-600" /> : <Type className="w-5 h-5 text-primary-600" />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                                            {section.section_key.replace('_', ' ')} Section
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Page: {section.page_path}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setContent(content.filter(s => s.section_key !== section.section_key))}
                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                {Array.isArray(section.content) ? (
                                    <div className="space-y-4">
                                        {section.content.map((item: any, itemIdx: number) => (
                                            <div key={itemIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 relative">
                                                <div className="absolute top-4 right-4">
                                                    <button 
                                                        onClick={() => {
                                                            const newList = [...section.content];
                                                            newList.splice(itemIdx, 1);
                                                            handleUpdateSection(section.section_key, newList);
                                                        }}
                                                        className="text-slate-300 hover:text-rose-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.keys(item).map(ikey => (
                                                        <div key={ikey} className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ikey}</label>
                                                            <input 
                                                                type="text"
                                                                value={item[ikey]}
                                                                onChange={(e) => {
                                                                    const newList = [...section.content];
                                                                    newList[itemIdx] = { ...item, [ikey]: e.target.value };
                                                                    handleUpdateSection(section.section_key, newList);
                                                                }}
                                                                className="input py-2 text-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newItem = section.content[0] ? Object.fromEntries(Object.keys(section.content[0]).map(k => [k, ""])) : {};
                                                handleUpdateSection(section.section_key, [...section.content, newItem]);
                                            }}
                                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-sm font-bold text-slate-400 hover:text-primary-600 hover:border-primary-100 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add Item
                                        </button>
                                    </div>
                                ) : (
                                    Object.keys(section.content).map((key) => {
                                        const isImage = key.includes('image') || key.includes('url') || key.includes('photo');
                                        const isLongText = key.includes('description') || key.includes('content') || key.includes('desc') || key.includes('address');
                                        
                                        return (
                                            <div key={key} className="space-y-2">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {key.split('_').join(' ')}
                                                    </label>
                                                </div>
                                                
                                                {isImage ? (
                                                    <div className="flex flex-col md:flex-row gap-6">
                                                        <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                                                            {section.content[key] ? (
                                                                <img src={section.content[key]} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="w-8 h-8 text-slate-300" />
                                                            )}
                                                            <label className="absolute inset-0 bg-primary-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                                <Upload className="w-6 h-6 text-white" />
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    accept="image/*" 
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleImageUpload(section.section_key, key, file);
                                                                    }}
                                                                />
                                                            </label>
                                                            {uploading === `${section.section_key}:${key}` && (
                                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                             <input 
                                                                type="text" 
                                                                value={section.content[key] || ''}
                                                                onChange={(e) => handleUpdateSection(section.section_key, { ...section.content, [key]: e.target.value })}
                                                                placeholder="Paste direct URL or upload using the icon"
                                                                className="input py-3 text-xs font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : isLongText ? (
                                                    <textarea 
                                                        value={section.content[key] || ''}
                                                        onChange={(e) => handleUpdateSection(section.section_key, { ...section.content, [key]: e.target.value })}
                                                        className="input py-3 min-h-[120px] text-sm"
                                                    />
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        value={section.content[key] || ''}
                                                        onChange={(e) => handleUpdateSection(section.section_key, { ...section.content, [key]: e.target.value })}
                                                        className="input py-3"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={addCustomSection}
                        className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-bold uppercase tracking-[0.3em] text-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3"
                    >
                        <Plus className="w-5 h-5" /> Add Custom Content Section
                    </button>
                </div>
            )}

            <div className="p-8 bg-slate-900 rounded-[3rem] border border-slate-800 flex items-start gap-6 shadow-2xl">
               <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shrink-0">
                   <AlertCircle className="w-6 h-6 text-white" />
               </div>
               <div>
                   <p className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Publishing Protocol</p>
                   <p className="text-xs text-slate-400 leading-relaxed font-bold">Changes will be saved to our cloud servers immediately but may take up to 60 seconds to reflect on your public website due to global edge caching. Always preview before publishing.</p>
               </div>
            </div>
        </main>
      </div>
    </div>
  );
}
