'use client';

import React from 'react';
import AppointmentsList from '@/components/appointments/AppointmentsList';

export default function NurseAppointmentsPage() {
  return (
    <div className="space-y-6">
      <AppointmentsList role="Nurse" />
    </div>
  );
}
