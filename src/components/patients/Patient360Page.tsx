'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import PatientTimeline from '@/components/clinical/PatientTimeline';
import { ChevronLeft, ArrowLeftCircle } from 'lucide-react';

interface Props {
  role: string;
}

export default function Patient360Page({ role }: Props) {
  const { slug, id } = useParams();
  const router = useRouter();

  if (!id) return null;

  return (
    <div className="relative min-h-screen space-y-6">
       {/* Background Decor */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-white -z-10" />
       <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

       {/* Top Navigation */}
       <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-5 py-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white hover:border-gray-200 transition-all hover:shadow-lg active:scale-95"
          >
            <ArrowLeftCircle className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-primary-600">Back to Registry</span>
          </button>

          <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">360 View</span>
             <span className="text-gray-300 font-bold">•</span>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Electronic Medical Record</span>
          </div>
       </div>

       {/* The Core Content */}
       <PatientTimeline patientId={id as string} />
    </div>
  );
}
