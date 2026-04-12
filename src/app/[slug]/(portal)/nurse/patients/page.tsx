'use client';

import React from 'react';
import PatientsList from '@/components/patients/PatientsList';

export default function NursePatientsPage() {
  return (
    <div className="space-y-6">
      <PatientsList role="Nurse" />
    </div>
  );
}
