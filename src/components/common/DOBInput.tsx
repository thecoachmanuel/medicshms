'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DOBInputProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export const DOBInput = ({ value, onChange, label, required }: DOBInputProps) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Initialize from value prop
  useEffect(() => {
    if (value && value.includes('-')) {
      const [vYear, vMonth, vDay] = value.split('-');
      setYear(vYear || '');
      setMonth(vMonth || '');
      setDay(vDay || '');
    }
  }, [value]);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    if (val.length === 2 && parseInt(val) > 0 && parseInt(val) <= 31) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    if (val.length === 2 && parseInt(val) > 0 && parseInt(val) <= 12) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
  };

  // Trigger onChange when all fields are valid
  useEffect(() => {
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      // Basic validation check
      const date = new Date(formattedDate);
      if (!isNaN(date.getTime())) {
        onChange(formattedDate);
      }
    }
  }, [day, month, year, onChange]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 block ml-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-3 gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all">
          <div className="relative">
            <input
              type="text"
              placeholder="DD"
              value={day}
              onChange={handleDayChange}
              className="w-full bg-transparent border-none text-center text-sm font-bold placeholder:text-slate-300 focus:ring-0 p-2"
              maxLength={2}
            />
          </div>
          <div className="relative border-x border-slate-200">
            <input
              ref={monthRef}
              type="text"
              placeholder="MM"
              value={month}
              onChange={handleMonthChange}
              className="w-full bg-transparent border-none text-center text-sm font-bold placeholder:text-slate-300 focus:ring-0 p-2"
              maxLength={2}
            />
          </div>
          <div className="relative">
            <input
              ref={yearRef}
              type="text"
              placeholder="YYYY"
              value={year}
              onChange={handleYearChange}
              className="w-full bg-transparent border-none text-center text-sm font-bold placeholder:text-slate-300 focus:ring-0 p-2"
              maxLength={4}
            />
          </div>
        </div>
        <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-slate-400">
          <Calendar className="w-5 h-5" />
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-medium ml-2 tracking-wide uppercase">Format: Day / Month / Year</p>
    </div>
  );
};
