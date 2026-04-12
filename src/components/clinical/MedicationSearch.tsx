'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Pill, Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { pharmacyAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Medication {
  id: string;
  item_name: string;
  quantity: number;
  price?: number;
}

interface Props {
  onSelect: (med: any) => void;
  placeholder?: string;
}

export default function MedicationSearch({ onSelect, placeholder = "Search inventory..." }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMeds = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await pharmacyAPI.getInventory({ search: searchTerm }) as any;
        setResults(res.data || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Failed to fetch medications');
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchMeds, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
        <input 
          type="text"
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-sm font-medium"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
        )}
      </div>

      {isOpen && (results.length > 0 || searchTerm.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2">
          <div className="max-h-64 overflow-y-auto no-scrollbar">
            {results.map((med) => (
              <button
                key={med.id}
                onClick={() => {
                  onSelect(med);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-primary-50 text-left border-b border-gray-50 last:border-0 transition-colors group"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary-600 transition-colors">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">{med.item_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                      Stock: {med.quantity} Units Available
                    </p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-gray-300 group-hover:text-primary-600" />
              </button>
            ))}
            
            {results.length === 0 && !isLoading && (
              <div className="p-8 text-center bg-gray-50/50">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-500 tracking-tight">"{searchTerm}" not in inventory</p>
                <button 
                  onClick={() => {
                    onSelect({ item_name: searchTerm, isCustom: true });
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className="mt-3 text-[10px] font-black uppercase text-primary-600 hover:underline"
                >
                  Prescribe as manual entry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
