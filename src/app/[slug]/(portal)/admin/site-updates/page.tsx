'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, Search, Edit2, Trash2, 
  ExternalLink, Palette, Type, Calendar, 
  Layout, Loader2, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { siteUpdateAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SiteUpdatesPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await siteUpdateAPI.getAll() as any;
      setBanners(res.banners || []);
    } catch {
      toast.error('Failed to fetch site updates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await siteUpdateAPI.toggle(id);
      toast.success(`Banner updated`);
      fetchBanners();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;
    try {
      await siteUpdateAPI.delete(id);
      toast.success('Site update deleted');
      fetchBanners();
    } catch {
      toast.error('Failed to delete update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Site Updates Banners</h1>
          <p className="text-gray-500 text-sm mt-1">Manage global announcement banners displayed at the top of the website.</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))
        ) : banners.length === 0 ? (
          <div className="py-20 text-center card bg-gray-50 border-dashed border-2 border-gray-200">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No banners configured</p>
          </div>
        ) : banners.map((banner) => (
          <div key={banner._id} className="card p-6 flex items-center gap-6 group">
            <div 
              className="w-1.5 h-16 rounded-full" 
              style={{ backgroundColor: banner.backgroundColor || '#4f46e5' }}
            ></div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                 <h3 className="font-bold text-gray-900 line-clamp-1">{banner.message}</h3>
                 <span className={cn(
                   "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                   banner.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                 )}>
                   {banner.is_active ? 'Visible' : 'Hidden'}
                 </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Ends: {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Never'}
                </span>
                {banner.link_text && (
                  <span className="flex items-center gap-1.5 text-primary-600">
                    <ExternalLink className="w-3 h-3" />
                    {banner.link_text}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
               <button 
                onClick={() => handleToggle(banner._id, banner.is_active)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
              >
                {banner.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
              <button onClick={() => handleDelete(banner._id)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors text-gray-400">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
