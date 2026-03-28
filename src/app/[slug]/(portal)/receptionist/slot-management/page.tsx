'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, Save, RotateCcw, Plus, Trash2, 
  Clock, Calendar, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { slotConfigAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SlotManagementPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await slotConfigAPI.getMyConfig();
      if (res.data) setConfig(res.data);
    } catch {
      toast.error('Failed to fetch slot configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await slotConfigAPI.updateConfig(config);
      toast.success('Configuration updated successfully');
    } catch {
      toast.error('Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Personal Slot Management</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your individual availability and slot preferences.</p>
      </div>

      <div className="card p-8 bg-gray-50 border-dashed border-2 border-gray-200 text-center py-20 flex flex-col items-center justify-center">
         <CalendarClock className="w-12 h-12 text-gray-200 mb-4" />
         <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Individual slot customization is coming soon...</p>
         <p className="text-xs text-gray-400 mt-2">Currently using system default configuration (15 min per slot).</p>
      </div>
    </div>
  );
}
