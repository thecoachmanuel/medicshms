import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LAGOS_TIMEZONE = 'Africa/Lagos';

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: LAGOS_TIMEZONE,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: LAGOS_TIMEZONE,
  }).format(new Date(date));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
}

export function getLagosDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: LAGOS_TIMEZONE }));
}

export function calculateAge(dob: string) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = getLagosDate();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
}
