'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Bell, Moon, Sun, 
  Globe, Lock, Database, RefreshCw,
  AlertCircle, ChevronRight, CheckCircle2,
  Save, Loader2, Hospital, Mail, Phone, MapPin,
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { siteSettingsAPI, uploadAPI } from '@/lib/api';
import { generatePalette } from '@/lib/colors';
import { useSiteSettings } from '@/context/SettingsContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SiteSettings {
  hospital_name: string;
  hospital_short_name: string;
  logo_url: string;
  theme_color: string;
  secondary_color: string;
  contact_email: string;
  contact_phone: string;
  emergency_phone: string;
  address: string;
  maintenance_mode: boolean;
  sms_notifications: boolean;
  allow_public_registration: boolean;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  security_settings: {
    password_min_length: number;
    require_special_char: boolean;
  };
  [key: string]: any;
}

export default function PlatformSettingsPage() {
  const { settings: globalSettings, loading: globalLoading, refreshSettings } = useSiteSettings();
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SiteSettings>({
    hospital_name: 'MedicsHMS',
    hospital_short_name: 'Medics',
    logo_url: '',
    theme_color: '#2563eb',
    secondary_color: '#0f172a',
    contact_email: '',
    contact_phone: '',
    emergency_phone: '',
    address: '',
    maintenance_mode: false,
    sms_notifications: true,
    allow_public_registration: true,
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    security_settings: {
      password_min_length: 8,
      require_special_char: true,
    }
  });

  useEffect(() => {
    if (globalSettings) {
      const sanitized = { ...globalSettings };
      Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === null) sanitized[key] = '';
      });
      setSettings(prev => ({ ...prev, ...sanitized }));
    }
  }, [globalSettings]);

  useEffect(() => {
    if (settings.theme_color || settings.secondary_color) {
      const root = document.documentElement;
      const primary = settings.theme_color || '#2563eb';
      const secondary = settings.secondary_color || '#0f172a';

      // Generate full palettes
      const primaryPalette = generatePalette(primary);
      const secondaryPalette = generatePalette(secondary);

      // Apply primary shades
      Object.entries(primaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--primary-${shade}`, color as string);
      });

      // Apply secondary shades
      Object.entries(secondaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--secondary-${shade}`, color as string);
      });
      
      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--secondary-color', secondary);
    }
  }, [settings.theme_color, settings.secondary_color]);

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'platform-branding');
      
      const res = await uploadAPI.upload(formData) as any;
      setSettings({ ...settings, logo_url: res.url });
      toast.success('Platform logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSyncing(true);
      // For platform settings, hospital_id is null
      const updatedSettings = {
        ...settings,
        hospital_id: null,
        primary_color: settings.theme_color || settings.primary_color,
        theme_color: settings.theme_color || settings.primary_color
      };
      
      await siteSettingsAPI.update(updatedSettings);
      
      // Refresh global settings context
      await refreshSettings();
      
      toast.success('Platform settings synchronized successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync platform changes');
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    { id: 'general', icon: Settings, label: 'Platform Branding' },
    { id: 'security', icon: Lock, label: 'Platform Security' },
    { id: 'notifications', icon: Bell, label: 'System Emails' },
    { id: 'database', icon: Database, label: 'Maintenance' },
  ];

  if (globalLoading && !settings.hospital_name) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">Platform Settings</h1>
          <p className="text-slate-500 font-medium mt-1 italic">Configure the global brand identity and administrative defaults for MedicsHMS.</p>
        </div>
        <button onClick={handleSave} disabled={syncing} className="btn-primary min-w-[160px] bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95">
          {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Sync Platform</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 border-r border-gray-100 pr-8 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                  activeTab === tab.id ? "bg-slate-900 text-white shadow-xl" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                    activeTab === tab.id ? "bg-white/10" : "bg-gray-50 group-hover:scale-110"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">{tab.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4", activeTab === tab.id ? "opacity-100" : "opacity-0")} />
              </button>
            );
          })}
        </aside>

        <main className="lg:col-span-3 space-y-8">
           {activeTab === 'general' && (
             <div className="space-y-6">
                <div className="card p-8 space-y-10 border-slate-50 shadow-xl shadow-slate-200/40">
                   <div className="space-y-8">
                      <div className="flex items-start justify-between border-b border-slate-50 pb-6">
                         <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-900">Platform Identity</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Global logos and master theme colors</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col xl:flex-row gap-12">
                         <div className="w-32 h-32 bg-white shadow-2xl shadow-slate-200/60 border-2 border-slate-50 rounded-[2.5rem] flex items-center justify-center relative group overflow-hidden transition-all hover:scale-105 shrink-0">
                            {settings.logo_url ? (
                               <img 
                                 src={settings.logo_url} 
                                 alt="Platform Logo" 
                                 className="w-full h-full object-contain p-4" 
                               />
                            ) : (
                               <Shield className="w-12 h-12 text-slate-200" />
                            )}
                            <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                  }}
                                />
                                {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white animate-bounce" />}
                            </label>
                         </div>
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Global Logo URL</label>
                               <input 
                                  type="text" 
                                  value={settings.logo_url} 
                                  onChange={e => setSettings({...settings, logo_url: e.target.value})}
                                  placeholder="https://..."
                                  className="input py-3.5 border-slate-200 font-medium" 
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Platform Brand Name</label>
                               <input 
                                  type="text" 
                                  value={settings.hospital_name} 
                                  onChange={e => setSettings({...settings, hospital_name: e.target.value})}
                                  className="input py-3.5 border-slate-200 font-black" 
                               />
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Short Label</label>
                                <input 
                                   type="text" 
                                   value={settings.hospital_short_name} 
                                   onChange={e => setSettings({...settings, hospital_short_name: e.target.value})}
                                   className="input py-3.5 border-slate-200 font-bold" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Emergency Operations Hotline</label>
                                <input 
                                   type="tel" 
                                   value={settings.emergency_phone || ''} 
                                   onChange={e => setSettings({...settings, emergency_phone: e.target.value})}
                                   placeholder="+1 (800) Emergency"
                                   className="input py-3.5 border-slate-200 font-bold text-rose-600" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Theme Color</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                   <input 
                                      type="color" 
                                      value={settings.theme_color || '#2563eb'} 
                                      onChange={e => setSettings({...settings, theme_color: e.target.value, primary_color: e.target.value})}
                                      className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent" 
                                   />
                                   <input 
                                      type="text" 
                                      value={settings.theme_color || '#2563eb'} 
                                      onChange={e => setSettings({...settings, theme_color: e.target.value, primary_color: e.target.value})}
                                      className="flex-1 bg-transparent border-none outline-none font-mono text-xs uppercase font-black text-slate-600" 
                                   />
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Secondary Accent Color</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                   <input 
                                      type="color" 
                                      value={settings.secondary_color || '#0f172a'} 
                                      onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                                      className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent" 
                                   />
                                   <input 
                                      type="text" 
                                      value={settings.secondary_color || '#0f172a'} 
                                      onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                                      className="flex-1 bg-transparent border-none outline-none font-mono text-xs uppercase font-black text-slate-600" 
                                   />
                                </div>
                             </div>
                          </div>
                      </div>
                   </div>

                   <div className="h-px bg-slate-50"></div>

                   <div className="space-y-8">
                      <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Global Contact Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Support Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                  <input 
                                      type="email" 
                                      value={settings.contact_email} 
                                      onChange={e => setSettings({...settings, contact_email: e.target.value})}
                                      className="input py-3.5 pl-12 border-slate-200" 
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Support Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                  <input 
                                      type="tel" 
                                      value={settings.contact_phone} 
                                      onChange={e => setSettings({...settings, contact_phone: e.target.value})}
                                      className="input py-3.5 pl-12 border-slate-200" 
                                  />
                              </div>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Headquarters Address</label>
                              <div className="relative">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                  <input 
                                      type="text" 
                                      value={settings.address} 
                                      onChange={e => setSettings({...settings, address: e.target.value})}
                                      className="input py-3.5 pl-12 border-slate-200" 
                                  />
                              </div>
                          </div>
                      </div>
                   </div>

                   <div className="h-px bg-slate-50"></div>

                   <div className="space-y-8">
                      <div className="flex items-center justify-between p-6 bg-rose-50/30 border border-rose-100 rounded-[2rem]">
                         <div className="space-y-1">
                            <h3 className="font-black text-rose-900 uppercase tracking-tight">Main Platform Maintenance</h3>
                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Puts the landing page into safe mode</p>
                         </div>
                         <button 
                            onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                            className={cn(
                                "relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out",
                                settings.maintenance_mode ? "bg-rose-500" : "bg-slate-200"
                            )}>
                            <span className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                settings.maintenance_mode ? "translate-x-7" : "translate-x-0"
                            )}></span>
                         </button>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-start gap-6 shadow-2xl shadow-slate-900/10">
                   <div className="p-3 bg-white/10 rounded-2xl">
                      <Shield className="w-6 h-6 text-slate-400" />
                   </div>
                   <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Super Admin Authority</p>
                       <p className="text-white font-bold leading-relaxed italic">"These settings are global and act as the master identity for the entire SaaS platform. Changes here will instantly propagate across the landing page, system auth pages, and all Super Admin dashboards."</p>
                   </div>
                </div>
             </div>
           )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card p-8 space-y-8 shadow-xl shadow-slate-200/40 border-slate-50">
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Global Security Defaults</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Master Password Min Length</label>
                        <input 
                          type="number" 
                          value={settings.security_settings?.password_min_length || 8} 
                          onChange={e => setSettings({
                            ...settings, 
                            security_settings: { ...settings.security_settings, password_min_length: parseInt(e.target.value) }
                          })}
                          className="input py-3.5 border-slate-200 font-bold" 
                        />
                      </div>
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Special Characters</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Require in all passwords</p>
                        </div>
                        <button 
                          onClick={() => setSettings({
                            ...settings, 
                            security_settings: { ...settings.security_settings, require_special_char: !settings.security_settings?.require_special_char }
                          })}
                          className={cn(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                            settings.security_settings?.require_special_char ? "bg-primary-600" : "bg-slate-300"
                          )}>
                          <span className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            settings.security_settings?.require_special_char ? "translate-x-5" : "translate-x-0"
                          )}></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="card p-8 space-y-8 shadow-xl shadow-slate-200/40 border-slate-50">
                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Global SMTP Gateway</h3>
                    <p className="text-xs text-slate-500 font-medium bg-amber-50 p-4 rounded-xl border border-amber-100 italic">This SMTP configuration is used for platform-wide emails (receipts, password resets, onboarding alerts). Ensure these are enterprise-grade or use the platform AWS/SendGrid credentials.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SMTP Gateway Host</label>
                        <input 
                          type="text" 
                          value={settings.smtp_host || ''} 
                          onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                          placeholder="Ex: email-smtp.us-east-1.amazonaws.com"
                          className="input py-3.5 border-slate-200" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gateway Port</label>
                        <input 
                          type="text" 
                          value={settings.smtp_port || ''} 
                          onChange={e => setSettings({...settings, smtp_port: e.target.value})}
                          placeholder="Ex: 587"
                          className="input py-3.5 border-slate-200 font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gateway Auth User</label>
                        <input 
                          type="text" 
                          value={settings.smtp_user || ''} 
                          onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                          className="input py-3.5 border-slate-200" 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gateway Auth Password</label>
                        <input 
                          type="password" 
                          value={settings.smtp_pass || ''} 
                          onChange={e => setSettings({...settings, smtp_pass: e.target.value})}
                          className="input py-3.5 border-slate-200" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="card p-10 space-y-10 shadow-xl shadow-slate-200/40 border-slate-50">
                  <div className="space-y-8">
                    <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Platform Intelligence & Maintenance</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <button className="w-full flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 hover:bg-white border border-slate-100 transition-all group hover:shadow-xl hover:shadow-slate-200/50">
                        <div className="flex items-center gap-6 text-left">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Database className="w-8 h-8 text-slate-900" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight">Master Data Backup</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Download entire platform state (JSON / SQL)</p>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-slate-900 group-hover:translate-x-2 transition-all" />
                      </button>

                      <button className="w-full flex items-center justify-between p-8 rounded-[2.5rem] bg-rose-50/20 hover:bg-rose-50 border border-rose-100 transition-all group hover:shadow-xl hover:shadow-rose-100/50">
                        <div className="flex items-center gap-6 text-left">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <RefreshCw className="w-8 h-8 text-rose-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-rose-900 leading-tight">Global Cache Reset</h4>
                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-[0.2em] mt-1">Flush all server-side caches and revalidate</p>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-rose-200 group-hover:text-rose-600 group-hover:translate-x-2 transition-all" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
