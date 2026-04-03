'use client';

import React, { useState } from 'react';
import { X, Megaphone, Loader2, Info } from 'lucide-react';
import { announcementAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface AddAnnouncementModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAnnouncementModal({ onClose, onSuccess }: AddAnnouncementModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'Notice',
    priority: 'Normal',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Map priority to integer for DB consistency
      const priorityMap: Record<string, number> = {
        'Low': 0,
        'Normal': 1,
        'High': 2
      };

      const payload = {
        ...formData,
        priority: priorityMap[formData.priority] || 0
      };

      await announcementAPI.create(payload);
      toast.success('Announcement created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              <Megaphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900">Create Announcement</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Free Eye Checkup Camp"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Type</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Notice">Notice</option>
                <option value="Event">Event</option>
                <option value="Update">Update</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Priority</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium appearance-none cursor-pointer"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Message</label>
            <textarea
              required
              rows={4}
              placeholder="Detail about the announcement..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium resize-none"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 text-amber-800">
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              This announcement will be visible to all users on the public site and portal dashboard immediately after creation.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              className="flex-[2] btn-primary py-3 rounded-2xl shadow-lg shadow-primary-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Publish Announcement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
