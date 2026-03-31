'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { Pill, Package, AlertTriangle } from 'lucide-react';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;

  const quickLinks = [
    { name: 'Prescriptions Queue', icon: Pill, href: `/${slug}/pharmacist/prescriptions`, color: 'bg-primary-500', bgColor: 'bg-primary-50 text-primary-600' },
    { name: 'Pharmacy Inventory', icon: Package, href: `/${slug}/pharmacist/inventory`, color: 'bg-emerald-500', bgColor: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center space-x-4"
          >
            <div className={`p-4 rounded-lg ${link.bgColor}`}>
              <link.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{link.name}</p>
              <p className="text-sm text-gray-500 text-sm mt-1">Manage {link.name.toLowerCase()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
