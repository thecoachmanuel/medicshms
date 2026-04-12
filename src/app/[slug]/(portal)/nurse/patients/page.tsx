'use client';

import React from 'react';
import PatientsList from '@/components/patients/PatientsList';

export default function NursePatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Patient Directory</h1>
        <p className="text-gray-500 text-sm">Review full clinical profiles and historical records.</p>
      </div>
      
      <PatientsList role="Nurse" />
    </div>
  );
}
