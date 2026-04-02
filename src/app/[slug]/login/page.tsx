'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SettingsContext';
import HospitalLogo from '@/components/common/HospitalLogo';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { use } from 'react';
import GlobalBanner from '@/components/common/GlobalBanner';

export default function HospitalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role.toLowerCase();
      if (role === 'Platform Admin') {
        router.push('/platform-admin/dashboard');
      } else {
        const authorizedSlug = user.hospital_slug || slug;
        router.push(`/${authorizedSlug}/${role}/dashboard`);
      }
    }
  }, [user, authLoading, router, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please enter both email/phone and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login({ identifier, password });
      if (result.success) {
        toast.success('Login successful!');
        // Redirection is handled by the useEffect above
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (authLoading || settingsLoading || !mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-slate-200 rounded-[2rem]"></div>
          <div className="h-4 w-48 bg-slate-100 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <GlobalBanner slug={slug} settings={settings} />
      <div className="w-full max-w-md mb-8 mt-12">
        <Link href={`/${slug}`} className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-secondary-600 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Hospital Site
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-10">
            <HospitalLogo size="lg" className="h-24 w-auto" slug={slug} />
          </div>
          <p className="text-slate-400 mt-2 font-medium">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Email or Phone</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary-600 transition-colors" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your credentials"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-secondary-600/5 focus:border-secondary-600 transition-all outline-none font-medium placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Secret Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-secondary-600 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-secondary-600/5 focus:border-secondary-600 transition-all outline-none font-medium placeholder:text-slate-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="w-5 h-5 bg-slate-100 border-2 border-slate-200 rounded-md peer-checked:bg-secondary-600 peer-checked:border-secondary-600 transition-all"></div>
                <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="ml-3 text-sm font-bold text-slate-500">Stay signed in</span>
            </label>
            <button type="button" className="text-sm font-bold text-secondary-600 hover:text-secondary-700 transition-colors">
              Recover access?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/10 hover:bg-secondary-900 hover:shadow-secondary-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enter Portal'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-sm font-medium text-slate-400">
            Powered by <span className="text-slate-900 font-black tracking-tight">{settings?.hospital_name || 'MedicsHMS'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
