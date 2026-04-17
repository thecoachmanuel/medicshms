export type InstitutionType = 'hospital' | 'dental_clinic' | 'diagnostic_center' | 'eye_clinic';

export interface InstitutionConfig {
  id: InstitutionType;
  label: string;
  genericTerm: 'Hospital' | 'Clinic';
  defaultFeatures: string[];
  restrictedFeatures?: string[];
  dashboardWidgets: string[];
}

export const INSTITUTION_CONFIGS: Record<InstitutionType, InstitutionConfig> = {
  hospital: {
    id: 'hospital',
    label: 'Hospital',
    genericTerm: 'Hospital',
    defaultFeatures: ['Laboratory', 'Pharmacy', 'Radiology', 'Inpatient', 'Analytics'],
    dashboardWidgets: ['revenue', 'appointments', 'queue', 'yield-map', 'productivity'],
  },
  dental_clinic: {
    id: 'dental_clinic',
    label: 'Dental Clinic',
    genericTerm: 'Clinic',
    defaultFeatures: ['Appointments', 'Billing', 'Dental Records'], // specific features could be added later
    dashboardWidgets: ['revenue', 'appointments', 'queue'],
  },
  diagnostic_center: {
    id: 'diagnostic_center',
    label: 'Diagnostic Center',
    genericTerm: 'Clinic',
    defaultFeatures: ['Laboratory', 'Radiology', 'Billing'],
    dashboardWidgets: ['revenue', 'lab-inbox', 'queue'],
  },
  eye_clinic: {
    id: 'eye_clinic',
    label: 'Eye Clinic',
    genericTerm: 'Clinic',
    defaultFeatures: ['Appointments', 'Billing', 'Vision Tests'],
    dashboardWidgets: ['revenue', 'appointments', 'queue'],
  },
};

export const getInstitutionLabel = (type?: InstitutionType) => {
  if (!type || !INSTITUTION_CONFIGS[type]) return 'Hospital';
  return INSTITUTION_CONFIGS[type].label;
};

export const getGenericTerm = (type?: InstitutionType) => {
  if (!type || !INSTITUTION_CONFIGS[type]) return 'Hospital';
  return INSTITUTION_CONFIGS[type].genericTerm;
};
