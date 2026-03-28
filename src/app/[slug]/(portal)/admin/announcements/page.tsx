'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Edit2, Trash2, 
  Eye, ToggleLeft, ToggleRight, Calendar, 
  MapPin, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { announcementAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import AddAnnouncementModal from '@/components/announcements/AddAnnouncementModal';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementAPI.getAll() as any;
      setAnnouncements(res.announcements || []);
    } catch {
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await announcementAPI.toggle(id);
      toast.success(`Announcement ${current ? 'deactivated' : 'activated'}`);
      fetchAnnouncements();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementAPI.delete(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Manage public notices, events and internal updates.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      {showAddModal && (
        <AddAnnouncementModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchAnnouncements}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          ))
        ) : announcements.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 py-20 text-center">
            <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest">No active announcements</p>
          </div>
        ) : announcements.map((ann) => (
          <div key={ann._id} className="card p-6 flex flex-col h-full bg-white group">
            <div className="flex items-start justify-between mb-4">
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                ann.type === 'Notice' ? "bg-primary-50 text-primary-600" : "bg-amber-50 text-amber-600"
              )}>
                {ann.type}
              </span>
              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(ann._id)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{ann.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">{ann.message}</p>
            
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                  {ann.createdBy?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-900">{ann.createdBy?.name || 'Admin'}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(ann.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggle(ann._id, ann.is_active)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  ann.is_active ? "text-emerald-500 bg-emerald-50" : "text-gray-300 bg-gray-50"
                )}
              >
                {ann.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
