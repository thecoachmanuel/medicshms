'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Stethoscope,
  Building2,
  Bell,
  Search,
  X,
  User,
  ChevronDown,
  Headphones,
  Megaphone,
  ShieldCheck,
  CalendarClock,
  FileCheck,
  Globe,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

import HospitalLogo from '../common/HospitalLogo';

export const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const parts = pathname.split('/');
  const isPlatformAdmin = pathname.startsWith('/platform-admin');
  const slug = (!isPlatformAdmin && parts.length > 1 && parts[1] !== 'login' && parts[1] !== 'admin' && parts[1] !== 'doctor' && parts[1] !== 'receptionist') 
    ? parts[1] 
    : '';

  const getMenuItems = () => {
    const role = user?.role;
    const base = slug ? `/${slug}` : '';

    if (role === 'platform_admin') {
      return [
        { icon: LayoutDashboard, label: 'Super Admin', path: '/platform-admin/dashboard' },
        { icon: Building2, label: 'Hospitals', path: '/platform-admin/dashboard' },
        { icon: Calendar, label: 'Demo Requests', path: '/platform-admin/demo-requests' },
        { icon: DollarSign, label: 'Subscription Plans', path: '/platform-admin/plans' },
        { icon: Globe, label: 'Site Editor', path: '/platform-admin/site-editor' },
        { icon: Bell, label: 'Site Updates', path: '/platform-admin/site-updates' },
        { icon: Headphones, label: 'Support', path: '/platform-admin/support' },
        { icon: Settings, label: 'Platform Settings', path: '/platform-admin/settings' },
      ];
    }

    if (role === 'Admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/admin/dashboard` },
        { icon: Calendar, label: 'Appointments', path: `${base}/admin/appointments` },
        { icon: FileText, label: 'Patients', path: `${base}/admin/patients` },
        { icon: DollarSign, label: 'Billing', path: `${base}/admin/billing` },
        { icon: ShieldCheck, label: 'Admin', path: `${base}/admin/users` },
        { icon: Stethoscope, label: 'Doctors', path: `${base}/admin/doctors` },
        { icon: Users, label: 'Receptionist', path: `${base}/admin/receptionists` },
        { icon: Building2, label: 'Departments', path: `${base}/admin/departments` },
        { icon: CalendarClock, label: 'Slot Settings', path: `${base}/admin/slot-settings` },
        { icon: FileCheck, label: 'Template', path: `${base}/admin/invoice-template` },
        { icon: Megaphone, label: 'Announcements', path: `${base}/admin/announcements` },
        { icon: Globe, label: 'Site Editor', path: `${base}/admin/site-editor` },
        { icon: Bell, label: 'Site Updates', path: `${base}/admin/site-updates` },
        { icon: Headphones, label: 'Support', path: `${base}/admin/support` },
        { icon: User, label: 'My Profile', path: `${base}/admin/profile` },
        { icon: Settings, label: 'Settings', path: `${base}/admin/settings` },
      ];
    } else if (role === 'Receptionist') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/receptionist/dashboard` },
        { icon: Calendar, label: 'Appointments', path: `${base}/receptionist/appointments` },
        { icon: FileText, label: 'Patients', path: `${base}/receptionist/patients` },
        { icon: DollarSign, label: 'Billing', path: `${base}/receptionist/billing` },
        { icon: CalendarClock, label: 'Slot Management', path: `${base}/receptionist/slot-management` },
        { icon: User, label: 'My Profile', path: `${base}/receptionist/profile` },
      ];
    } else if (role === 'Doctor') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/doctor/dashboard` },
        { icon: Calendar, label: 'Appointments', path: `${base}/doctor/appointments` },
        { icon: FileText, label: 'Patients', path: `${base}/doctor/patients` },
        { icon: User, label: 'My Profile', path: `${base}/doctor/profile` },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 w-64 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link href={slug ? `/${slug}` : "/"} className="hover:opacity-80 transition-opacity">
            <HospitalLogo slug={slug} iconClassName="w-8 h-8" textClassName="text-lg" />
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path + item.label}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer",
                  isActive 
                    ? "bg-gray-900 text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'user@hospital.com'}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showProfileMenu && "rotate-180")} />
          </div>

          <div className={cn(
            "overflow-hidden transition-all duration-300",
            showProfileMenu ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0"
          )}>
            <div className="space-y-1">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
