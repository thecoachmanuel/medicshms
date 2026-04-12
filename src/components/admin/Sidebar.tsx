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
  LineChart,
  CreditCard,
  Globe,
  LogOut,
  Activity,
  Code,
  ActivitySquare,
  ClipboardList,
  TestTubes,
  Microscope,
  Pill,
  Package,
  Scan,
  ImageIcon,
  FlaskConical
} from 'lucide-react';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

import HospitalLogo from '../common/HospitalLogo';

import { SidebarProps } from './Sidebar';
import { useSiteSettings } from '@/context/SettingsContext';

export const Sidebar = ({ isOpen, toggleSidebar, isCollapsed = false, toggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings, hasFeature } = useSiteSettings();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const parts = pathname.split('/');
  const isPlatformRoute = pathname.startsWith('/platform-admin');
  const slug = (!isPlatformRoute && parts.length > 1 && parts[1] !== 'login' && parts[1] !== 'admin' && parts[1] !== 'doctor' && parts[1] !== 'receptionist') 
    ? parts[1] 
    : '';

  const getMenuItems = () => {
    const role = user?.role;
    const base = slug ? `/${slug}` : '';

    if (isPlatformAdmin(role)) {
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
      const items = [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/admin/dashboard` },
        { icon: Calendar, label: 'Appointments', path: `${base}/admin/appointments` },
        { icon: FileText, label: 'Patients', path: `${base}/admin/patients` },
        { icon: DollarSign, label: 'Billing', path: `${base}/admin/billing` },
        { icon: ShieldCheck, label: 'Admin', path: `${base}/admin/users` },
        { icon: Stethoscope, label: 'Doctors', path: `${base}/admin/doctors` },
        { icon: Users, label: 'Hospital Staff', path: `${base}/admin/staff` },
        { icon: FlaskConical, label: 'Laboratory Matrix', path: `${base}/admin/laboratory`, feature: 'Laboratory' },
        { icon: Building2, label: 'Departments', path: `${base}/admin/departments` },
        { icon: CalendarClock, label: 'Slot Settings', path: `${base}/admin/slot-settings` },
        { icon: FileCheck, label: 'Template', path: `${base}/admin/invoice-template` },
        { icon: Megaphone, label: 'Announcements', path: `${base}/admin/announcements` },
        { icon: Settings, label: 'Portal Settings', path: `${base}/admin/settings` },
        { icon: Code, label: 'Embed Integration', path: `${base}/admin/embed`, feature: 'Integration' },
        { icon: LineChart, label: 'Productivity Hub', path: `${base}/admin/productivity`, feature: 'Analytics' },
        { icon: CreditCard, label: 'Account & Billing', path: `${base}/admin/account` },
        { icon: ActivitySquare, label: 'Site Updates', path: `${base}/admin/site-updates` },
        { icon: Headphones, label: 'Support', path: `${base}/admin/support` },
        { icon: User, label: 'My Profile', path: `${base}/admin/profile` },
      ];

      return items.filter(item => !item.feature || hasFeature(item.feature));
    } else if (role === 'Receptionist') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/receptionist/dashboard` },
        { icon: Calendar, label: 'Appointments', path: `${base}/receptionist/appointments` },
        { icon: FileText, label: 'Patients', path: `${base}/receptionist/patients` },
        { icon: TestTubes, label: 'Lab Services', path: `${base}/receptionist/lab-requests` },
        { icon: Scan, label: 'Radiology Intake', path: `${base}/receptionist/radiology-requests` },
        { icon: DollarSign, label: 'Billing', path: `${base}/receptionist/billing` },
        { icon: CalendarClock, label: 'Slot Management', path: `${base}/receptionist/slot-management` },
        { icon: User, label: 'My Profile', path: `${base}/receptionist/profile` },
      ];
    } else if (role === 'Doctor') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/doctor/dashboard` },
        { icon: Calendar, label: 'Appointments', path: `${base}/doctor/appointments` },
        { icon: CalendarClock, label: 'Availability', path: `${base}/doctor/availability` },
        { icon: FileText, label: 'Patients', path: `${base}/doctor/patients` },
        { icon: User, label: 'My Profile', path: `${base}/doctor/profile` },
      ];
    } else if (role === 'Patient') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/patient/dashboard` },
        { icon: ClipboardList, label: 'Medical Records', path: `${base}/patient/records` },
        { icon: DollarSign, label: 'My Invoices', path: `${base}/patient/invoices` },
        { icon: Calendar, label: 'Appointments', path: `${base}/patient/appointments` },
        { icon: User, label: 'My Profile', path: `${base}/patient/profile` },
      ];
    } else if (role === 'Nurse') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/nurse/dashboard` },
        { icon: ClipboardList, label: 'Appointments', path: `${base}/nurse/appointments` },
        { icon: Activity, label: 'Patient Vitals', path: `${base}/nurse/vitals` },
        { icon: User, label: 'My Profile', path: `${base}/nurse/profile` },
      ];
    } else if (role === 'Lab Scientist') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/lab-scientist/dashboard` },
        { icon: FileText, label: 'Patients', path: `${base}/lab-scientist/patients` },
        { icon: TestTubes, label: 'Lab Requests', path: `${base}/lab-scientist/requests` },
        { icon: Microscope, label: 'Verified Results', path: `${base}/lab-scientist/results` },
        { icon: User, label: 'My Profile', path: `${base}/lab-scientist/profile` },
      ];
    } else if (role === 'Pharmacist') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/pharmacist/dashboard` },
        { icon: Pill, label: 'Prescriptions', path: `${base}/pharmacist/prescriptions` },
        { icon: Package, label: 'Inventory', path: `${base}/pharmacist/inventory` },
        { icon: User, label: 'My Profile', path: `${base}/pharmacist/profile` },
      ];
    } else if (role === 'Radiologist') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${base}/radiologist/dashboard` },
        { icon: FileText, label: 'Patients', path: `${base}/radiologist/patients` },
        { icon: Scan, label: 'Scan Requests', path: `${base}/radiologist/requests` },
        { icon: ImageIcon, label: 'Verified Reports', path: `${base}/radiologist/reports` },
        { icon: User, label: 'My Profile', path: `${base}/radiologist/profile` },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden animate-in fade-in duration-300" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        isOpen ? "translate-x-0 z-[9999]" : "-translate-x-full lg:translate-x-0 z-30",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[73px]">
          <Link href={slug ? `/${slug}` : "/"} className={cn("hover:opacity-80 transition-opacity flex items-center h-full", isCollapsed && "justify-center w-full")}>
            <HospitalLogo slug={slug} iconClassName="w-8 h-8" textClassName={cn("text-lg", isCollapsed && "hidden")} />
          </Link>
          {!isCollapsed && (
            <button onClick={toggleSidebar} className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-indigo-600 transition-colors shrink-0" aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className={cn("p-4 transition-all duration-300", isCollapsed && "px-2 py-4")}>
          {isCollapsed ? (
            <div className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={toggleCollapse} title="Expand Search">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <nav className={cn("flex-1 py-2 overflow-y-auto space-y-1 no-scrollbar", isCollapsed ? "px-2" : "px-4")}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path + item.label}
                href={item.path}
                title={isCollapsed ? item.label : undefined}
                onClick={() => {
                  if (isOpen) toggleSidebar();
                }}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-300 cursor-pointer overflow-hidden",
                  isCollapsed ? "justify-center p-3" : "px-4 py-2.5 gap-3",
                  isActive 
                    ? "bg-secondary-900 text-white shadow-lg shadow-secondary-900/10" 
                    : "text-gray-700 hover:bg-secondary-50 hover:text-secondary-600"
                )}
              >
                <Icon className={cn("shrink-0 transition-all", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div
            className={cn("flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all", isCollapsed ? "justify-center" : "gap-3")}
            onClick={() => {
              if (isCollapsed && toggleCollapse) toggleCollapse();
              else setShowProfileMenu(!showProfileMenu);
            }}
            title={isCollapsed ? "View Profile" : undefined}
          >
            <div className="w-10 h-10 shrink-0 bg-secondary-100 rounded-full flex items-center justify-center overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-secondary-600" />
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 overflow-hidden transition-all duration-300">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'user@hospital.com'}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform shrink-0", showProfileMenu && "rotate-180")} />
              </>
            )}
          </div>

          <div className={cn(
            "overflow-hidden transition-all duration-300",
            (showProfileMenu && !isCollapsed) ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0 hidden"
          )}>
            <div className="space-y-1">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-start gap-3 px-4 py-2.5 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-600">Logout</span>
              </button>
            </div>
          </div>
          
          {toggleCollapse && (
            <button 
              onClick={toggleCollapse} 
              className="mt-4 hidden lg:flex items-center justify-center w-full py-2 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-lg transition-colors border border-gray-100"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
               <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isCollapsed ? "-rotate-90" : "rotate-90")} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
