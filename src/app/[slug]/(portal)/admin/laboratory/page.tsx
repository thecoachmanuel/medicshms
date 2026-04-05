'use client';

import React from 'react';
import LabManagementSection from '@/components/admin/LabManagementSection';
import { FlaskConical } from 'lucide-react';

export default function LaboratoryMatrixPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[1.5rem] bg-primary-600 shadow-xl shadow-primary-600/20 flex items-center justify-center text-white">
            <FlaskConical className="w-6 h-6 animate-pulse-slow" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Laboratory Matrix</h1>
        </div>
        <p className="text-sm text-gray-500 font-medium ml-15">
          Advanced diagnostic infrastructure management and clinical laboratory orchestration.
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 min-h-[600px]">
        <LabManagementSection />
      </div>
    </div>
  );
}
