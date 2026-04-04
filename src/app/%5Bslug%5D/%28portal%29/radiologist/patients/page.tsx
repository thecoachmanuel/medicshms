'use client';

import React, { useState, useEffect } from 'react';
import { patientsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  ChevronRight, 
  FileText, 
  Activity, 
  PlusCircle, 
  User,
  ArrowRight,
  Scan
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function RadiantPatientsPage() {
  const { slug } = useParams();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response: any = await patientsAPI.getAll();
      setPatients(response.data || response || []);
    } catch (error) {
      toast.error('Failed to load radiant patient records');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/20 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            Clinical Contacts
          </h1>
          <p className="text-gray-500 font-medium mt-1 ml-15">Unified directory for imaging informatics and reporting.</p>
        </div>
        
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-all" />
          <input 
            type="text"
            placeholder="Search Subject Name or ID..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white/50 rounded-3xl animate-pulse border border-gray-100" />
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">
            <User className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-widest text-xs">No clinical records found in this segment</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div key={patient.id} className="group relative bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner">
                    {patient.full_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {patient.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                         #{patient.patient_id}
                       </span>
                    </div>
                  </div>
                </div>
                <Link 
                  href={`/${slug}/radiologist/requests?patientId=${patient.id}`}
                  className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-white hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all shadow-lg"
                  title="Assign Scan"
                >
                  <PlusCircle className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Gender / Age</p>
                    <p className="text-xs font-bold text-gray-700">{patient.gender || 'N/A'} • {patient.age || '--'}yrs</p>
                 </div>
                 <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Status</p>
                    <p className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block">Active Archive</p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-2">
                    <Scan className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imaging Context Ready</span>
                 </div>
                 <Link 
                   href={`/${slug}/radiologist/requests?search=${patient.full_name}`}
                   className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-all"
                 >
                    Study History <ArrowRight className="w-3 h-3" />
                 </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
