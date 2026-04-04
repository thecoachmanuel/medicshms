'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Bell, Moon, Sun, 
  Globe, Lock, Database, RefreshCw,
  AlertCircle, ChevronRight, CheckCircle2,
  Save, Loader2, Hospital, Mail, Phone, MapPin,
  Upload, FlaskConical, Users, BookOpen, Plus, Trash2,
  Search, Edit3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { siteSettingsAPI, uploadAPI, labAPI, usersAPI } from '@/lib/api';
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
  slug: string;
  security_settings: {
    password_min_length: number;
    require_special_char: boolean;
  };
  [key: string]: any;
}

export default function SettingsPage() {
  const { settings: globalSettings, loading: globalLoading, refreshSettings } = useSiteSettings();
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SiteSettings>({
    hospital_name: '',
    hospital_short_name: '',
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
    slug: '',
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

      // Generate full palettes using the same utility as ThemeProvider
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
      formData.append('folder', 'branding');
      
      const res = await uploadAPI.upload(formData) as any;
      setSettings({ ...settings, logo_url: res.url });
      toast.success('Logo uploaded successfully');
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
      // Ensure both color fields are synced before sending to API
      const updatedSettings = {
        ...settings,
        primary_color: settings.theme_color || settings.primary_color,
        theme_color: settings.theme_color || settings.primary_color
      };
      
      await siteSettingsAPI.update(updatedSettings);
      
      // Refresh global settings context
      await refreshSettings();
      
      // Dispatch global event for other components (legacy support)
      window.dispatchEvent(new CustomEvent('medics-settings-updated'));
      
      toast.success('Settings synchronized successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync changes');
    } finally {
      setSyncing(false);
    }
  };


  const tabs = [
    { id: 'general', icon: Settings, label: 'General System' },
    { id: 'domain', icon: Globe, label: 'Custom Domain' },
    { id: 'notifications', icon: Bell, label: 'Email & Push' },
    { id: 'lab', icon: FlaskConical, label: 'Laboratory Matrix' },
    { id: 'database', icon: Database, label: 'Data Management' },
  ];

  if (globalLoading && !settings.hospital_name) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">System Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your hospital's branding, site link, and administrative controls.</p>
        </div>
        <button onClick={handleSave} disabled={syncing} className="btn-primary min-w-[140px]">
          {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Sync Changes</>}
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
                  activeTab === tab.id ? "bg-primary-50 text-primary-600" : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                    activeTab === tab.id ? "bg-white shadow-sm" : "bg-gray-50 group-hover:scale-110"
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
                <div className="card p-8 space-y-8">
                   <div className="space-y-6">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <h3 className="font-bold text-gray-900">Hospital Branding</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Update logos and theme colors</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-10">
                         <div className="w-24 h-24 bg-white shadow-xl shadow-primary-600/10 border-2 border-primary-100 rounded-[2rem] flex items-center justify-center relative group overflow-hidden transition-all hover:scale-105">
                            {settings.logo_url ? (
                               <img 
                                 src={settings.logo_url} 
                                 alt="Logo" 
                                 className="w-full h-full object-contain p-3" 
                                 onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Invalid+Logo';
                                 }}
                               />
                            ) : (
                               <Hospital className="w-10 h-10 text-primary-200" />
                            )}
                            <label className="absolute inset-0 bg-primary-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                  }}
                                />
                                {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white animate-bounce-short" />}
                            </label>
                         </div>
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo URL</label>
                               <input 
                                  type="text" 
                                  value={settings.logo_url} 
                                  onChange={e => setSettings({...settings, logo_url: e.target.value})}
                                  placeholder="https://example.com/logo.png"
                                  className="input py-2.5" 
                               />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hospital Full Name</label>
                               <input 
                                  type="text" 
                                  value={settings.hospital_name} 
                                  onChange={e => setSettings({...settings, hospital_name: e.target.value})}
                                  className="input py-2.5" 
                               />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site Link Slug (e.g. your-hospital-name)</label>
                               <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 pointer-events-none">
                                     {typeof window !== 'undefined' ? window.location.origin : ''}/
                                  </div>
                                  <input 
                                     type="text" 
                                     value={settings.slug} 
                                     onChange={e => setSettings({...settings, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                                     placeholder="hospital-slug"
                                     className="input py-2.5 pl-24 font-bold text-primary-600" 
                                  />
                               </div>
                               <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1">
                                  Warning: Changing this will change your website and dashboard URL!
                               </p>
                            </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institution Short Name</label>
                                <input 
                                   type="text" 
                                   value={settings.hospital_short_name} 
                                   onChange={e => setSettings({...settings, hospital_short_name: e.target.value})}
                                   className="input py-2.5" 
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Brand Theme Color (Primary)</label>
                                <div className="flex items-center gap-3">
                                   <input 
                                      type="color" 
                                      value={settings.theme_color || settings.primary_color || '#2563eb'} 
                                      onChange={e => setSettings({...settings, theme_color: e.target.value, primary_color: e.target.value})}
                                      className="w-10 h-10 rounded-xl border-none cursor-pointer" 
                                   />
                                   <input 
                                      type="text" 
                                      value={settings.theme_color || settings.primary_color || '#2563eb'} 
                                      onChange={e => setSettings({...settings, theme_color: e.target.value, primary_color: e.target.value})}
                                      className="flex-1 input py-2.5 font-mono text-xs uppercase" 
                                   />
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secondary Brand Color</label>
                                <div className="flex items-center gap-3">
                                   <input 
                                      type="color" 
                                      value={settings.secondary_color || '#0f172a'} 
                                      onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                                      className="w-10 h-10 rounded-xl border-none cursor-pointer" 
                                   />
                                   <input 
                                      type="text" 
                                      value={settings.secondary_color || '#0f172a'} 
                                      onChange={e => setSettings({...settings, secondary_color: e.target.value})}
                                      className="flex-1 input py-2.5 font-mono text-xs uppercase" 
                                   />
                                </div>
                             </div>
                          </div>
                      </div>
                   </div>

                   <div className="h-px bg-gray-50"></div>

                   <div className="space-y-6">
                      <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Email</label>
                              <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                  <input 
                                      type="email" 
                                      value={settings.contact_email} 
                                      onChange={e => setSettings({...settings, contact_email: e.target.value})}
                                      className="input py-2.5 pl-10" 
                                  />
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                  <input 
                                      type="tel" 
                                      value={settings.contact_phone} 
                                      onChange={e => setSettings({...settings, contact_phone: e.target.value})}
                                      className="input py-2.5 pl-10" 
                                  />
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergency Phone</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                                  <input 
                                      type="tel" 
                                      value={settings.emergency_phone} 
                                      onChange={e => setSettings({...settings, emergency_phone: e.target.value})}
                                      className="input py-2.5 pl-10 border-rose-100 focus:border-rose-300" 
                                  />
                              </div>
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hospital Address</label>
                              <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                  <input 
                                      type="text" 
                                      value={settings.address} 
                                      onChange={e => setSettings({...settings, address: e.target.value})}
                                      className="input py-2.5 pl-10" 
                                  />
                              </div>
                          </div>
                      </div>
                   </div>

                   <div className="h-px bg-gray-50"></div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h3 className="font-bold text-gray-900">Maintenance Mode</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Disable public booking access</p>
                         </div>
                         <button 
                            onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                            className={cn(
                                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                                settings.maintenance_mode ? "bg-rose-500" : "bg-gray-200"
                            )}>
                            <span className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                settings.maintenance_mode ? "translate-x-5" : "translate-x-0"
                            )}></span>
                         </button>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h3 className="font-bold text-gray-900">SMS Notifications</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Send OTP for patient lookup</p>
                         </div>
                         <button 
                            onClick={() => setSettings({...settings, sms_notifications: !settings.sms_notifications})}
                            className={cn(
                                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                                settings.sms_notifications ? "bg-primary-600" : "bg-gray-200"
                            )}>
                            <span className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                settings.sms_notifications ? "translate-x-5" : "translate-x-0"
                            )}></span>
                         </button>
                      </div>
                    </div>
                 </div>

                 <div className="p-6 bg-primary-50 rounded-[2rem] border border-primary-100 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-primary-500 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-primary-900 uppercase tracking-widest mb-1">System Action Required</p>
                        <p className="text-xs text-primary-700 leading-relaxed font-medium">Changes to branding and contact info will reflect across all public pages and patient receipts immediately after syncing.</p>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'domain' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="card p-8 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">External Domain Configuration</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose">Connect your own brand domain to your hospital portal</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Your Custom Domain</label>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            placeholder="e.g. portal.yourhospital.com"
                            value={settings.custom_domain || ''} 
                            onChange={e => setSettings({...settings, custom_domain: e.target.value.toLowerCase().trim()})}
                            className="input flex-1 py-3 font-bold text-slate-700" 
                          />
                          <button 
                            type="button"
                            onClick={handleSave}
                            className="btn-primary px-8"
                          >
                            Set Domain
                          </button>
                        </div>
                        <p className="text-[10px] text-primary-600 font-bold mt-2 italic px-1">
                          Current Platform URL: {typeof window !== 'undefined' ? `${window.location.origin}/${settings.slug}` : ''}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                              <Globe className="w-12 h-12" />
                           </div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 underline decoration-primary-500 decoration-2 underline-offset-4">Primary Method: CNAME (Preferred)</h4>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">Add a CNAME record in your domain registrar to point your subdomain (e.g. portal.hospital.com) to our platform.</p>
                           <div className="bg-white p-4 rounded-xl space-y-3 shadow-sm border border-slate-100">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[8px] font-black uppercase text-slate-400">Record Type</span>
                                 <span className="text-[10px] font-black text-primary-600 uppercase">CNAME</span>
                              </div>
                              <div className="h-px bg-slate-50"></div>
                              <div className="flex justify-between items-center group/ns">
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase text-slate-400">Target URL</span>
                                    <code className="text-[10px] font-black text-primary-600 tracking-tight">medicshms.vercel.app</code>
                                 </div>
                                 <button onClick={() => { navigator.clipboard.writeText('medicshms.vercel.app'); toast.success('Copied CNAME target'); }} className="text-[10px] uppercase font-black text-slate-300 hover:text-primary-600 transition-colors">Copy</button>
                              </div>
                           </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                              <RefreshCw className="w-12 h-12" />
                           </div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">Method 2: A Record (Apex Domain)</h4>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">Use this for your main domain (e.g. yourclinic.com) without a subdomain. Point an A record to our server IP.</p>
                           <div className="bg-white p-4 rounded-xl space-y-3 shadow-sm border border-slate-100">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[8px] font-black uppercase text-slate-400">Record Type</span>
                                 <span className="text-[10px] font-black text-emerald-600 uppercase">A Record @</span>
                              </div>
                              <div className="h-px bg-slate-50"></div>
                              <div className="flex justify-between items-center group/ns">
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black uppercase text-slate-400">Value (IP Address)</span>
                                    <code className="text-[10px] font-black text-emerald-600">[Contact Support for IP]</code>
                                 </div>
                                 <button onClick={() => { navigator.clipboard.writeText('Please provide server IP'); toast.success('Help text copied'); }} className="text-[10px] uppercase font-black text-slate-300 hover:text-emerald-600 transition-colors">Support</button>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-1">Propagation Notice</p>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">DNS changes can take up to 24-48 hours to propagate globally. Make sure to only save the custom domain after updating your DNS records to avoid downtime.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">User Access & Registration</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-gray-900">Allow Public Patient Registration</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enable registration link on login page</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, allow_public_registration: !settings.allow_public_registration})}
                        className={cn(
                          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                          settings.allow_public_registration ? "bg-primary-600" : "bg-gray-200"
                        )}>
                        <span className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          settings.allow_public_registration ? "translate-x-5" : "translate-x-0"
                        )}></span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">Password Complexity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Password Length</label>
                        <input 
                          type="number" 
                          value={settings.security_settings?.password_min_length || 8} 
                          onChange={e => setSettings({
                            ...settings, 
                            security_settings: { ...settings.security_settings, password_min_length: parseInt(e.target.value) }
                          })}
                          className="input py-2.5" 
                        />
                      </div>
                      <div className="flex items-center justify-between pt-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-gray-900">Require Special Character</h4>
                        </div>
                        <button 
                          onClick={() => setSettings({
                            ...settings, 
                            security_settings: { ...settings.security_settings, require_special_char: !settings.security_settings?.require_special_char }
                          })}
                          className={cn(
                            "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                            settings.security_settings?.require_special_char ? "bg-primary-600" : "bg-gray-200"
                          )}>
                          <span className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            settings.security_settings?.require_special_char ? "translate-x-4" : "translate-x-0"
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
                <div className="card p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">SMTP Email Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SMTP Host</label>
                        <input 
                          type="text" 
                          value={settings.smtp_host || ''} 
                          onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                          placeholder="smtp.example.com"
                          className="input py-2.5" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SMTP Port</label>
                        <input 
                          type="text" 
                          value={settings.smtp_port || ''} 
                          onChange={e => setSettings({...settings, smtp_port: e.target.value})}
                          placeholder="587"
                          className="input py-2.5" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SMTP User</label>
                        <input 
                          type="text" 
                          value={settings.smtp_user || ''} 
                          onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                          className="input py-2.5" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-yellow-50 rounded-[2rem] border border-yellow-100 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-yellow-900 uppercase tracking-widest mb-1">Email Delivery Info</p>
                    <p className="text-xs text-yellow-700 leading-relaxed font-medium">Verify your SMTP credentials before syncing. Incorrect settings will prevent patients from receiving appointment confirmations.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lab' && <LabManagementSection />}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="card p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">Data Operations</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-gray-50 hover:bg-white border border-gray-100 transition-all group">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Database className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 italic">Export System Data</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Download full database dump (JSON)</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </button>

                      <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-rose-50/30 hover:bg-rose-50 border border-rose-100 transition-all group">
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <RefreshCw className="w-6 h-6 text-rose-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-rose-900 italic">Reset Cache & Sync</h4>
                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Force re-synchronize all modules</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-rose-300" />
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

function LabManagementSection() {
  const [units, setUnits] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [scientists, setScientists] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'units' | 'catalog' | 'assignments'>('units');

  // Modal states
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchLabData();
  }, []);

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes, sRes, aRes] = await Promise.all([
        labAPI.getUnits(),
        labAPI.getCatalog(),
        usersAPI.getUsersByRole('lab_scientist'),
        labAPI.getAssignments()
      ]);
      setUnits(uRes.data || []);
      setCatalog(cRes.data || []);
      setScientists(sRes.data || []);
      setAssignments(aRes.data || []);
    } catch (error) {
      toast.error('Failed to load laboratory matrix data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: data.get('name') as string,
      description: data.get('description') as string
    };
    try {
      if (editingItem) {
        await labAPI.updateUnit(editingItem.id, payload);
        toast.success('Unit updated');
      } else {
        await labAPI.createUnit(payload);
        toast.success('New unit established');
      }
      setIsUnitModalOpen(false);
      setEditingItem(null);
      fetchLabData();
    } catch (e) { toast.error('Operation failed'); }
  };

  const handleUpsertCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const payload = {
      id: editingItem?.id,
      test_name: data.get('test_name') as string,
      price: parseFloat(data.get('price') as string),
      unit_id: data.get('unit_id') as string,
      description: data.get('description') as string
    };
    try {
      await labAPI.upsertCatalogItem(payload);
      toast.success('Catalog entry synchronized');
      setIsCatalogModalOpen(false);
      setEditingItem(null);
      fetchLabData();
    } catch (e) { toast.error('Catalog operation failed'); }
  };

  const handleAssignScientist = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    try {
      await labAPI.assignScientist({
        unit_id: data.get('unit_id') as string,
        scientist_id: data.get('scientist_id') as string
      });
      toast.success('Scientist assigned to unit');
      setIsAssignModalOpen(false);
      fetchLabData();
    } catch (e) { toast.error('Assignment failed'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 animate-pulse text-xs font-black uppercase tracking-widest text-gray-400">Synchronizing Matrix Data...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {(['units', 'assignments', 'catalog'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              subTab === t ? "bg-white text-primary-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'units' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Diagnostic Units</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Define specialized laboratory departments</p>
             </div>
             <button 
               onClick={() => { setEditingItem(null); setIsUnitModalOpen(true); }}
               className="btn-primary py-2 px-4 text-[10px]"
             >
               <Plus className="w-4 h-4" /> Establish Unit
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {units.map(unit => (
              <div key={unit.id} className="card p-6 flex justify-between items-start group hover:border-primary-200 transition-colors">
                <div className="space-y-1">
                  <h4 className="font-black text-gray-800 uppercase text-sm">{unit.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">{unit.description || 'No specialized description provided.'}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingItem(unit); setIsUnitModalOpen(true); }} className="p-2 text-gray-400 hover:text-primary-600"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={async () => { if(confirm('Delete unit?')) { await labAPI.deleteUnit(unit.id); fetchLabData(); } }} className="p-2 text-gray-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Personnel Mapping</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assign clinical scientists to diagnostic units</p>
             </div>
             <button onClick={() => setIsAssignModalOpen(true)} className="btn-primary py-2 px-4 text-[10px]">
               <Users className="w-4 h-4" /> Map Personnel
             </button>
          </div>

          <div className="table-container">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Scientist</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Assigned Unit</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} className="border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-xs font-black text-gray-700 uppercase tracking-tight">{a.scientist?.full_name || 'Legacy User'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {a.unit?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={async () => { if(confirm('Remove assignment?')) { await labAPI.removeAssignment(a.id); fetchLabData(); } }} className="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest">Disconnect</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Diagnostic Catalog</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Standardized test protocols & pricing index</p>
             </div>
             <button onClick={() => { setEditingItem(null); setIsCatalogModalOpen(true); }} className="btn-primary py-2 px-4 text-[10px]">
               <BookOpen className="w-4 h-4" /> Add Protocol
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {catalog.map(item => (
              <div key={item.id} className="card p-5 group relative overflow-hidden">
                {item.is_auto_created && (
                  <div className="absolute top-0 right-0 px-2 py-1 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter rounded-bl-lg">Auto-Indexed</div>
                )}
                <h4 className="font-black text-gray-900 uppercase text-xs mb-1 mb-2">{item.test_name}</h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md tracking-widest">₦{item.price?.toLocaleString()}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.unit?.name || 'General'}</span>
                </div>
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingItem(item); setIsCatalogModalOpen(true); }} className="p-2 bg-gray-50 rounded-lg hover:text-primary-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                   <button onClick={async () => { if(confirm('Remove from catalog?')) { await labAPI.deleteCatalogItem(item.id); fetchLabData(); } }} className="p-2 bg-gray-50 rounded-lg hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingItem ? 'Refine Unit' : 'New Laboratory Unit'}</h3>
              <form onSubmit={handleCreateUnit} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Name</label>
                    <input name="name" defaultValue={editingItem?.name} required className="input py-3" placeholder="e.g. HAEMATOLOGY" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scope / Description</label>
                    <textarea name="description" defaultValue={editingItem?.description} className="input py-3 min-h-[100px]" placeholder="Primary focus of this unit..." />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsUnitModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Cancel</button>
                    <button type="submit" className="flex-2 btn-primary py-4 px-8 text-[10px]">Establish Parameters</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{editingItem ? 'Update Protocol' : 'New Diagnostic Protocol'}</h3>
              <form onSubmit={handleUpsertCatalog} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Name</label>
                       <input name="test_name" defaultValue={editingItem?.test_name} required className="input py-3" placeholder="FULL BLOOD COUNT" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Fee (₦)</label>
                       <input name="price" type="number" defaultValue={editingItem?.price} required className="input py-3" placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Functional Unit</label>
                       <select name="unit_id" defaultValue={editingItem?.unit_id} className="input py-3 appearance-none">
                          <option value="">General / Shared</option>
                          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Instructions</label>
                       <textarea name="description" defaultValue={editingItem?.description} className="input py-3" placeholder="Patient preparation, etc..." />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsCatalogModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Withdraw</button>
                    <button type="submit" className="flex-2 btn-primary py-4 px-8 text-[10px]">Sync Protocol</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Personnel Assignment</h3>
              <form onSubmit={handleAssignScientist} className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Laboratory Scientist</label>
                    <select name="scientist_id" required className="input py-3 appearance-none">
                       <option value="">Select Scientist...</option>
                       {scientists.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Unit</label>
                    <select name="unit_id" required className="input py-3 appearance-none">
                       <option value="">Select Unit...</option>
                       {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Cancel</button>
                    <button type="submit" className="flex-2 btn-primary py-4 px-8 text-[10px]">Execute Assignment</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
