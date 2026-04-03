'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, Search, Edit2, Trash2, 
  ExternalLink, Palette, Type, Calendar, 
  Layout, Loader2, AlertCircle, ToggleLeft, ToggleRight, X, Save, Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { siteUpdateAPI, uploadAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PlatformSiteUpdatesPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  // New Banner Form State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    linkText: '',
    linkUrl: '',
    image_url: '',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await siteUpdateAPI.getAll() as any;
      setBanners(res.banners || []);
    } catch {
      toast.error('Failed to fetch platform banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'platform/banners');
      
      const res = await uploadAPI.upload(data) as any;
      setFormData({...formData, image_url: res.url});
      toast.success('Banner image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await siteUpdateAPI.toggle(id);
      toast.success(`Banner status updated`);
      fetchBanners();
    } catch {
      toast.error('Failed to update banner status');
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      message: banner.message,
      linkText: banner.link_text || '',
      linkUrl: banner.link_url || '',
      image_url: banner.image_url || '',
      backgroundColor: banner.background_color || '#0f172a',
      textColor: banner.text_color || '#ffffff',
      startDate: banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : ''
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global banner?')) return;
    try {
      await siteUpdateAPI.delete(id);
      toast.success('Banner deleted');
      fetchBanners();
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message) return toast.error('Message is required');

    try {
      setSaving(true);
      if (editingBanner) {
        await siteUpdateAPI.update(editingBanner._id || editingBanner.id, formData);
        toast.success('Global banner updated successfully');
      } else {
        await siteUpdateAPI.create(formData);
        toast.success('Global banner created successfully');
      }
      
      setShowCreate(false);
      setEditingBanner(null);
      setFormData({
        message: '',
        linkText: '',
        linkUrl: '',
        image_url: '',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
      fetchBanners();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${editingBanner ? 'update' : 'create'} banner`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Platform Banners</h1>
          <p className="text-gray-500 text-sm mt-1 text-premium-600 font-medium italic">Manage global announcement banners displayed across the main platform.</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/10">
            <Plus className="w-4 h-4" />
            Create Global Banner
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card p-8 bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 scale-in-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-slate-50 rounded-2xl">
                  <Bell className="w-5 h-5 text-slate-900" />
               </div>
               <h2 className="text-xl font-bold text-slate-900">
                 {editingBanner ? 'Edit Global Banner' : 'New Platform Banner'}
               </h2>
            </div>
            <button 
              onClick={() => {
                setShowCreate(false);
                setEditingBanner(null);
                setFormData({
                  message: '',
                  linkText: '',
                  linkUrl: '',
                  image_url: '',
                  backgroundColor: '#0f172a',
                  textColor: '#ffffff',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: ''
                });
              }} 
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Banner message</label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="input py-4 min-h-[100px] border-slate-200"
                placeholder="Ex: Main platform maintenance scheduled for midnight..."
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Banner Image (Optional)</label>
              <div className="flex items-center gap-4 p-2 border border-slate-200 rounded-[1.5rem]">
                <label className="flex-1 flex items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-primary-600" /> : <div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Upload className="w-4 h-4" /> Upload Graphic Element</div>}
                </label>
                {formData.image_url && (
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group">
                    <img src={formData.image_url} alt="Banner" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Action Button Text</label>
              <input 
                type="text"
                value={formData.linkText}
                onChange={(e) => setFormData({...formData, linkText: e.target.value})}
                className="input py-3 border-slate-200"
                placeholder="Ex: Learn More"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Action URL</label>
              <input 
                type="text"
                value={formData.linkUrl}
                onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                className="input py-3 border-slate-200"
                placeholder="Ex: https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Background</label>
                  <div className="flex items-center gap-3 p-1.5 border border-slate-200 rounded-xl">
                    <input 
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600">{formData.backgroundColor}</span>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Text Color</label>
                  <div className="flex items-center gap-3 p-1.5 border border-slate-200 rounded-xl">
                    <input 
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600">{formData.textColor}</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                  <input 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="input py-3 border-slate-200"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">End Date (Optional)</label>
                  <input 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="input py-3 border-slate-200"
                  />
               </div>
            </div>

            <div className="md:col-span-2 pt-4 flex items-center justify-end gap-3">
               <button 
                type="button" 
                onClick={() => {
                  setShowCreate(false);
                  setEditingBanner(null);
                  setFormData({
                    message: '',
                    linkText: '',
                    linkUrl: '',
                    image_url: '',
                    backgroundColor: '#0f172a',
                    textColor: '#ffffff',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ''
                  });
                }} 
                className="btn-secondary border-none px-6"
               >
                 Cancel
               </button>
               <button type="submit" disabled={saving} className="btn-primary bg-slate-900 hover:bg-slate-800 min-w-[160px] rounded-2xl">
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>
                     <Save className="w-4 h-4" /> 
                     {editingBanner ? 'Save Changes' : 'Create Banner'}
                   </>
                 )}
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
            <Layout className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active & Scheduled Banners</h3>
        </div>

        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse border border-slate-100"></div>
          ))
        ) : banners.length === 0 ? (
          <div className="py-24 text-center card bg-slate-50 border-dashed border-2 border-slate-200 rounded-[3rem]">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">No active banners found</p>
            <p className="text-slate-400 text-xs mt-2">Click "Create Global Banner" to announce something platform-wide.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {banners.map((banner) => (
              <div key={banner._id} className="card p-8 flex items-center gap-8 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all border border-slate-50 rounded-[2.5rem] bg-white">
                <div 
                  className="w-2 h-20 rounded-full" 
                  style={{ backgroundColor: banner.background_color || '#0f172a' }}
                ></div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                     <h3 className="font-black text-slate-900 leading-tight text-lg">{banner.message}</h3>
                     <span className={cn(
                       "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                       banner.is_active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100 font-bold"
                     )}>
                       {banner.is_active ? 'Live on Platform' : 'Dormant'}
                     </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                      <Calendar className="w-3.5 h-3.5" />
                      Ends: {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Continuous'}
                    </span>
                    {banner.link_text && (
                      <span className="flex items-center gap-2 text-slate-900 group-hover:text-primary-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                        CTA: {banner.link_text}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                       <Palette className="w-3.5 h-3.5" />
                       Brand: {banner.background_color}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => handleToggle(banner._id, banner.is_active)}
                    title={banner.is_active ? "Deactivate banner" : "Activate banner"}
                    className={cn(
                        "p-3 rounded-2xl transition-all shadow-sm active:scale-90",
                        banner.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {banner.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                  <button 
                    onClick={() => handleEdit(banner)}
                    className="p-4 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all active:scale-90 shadow-sm"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(banner._id)} className="p-4 bg-rose-50/50 text-rose-300 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 rounded-2xl transition-all active:scale-90">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] text-white flex items-start gap-6 shadow-2xl shadow-slate-900/20">
         <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
            <AlertCircle className="w-8 h-8 text-slate-400" />
         </div>
         <div className="space-y-2">
             <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Super Admin Authority</p>
             <p className="text-xl font-bold leading-tight">Global Advertising & System Announcements</p>
             <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">Banners created here will be visible at the top of the main platform landing page. They are separate from tenant-specific banners created by hospital administrators. Use these for platform-wide alerts, marketing, or critical maintenance notifications.</p>
         </div>
      </div>
    </div>
  );
}
