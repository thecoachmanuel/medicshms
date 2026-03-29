'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  hospital_id?: string;
  hospital_slug?: string;
  subscription_status?: string;
  trial_end_date?: string;
  phone?: string;
  profile_photo?: string;
  doctorProfileId?: string;
  createdAt?: string;
}

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
          const latestUser: User = {
            id: response.id || response._id,
            name: response.name,
            email: response.email,
            role: response.role,
            hospital_id: response.hospital_id,
            hospital_slug: response.hospital_slug,
            subscription_status: response.subscription_status,
            trial_end_date: response.trial_end_date,
            phone: response.phone,
            profile_photo: response.profile_photo,
            doctorProfileId: response.doctor_profile_id || response.doctorProfileId
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
      
      const userData: User = {
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        hospital_id: response.hospital_id,
        hospital_slug: response.hospital_slug,
        subscription_status: response.subscription_status,
        trial_end_date: response.trial_end_date,
        phone: response.phone,
        profile_photo: response.profile_photo,
        doctorProfileId: response.doctor_id || response.doctorProfileId
      };

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      if (response.role === 'platform_admin') {
        router.push('/platform-admin/dashboard');
      } else if (response.hospital_slug) {
        router.push(`/${response.hospital_slug}/${response.role.toLowerCase()}/dashboard`);
      } else {
        router.push(`/${response.role.toLowerCase()}/dashboard`);
      }
      return { success: true, role: response.role };
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
    const isPlatformAdmin = pathname.startsWith('/platform-admin');
    const slug = (!isPlatformAdmin && parts.length > 1 && !['login', 'admin', 'doctor', 'receptionist'].includes(parts[1])) 
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
