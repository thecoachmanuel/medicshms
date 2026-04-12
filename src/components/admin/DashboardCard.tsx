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
    label?: string;
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
    indigo: { glow: 'bg-indigo-500', icon: 'group-hover:bg-indigo-50 group-hover:text-indigo-600' },
    blue: { glow: 'bg-blue-500', icon: 'group-hover:bg-blue-50 group-hover:text-blue-600' },
  };

  const colors = (colorMap as any)[color] || colorMap.primary;

  // Determine font size based on value length
  const valueStr = String(value);
  const getFontSize = () => {
    if (valueStr.length > 15) return 'text-xl';
    if (valueStr.length > 12) return 'text-2xl';
    return 'text-3xl';
  };

  return (
    <div className={cn(
      "group relative overflow-hidden bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 min-h-[160px] flex flex-col",
      className
    )}>
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500",
        colors.glow
      )} />

      <div className="relative flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 bg-slate-50 text-slate-400 shrink-0",
            colors.icon
          )}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-tight uppercase shadow-sm shrink-0",
              trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors truncate whitespace-normal">
            {label}
          </p>
          <h3 className={cn(
            "font-black text-slate-900 tracking-tight group-hover:scale-[1.02] origin-left transition-all duration-500 break-words leading-tight",
            getFontSize()
          )}>
            {value}
          </h3>
          {description && (
            <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-2 italic break-words line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
