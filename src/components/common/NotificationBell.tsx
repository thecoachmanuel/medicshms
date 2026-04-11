'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, X, Info, AlertTriangle, CheckCircle, AlertCircle, Loader2, Inbox, Activity, CreditCard } from 'lucide-react';
import { notificationsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { registerPushNotifications } from '@/lib/push-notifications';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll();
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
     const publicVapidKey = 'BEXZnLfyWcJe5c0S4aBaDUs4m1fhGOIM4xZ9Vjb1rybMG_yIWgf1qRTEblhnZwhw4FjVdjsr98yrzgGt8wKEjEw';
     if (user?.id) {
        const sub = await registerPushNotifications(publicVapidKey, user.id, user.hospital_id || 'general');
        if (sub) setIsPushEnabled(true);
     }
  };

  useEffect(() => {
    fetchNotifications();

    if ('Notification' in window) {
      setIsPushEnabled(Notification.permission === 'granted');
    }

    if (!user?.id) return;

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: (user.role as string) === 'Platform Admin' 
            ? `role=eq.Platform Admin` 
            : `hospital_id=eq.${user.hospital_id || 'all'}`
        },
        (payload: any) => {
          const newNotif = payload.new;
          // Check if it targets this specific user OR their role
          if (newNotif.user_id === user.id || (!newNotif.user_id && newNotif.role === user.role)) {
             setNotifications(prev => [newNotif, ...prev]);
             setUnreadCount(prev => prev + 1);
             toast.success(`New Notification: ${newNotif.title}`, {
                icon: '🔔',
                duration: 4000
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role, user?.hospital_id]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
      case 'clinical': return <Activity className="w-4 h-4 text-indigo-500" />;
      case 'financial': return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default: return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  // Mobile Drawer Toggle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] animate-in fade-in duration-300" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Container (Drawer on Mobile, Popover on Desktop) */}
          <div className={cn(
            "fixed md:absolute top-0 md:top-auto right-0 bottom-0 md:bottom-auto md:mt-4 w-full md:w-[420px] max-w-full h-full md:h-auto max-h-[100dvh] md:max-h-[600px] bg-white md:rounded-[2.5rem] border-l md:border border-slate-100 shadow-2xl z-[70] flex flex-col overflow-hidden animate-in md:slide-in-from-top-4 slide-in-from-right md:fade-in duration-300",
          )}>
            {/* Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-primary-600" />
                  Notifications
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  <span className="text-primary-600">{unreadCount}</span> Actionable Alerts
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-auto mr-2">
                {!isPushEnabled && (
                  <button 
                    onClick={handleEnablePush}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-[9px] font-black text-primary-600 uppercase tracking-widest rounded-lg border border-primary-100 hover:bg-primary-100 transition-all active:scale-95"
                    title="Enable Push Notifications"
                  >
                    <Bell className="w-3 h-3" />
                    Enable Desktop Alerts
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all group"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all group"
                >
                  <X className="w-5 h-5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading && notifications.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing feed...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <Bell className="w-10 h-10 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">All Clear</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No new alerts found</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-6 hover:bg-slate-50 transition-all flex gap-5 group cursor-pointer relative overflow-hidden",
                        !n.is_read && "bg-primary-50/10"
                      )}
                      onClick={() => {
                        if (!n.is_read) handleMarkAsRead(n.id);
                        if (n.action_url) {
                          window.location.href = n.action_url;
                        }
                      }}
                    >
                      {!n.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />
                      )}
                      
                      <div className="shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-transform group-hover:scale-110",
                          !n.is_read ? "bg-white border-primary-100" : "bg-white border-slate-100 opcaity-60"
                        )}>
                          {getIcon(n.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h4 className={cn(
                            "text-xs font-black leading-tight tracking-tight break-words",
                            !n.is_read ? "text-slate-900" : "text-slate-500"
                          )}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-[11px] leading-relaxed line-clamp-2 transition-colors",
                          !n.is_read ? "text-slate-600 font-medium" : "text-slate-400"
                        )}>
                          {n.message}
                        </p>
                        
                        {n.action_url && (
                          <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-primary-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Execute Action
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      
                      {!n.is_read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all opacity-0 flex md:group-hover:opacity-100"
                          title="Mark read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={fetchNotifications}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-colors flex items-center gap-2"
                >
                  <Loader2 className={cn("w-3 h-3", loading && "animate-spin")} />
                  Refresh
                </button>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  End of Stream
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

