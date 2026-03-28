'use client';

import React from 'react';
import { Hospital } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HospitalLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  hideName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  slug?: string;
}

import { useAuth } from '@/context/AuthContext';

export default function HospitalLogo({ 
  className, 
  iconClassName, 
  textClassName,
  showText = true,
  hideName,
  size = 'md',
  slug: propSlug
}: HospitalLogoProps) {
  const { user } = useAuth();
  const { settings, loading } = useSettings(propSlug);

  const formatHospitalName = (name?: string, slug?: string) => {
    if (settings?.hospital_short_name) return settings.hospital_short_name;
    
    if (name) {
      // Remove common suffixes to keep it concise for the logo
      const suffixes = ['medical centre', 'medical center', 'hospital', 'clinic', 'health center', 'nursing home', 'specialist hospital', 'teaching hospital'];
      let formatted = name.toLowerCase();
      
      for (const suffix of suffixes) {
        if (formatted.includes(suffix)) {
          formatted = formatted.replace(suffix, '').trim();
          break;
        }
      }
      
      // Capitalize each word
      return formatted.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    if (slug) {
      // Format slug: "faithcity" -> "Faithcity" or "faith-city" -> "Faith City"
      return slug.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    return '';
  };

  const logoUrl = settings?.logo_url;
  
  // Only use platform name fallback if NO tenant context is present
  const hasTenantContext = !!(propSlug || (!user?.role?.includes('platform_admin') && user?.hospital_id));
  const fallbackName = hasTenantContext ? '' : 'MedicsHMS';
  const hospitalName = formatHospitalName(settings?.hospital_name, propSlug) || fallbackName;
  
  const displayText = showText && !hideName;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-10 h-10"
  };

  // While loading, if we have a tenant context, show a skeleton to avoid platform logo flash
  if (loading && hasTenantContext) {
    return (
      <div className={cn("flex items-center gap-2.5 animate-pulse", className)}>
        <div className={cn(
          "rounded-xl bg-slate-200",
          iconClassName || sizeClasses[size]
        )} />
        {displayText && (
          <div className={cn(
            "h-6 bg-slate-100 rounded w-24",
            size === 'lg' ? "h-8 w-32" : "h-6 w-24"
          )} />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-xl text-primary-600 transition-transform duration-300",
        iconClassName || sizeClasses[size]
      )}>
        {logoUrl ? (
          <img src={logoUrl} alt={hospitalName} className="w-full h-full object-contain" />
        ) : (
          <Hospital className={cn(iconSizes[size], !iconClassName && iconSizes[size])} />
        )}
      </div>
      {displayText && (
        <span className={cn(
          "font-black tracking-tight text-gray-900", 
          size === 'lg' ? "text-2xl" : "text-xl",
          textClassName
        )}>
          {hospitalName}
        </span>
      )}
    </div>
  );
}
