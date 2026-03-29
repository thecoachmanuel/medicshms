'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, X, Info, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { notificationsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data || []);
      const unread = (res.data || []).filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // In a real app, you'd use Supabase realtime here
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-[400px] bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{unreadCount} Unread</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm border border-transparent hover:border-slate-100"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching alerts...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-5 hover:bg-slate-50 transition-colors flex gap-4 group cursor-pointer",
                        !n.is_read && "bg-primary-50/10"
                      )}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    >
                      <div className="shrink-0 mt-1">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn("text-xs font-black text-slate-900 leading-tight", !n.is_read && "text-primary-600")}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        {n.action_url && (
                          <div className="pt-2">
                            <a 
                              href={n.action_url}
                              className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                            >
                              View Details
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      {!n.is_read && (
                        <div className="shrink-0 pt-1">
                          <div className="w-2 h-2 bg-primary-600 rounded-full shadow-lg shadow-primary-600/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                <button 
                  onClick={fetchNotifications}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Refresh Feed
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
