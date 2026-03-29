'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, User, ChevronDown, LogOut, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useSiteSettings } from '@/context/SettingsContext';
import HospitalLogo from '@/components/common/HospitalLogo';
import { NotificationBell } from '@/components/common/NotificationBell';

interface AdminHeaderProps {
  toggleSidebar: () => void;
}

import { useParams } from 'next/navigation';

export const AdminHeader = ({ toggleSidebar }: AdminHeaderProps) => {
  const { settings, loading, slug } = useSiteSettings();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 h-16 flex items-center shrink-0">
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg mr-2"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="hidden lg:block">
            {loading ? (
              <div className="h-4 w-48 bg-slate-100 animate-pulse rounded" />
            ) : (
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {settings?.hospital_name || 'Hospital'} Management System
              </h2>
            )}
          </div>
          <div className="lg:hidden">
            {loading ? (
              <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
            ) : (
              <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest">
                {settings?.hospital_short_name || settings?.hospital_name || 'MedicsHMS'}
              </h2>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">{getUserInitials()}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.role === 'platform_admin' ? 'Super Admin' : user?.role || 'Portal'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href={slug ? `/${slug}/${user?.role?.toLowerCase()}/profile` : `/${user?.role?.toLowerCase()}/profile`} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link href={slug ? `/${slug}/${user?.role?.toLowerCase()}/support` : `/${user?.role?.toLowerCase()}/support`} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                      <Headphones className="w-4 h-4" /> Support
                    </Link>
                  </div>
                  <div className="border-t border-gray-100">
                    <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm text-red-600 text-left transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
