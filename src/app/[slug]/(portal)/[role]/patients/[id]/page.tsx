'use client';

import React, { use } from 'react';
import PatientTimeline from '@/components/clinical/PatientTimeline';
import { Suspense } from 'react';

export default function PatientEMRPage({ params }: { params: Promise<{ id: string; role: string }> }) {
  const { id } = use(params);

  return (
    <div className="p-8">
      <Suspense fallback={<div className="animate-pulse text-gray-400 font-black uppercase tracking-[0.3em] text-xs">Synchronizing Clinical Timeline...</div>}>
         <PatientTimeline patientId={id} />
      </Suspense>
    </div>
  );
}
