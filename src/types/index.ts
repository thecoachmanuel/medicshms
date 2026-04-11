export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Platform Admin' | 'Admin' | 'Doctor' | 'Nurse' | 'Lab Scientist' | 'Pharmacist' | 'Radiologist' | 'Receptionist' | 'Patient';
  isActive: boolean;
  hospital_id?: string;
  hospital_slug?: string;
  subscription_status?: string;
  trial_end_date?: string;
  profilePhoto?: string;
  doctorProfileId?: string;
  createdAt?: string;
  updatedAt?: string;
  department?: string;
  departmentId?: string;
  clinical_preferences?: {
    default_appointment_duration: number;
    auto_finalize_results: boolean;
    notification_sounds: boolean;
    sidebar_collapsed: boolean;
  };
  receptionistInfo?: {
    shift?: string;
  };
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  defaultConsultationFee: number;
  contact?: {
    phone?: string;
    email?: string;
    location?: string;
  };
  isActive: boolean;
  doctorCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  category?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  reorder_level: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired';
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  _id: string;
  patientId: any;
  doctorId: any;
  departmentId: any;
  date: string;
  time: string;
  status: 'Draft' | 'Scheduled' | 'Confirmed' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show';
  type: string;
  reason?: string;
  notes?: string;
  vitals?: any;
  billingStatus?: 'Unpaid' | 'Partial' | 'Paid';
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  _id: string;
  patientId?: string;
  fullName: string;
  emailAddress: string;
  mobileNumber: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  hospital_id?: string;
  lastVisit?: string;
  is_active?: boolean;
  appointments?: Appointment[];
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: any;
}
