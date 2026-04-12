'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';

import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token) {
        try {
          // Verify token and get latest profile
          const response: any = await authAPI.getProfile();
          const userProfile = response.data; // Unwrap APIResponse
          
          const latestUser: User = {
            _id: userProfile.id || userProfile._id,
            id: userProfile.id || userProfile._id,
            name: userProfile.name,
            email: userProfile.email || '',
            role: userProfile.role,
            isActive: userProfile.isActive ?? true,
            hospital_id: userProfile.hospital_id,
            hospital_slug: userProfile.hospital_slug,
            subscription_status: userProfile.subscription_status,
            trial_end_date: userProfile.trial_end_date,
            phone: userProfile.phone || '',
            profilePhoto: userProfile.profilePhoto || userProfile.profile_photo,
            doctorProfileId: userProfile.doctorProfile?._id || userProfile.doctor_profile_id || userProfile.doctorProfileId,
            clinical_preferences: userProfile.clinical_preferences
          };
          localStorage.setItem('user', JSON.stringify(latestUser));
          setUser(latestUser);
        } catch (err) {
          console.error('Auth refresh failed:', err);
          if (userData) {
            setUser(JSON.parse(userData));
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      setError(null);
      const response: any = await authAPI.login(credentials);
      const authData = response.data; // Unwrap APIResponse
      const loginUser = authData.user;
      
      const userData: User = {
        _id: loginUser._id || loginUser.id,
        id: loginUser._id || loginUser.id,
        name: loginUser.name,
        email: loginUser.email,
        role: loginUser.role,
        isActive: loginUser.isActive ?? true,
        hospital_id: loginUser.hospital_id,
        hospital_slug: loginUser.hospital_slug,
        subscription_status: loginUser.subscription_status,
        trial_end_date: loginUser.trial_end_date,
        phone: loginUser.phone,
        profilePhoto: loginUser.profilePhoto || loginUser.profile_photo,
        doctorProfileId: loginUser.doctorProfile?._id || loginUser.doctor_id || loginUser.doctorProfileId,
        clinical_preferences: loginUser.clinical_preferences
      };

      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      const roleSlug = loginUser.role.toLowerCase().replace(/[\s_]+/g, '-');
      if (isPlatformAdmin(loginUser.role)) {
        router.push('/platform-admin/dashboard');
      } else if (loginUser.hospital_slug) {
        router.push(`/${loginUser.hospital_slug}/${roleSlug}/dashboard`);
      } else {
        router.push(`/${roleSlug}/dashboard`);
      }
      return { success: true, role: loginUser.role };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const pathname = window.location.pathname;
    const parts = pathname.split('/');
    const isPlatformRoute = pathname.startsWith('/platform-admin');
    const portalRoles = ['login', 'admin', 'doctor', 'receptionist', 'nurse', 'lab-scientist', 'pharmacist', 'radiologist', 'patient'];
    const slug = (!isPlatformRoute && parts.length > 1 && !portalRoles.includes(parts[1])) 
      ? parts[1] 
      : '';

    setUser(null);
    if (slug) {
      router.push(`/${slug}/login`);
    } else {
      router.push('/login');
    }
  };
  
  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
