'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SettingsContext';
import HospitalLogo from '@/components/common/HospitalLogo';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function LoginForm() {
  const searchParams = useSearchParams();
  const { settings, slug } = useSiteSettings();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const roleName = user.role || '';
      const normalizedRole = roleName.toLowerCase();
      const roleSlug = normalizedRole.replace(/\s+/g, '-');

      if (normalizedRole === 'platform admin' || normalizedRole === 'super_admin') {
        router.push('/platform-admin/dashboard');
      } else {
        const targetSlug = user.hospital_slug || slug;
        if (targetSlug) {
          router.push(`/${targetSlug}/${roleSlug}/dashboard`);
        } else {
          router.push(`/${roleSlug}/dashboard`);
        }
      }
    }
  }, [user, loading, router, slug]);

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
        if (result.role !== 'Platform Admin' && result.role !== 'super_admin') {
          toast.error('This portal is for Platform Administrators only. Redirecting to your hospital...');
          // Redirection will be handled by useEffect, but we've shown the error
        } else {
          toast.success('Login successful!');
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8">
            <HospitalLogo size="lg" className="h-16 w-auto" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Secure access for MedicsHMS Super Admins</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email or Phone</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500" />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <button type="button" className="text-sm font-semibold text-secondary-600 hover:text-secondary-700">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-secondary-900 text-white py-3 rounded-xl font-bold hover:bg-secondary-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an account? <span className="text-primary-600 font-semibold cursor-pointer hover:underline">Contact Administrator</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
