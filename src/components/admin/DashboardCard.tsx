'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: string;
  description?: string;
  className?: string;
}

export function DashboardCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  description,
  className
}: DashboardCardProps) {
  const colorMap = {
    primary: { glow: 'bg-primary-500', icon: 'group-hover:bg-primary-50 group-hover:text-primary-600' },
    emerald: { glow: 'bg-emerald-500', icon: 'group-hover:bg-emerald-50 group-hover:text-emerald-600' },
    purple: { glow: 'bg-purple-500', icon: 'group-hover:bg-purple-50 group-hover:text-purple-600' },
    amber: { glow: 'bg-amber-500', icon: 'group-hover:bg-amber-50 group-hover:text-amber-600' },
    rose: { glow: 'bg-rose-500', icon: 'group-hover:bg-rose-50 group-hover:text-rose-600' },
    cyan: { glow: 'bg-cyan-500', icon: 'group-hover:bg-cyan-50 group-hover:text-cyan-600' },
  };

  const colors = (colorMap as any)[color] || colorMap.primary;

  return (
    <div className={cn(
      "group relative overflow-hidden bg-white rounded-[2rem] p-8 border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
      className
    )}>
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
        colors.glow
      )} />

      <div className="relative flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 bg-slate-50 text-slate-400",
            colors.icon
          )}>
            <Icon className="w-7 h-7" />
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-tight uppercase shadow-sm",
              trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors">
            {label}
          </p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-500">
            {value}
          </h3>
          {description && (
            <p className="text-xs font-medium text-slate-400 mt-2 line-clamp-1 italic">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
