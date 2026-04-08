import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  User, 
  Department, 
  InventoryItem, 
  APIResponse,
  Appointment,
  Patient
} from '@/types';

// Define a custom axios instance type that reflects the response interceptor's unwrapping
interface CustomAxiosInstance extends AxiosInstance {
  get<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add hospital slug and host for multi-tenant support (especially for Super Admin)
      const pathParts = window.location.pathname.split('/');
      const isPlatformAdmin = window.location.pathname.startsWith('/platform-admin');
      
      // Always send the host for custom domain resolution
      config.headers['x-hospital-host'] = window.location.hostname;

      if (!isPlatformAdmin && pathParts.length > 1) {
        const possibleSlug = pathParts[1];
        // Simple validation: ignore common non-slug parts or specialized routes
        if (possibleSlug && !['login', 'register', 'auth', 'platform-admin', 'admin', 'doctor', 'receptionist'].includes(possibleSlug)) {
          config.headers['x-hospital-slug'] = possibleSlug;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        const parts = window.location.pathname.split('/');
        const isPlatformAdmin = window.location.pathname.startsWith('/platform-admin');
        const slug = (!isPlatformAdmin && parts.length > 1 && parts[1] !== 'admin' && parts[1] !== 'doctor' && parts[1] !== 'receptionist') 
          ? parts[1] 
          : '';
        
        if (slug) {
          window.location.href = `/${slug}/login`;
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const authAPI = {
  login: (credentials: any) => api.post<APIResponse<{ user: User; token: string }>>('/auth/login', credentials),
  register: (userData: any) => api.post<APIResponse<{ user: User; token: string }>>('/auth/register', userData),
  getProfile: () => api.get<APIResponse<User>>('/auth/profile'),
  updateProfile: (userData: Partial<User>) => api.put<APIResponse<User>>('/auth/profile', userData),
  uploadPhoto: (formData: FormData) => api.post<APIResponse<{ url: string }>>('/profile/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePhoto: () => api.delete<APIResponse<void>>('/profile/photo'),
};

export const usersAPI = {
  getUsersByRole: (role: string) => api.get<APIResponse<User[]>>(`/user-management/role/${role}`),
  createUser: (data: any) => api.post<APIResponse<User>>('/user-management', data),
  updateUser: (id: string, data: Partial<User>) => api.put<APIResponse<User>>(`/user-management/${id}`, data),
  toggleStatus: (id: string) => api.patch<APIResponse<User>>(`/user-management/${id}/toggle-status`),
  resetPassword: (id: string) => api.patch<APIResponse<{ message: string }>>(`/user-management/${id}/reset-password`),
  getFullProfile: (id: string) => api.get<APIResponse<User>>(`/user-management/profile/${id}`),
  getProfile: (id: string) => api.get<APIResponse<User>>(`/user-management/profile/${id}`),
  deleteUser: (id: string) => api.delete<APIResponse<void>>(`/user-management/${id}`),
};

export const appointmentsAPI = {
  getAll: (params?: any) => api.get<APIResponse<Appointment[]>>('/admin-appointments', { params }),
  getMyAppointments: (params?: any) => api.get<APIResponse<Appointment[]>>('/admin-appointments/my-appointments', { params }),
  getById: (id: string) => api.get<APIResponse<Appointment>>(`/admin-appointments/${id}`),
  create: (data: any) => api.post<APIResponse<Appointment>>('/admin-appointments', data),
  book: (data: any) => api.post<APIResponse<Appointment>>('/admin-appointments/book', data),
  update: (id: string, data: any) => api.put<APIResponse<Appointment>>(`/admin-appointments/${id}`, data),
  delete: (id: string) => api.delete<APIResponse<void>>(`/admin-appointments/${id}`),
  updateStatus: (id: string, status: string, reason?: string, data?: any) => 
    api.patch<APIResponse<Appointment>>(`/admin-appointments/${id}/status`, { status, reason, ...data }),
  assignDoctor: (id: string, doctorId: string) => 
    api.patch<APIResponse<Appointment>>(`/admin-appointments/${id}/assign-doctor`, { doctorId }),
  getTimeSlots: (date: string, department?: string) => 
    api.get<APIResponse<string[]>>('/admin-appointments/slots', { params: { date, department } }),
  lookupPatient: (mobile: string) => 
    api.get<APIResponse<User>>(`/admin-appointments/lookup/${mobile}`),
  doctorComplete: (id: string, data?: any) => api.patch<APIResponse<Appointment>>(`/admin-appointments/${id}/doctor-complete`, data),
  doctorRemove: (id: string, reason: string) => 
    api.patch<APIResponse<Appointment>>(`/admin-appointments/${id}/doctor-remove`, { reason }),
  getStats: () => api.get<APIResponse<any>>('/admin-appointments/stats'),
  download: (params?: any) => api.get<APIResponse<any>>('/admin-appointments/download', { params }),
};



export const patientsAPI = {
  getAll: (params?: any) => api.get<APIResponse<Patient[]>>('/patients', { params }),
  getById: (id: string) => api.get<APIResponse<Patient>>(`/patients/${id}`),
  getMe: () => api.get<APIResponse<Patient>>('/patients/me'),
  updateMe: (data: Partial<Patient>) => api.put<APIResponse<Patient>>('/patients/me', data),
  create: (data: any) => api.post<APIResponse<Patient>>('/patients', data),
  update: (id: string, data: Partial<Patient>) => api.patch<APIResponse<Patient>>(`/patients/${id}`, data),
  delete: (id: string) => api.delete<APIResponse<void>>(`/patients/${id}`),
  download: (params?: any) => api.get<APIResponse<any>>('/patients/public-appointments/download', { params }),
  getPublicList: (params: any) => api.get<APIResponse<Appointment[]>>('/patients/public-appointments/list', { params }),
};

export const departmentsAPI = {
  getAll: (params?: any) => api.get<APIResponse<Department[]>>('/departments', { params }),
  getAdminAll: () => api.get<APIResponse<Department[]>>('/departments/admin/all'),
  getById: (id: string) => api.get<APIResponse<Department>>(`/departments/${id}`),
  create: (formData: FormData) => api.post<APIResponse<Department>>('/departments', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  update: (id: string, formData: FormData) => api.put<APIResponse<Department>>(`/departments/${id}`, formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  toggleStatus: (id: string) => api.patch<APIResponse<Department>>(`/departments/${id}/toggle-status`),
  delete: (id: string) => api.delete<APIResponse<void>>(`/departments/${id}`),
};

export const servicesAPI = {
  getAll: (params?: any) => api.get<APIResponse<any[]>>('/services', { params }),
  create: (data: any) => api.post<APIResponse<any>>('/services', data),
  update: (id: string, data: any) => api.put<APIResponse<any>>(`/services/${id}`, data),
  delete: (id: string) => api.delete<APIResponse<void>>(`/services/${id}`),
};

export const doctorsAPI = {
  getAll: () => api.get<APIResponse<User[]>>('/doctors'),
  getById: (id: string) => api.get<APIResponse<User>>(`/doctors/${id}`),
  createProfile: (data: any) => api.post<APIResponse<any>>('/doctors', data),
  updateProfile: (id: string, data: any) => api.put<APIResponse<any>>(`/doctors/${id}`, data),
};

export const billingAPI = {
  getAppointmentsOverview: (params: any) => api.get('/bills/appointments-billing', { params }),
  getDoctorFee: (appointmentId: string) => api.get(`/bills/doctor-fee/${appointmentId}`),
  generateInvoice: (appointmentId: string, data: any) => api.post(`/bills/generate/${appointmentId}`, data),
  getById: (id: string) => api.get(`/bills/${id}`),
  update: (id: string, data: any) => api.put(`/bills/${id}`, data),
  getInsights: (params: any) => api.get('/bills/insights', { params }),
  download: (params?: any) => api.get('/bills/download', { params }),
  generateForLab: (requestId: string, data: any) => api.post(`/bills/generate-lab/${requestId}`, data),
  delete: (id: string) => api.delete(`/bills/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentAppointments: () => api.get('/dashboard/appointments'),
  getActivityFeed: () => api.get('/dashboard/activity'),
  getChartData: (type: string) => api.get(`/dashboard/charts/${type}`),
  getDoctorStats: () => api.get('/doctor-dashboard/stats'),
  getDoctorRecentAppointments: () => api.get('/doctor-dashboard/appointments'),
  getDoctorProfile: () => api.get('/doctor-dashboard/profile'),
  getDoctorTodayAppointments: () => api.get('/doctor-dashboard/today-appointments'),
  getDoctorChartData: (type: string) => api.get(`/doctor-dashboard/charts/${type}`),
  getDoctorActivity: () => api.get('/doctor-dashboard/activity'),
};

export const doctorDashboardAPI = {
  getStats: () => api.get('/doctor-dashboard/stats'),
  getTodayAppointments: () => api.get('/doctor-dashboard/today'),
  getActivity: () => api.get('/doctor-dashboard/activity'),
  getChartData: (type: string) => api.get(`/doctor-dashboard/charts/${type}`),
  getProfile: () => api.get('/doctor-dashboard/profile'),
};

export const slotConfigAPI = {
  getDefaults: () => api.get('/slot-config/defaults'),
  updateDefaults: (data: any) => api.put('/slot-config/defaults', data),
  getMyConfig: () => api.get('/slot-config/my-config'),
  updateConfig: (data: any) => api.put('/slot-config/my-config', data),
  getWorkingDays: () => api.get('/slot-config/working-days'),
  updateWorkingDays: (data: any) => api.put('/slot-config/working-days', data),
  getBookingRules: () => api.get('/slot-config/booking-rules'),
  updateBookingRules: (data: any) => api.put('/slot-config/booking-rules', data),
};

export const invoiceTemplateAPI = {
  get: () => api.get('/invoice-template'),
  update: (data: any) => api.put('/invoice-template', data),
};

export const announcementAPI = {
  getAll: () => api.get('/announcements'),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
  toggle: (id: string) => api.patch(`/announcements/${id}/toggle`),
};

export const siteUpdateAPI = {
  getAll: () => api.get('/site-updates'),
  create: (data: any) => api.post('/site-updates', data),
  update: (id: string, data: any) => api.put(`/site-updates/${id}`, data),
  delete: (id: string) => api.delete(`/site-updates/${id}`),
  toggle: (id: string) => api.patch(`/site-updates/${id}/toggle`),
};

export const supportAPI = {
  getAll: (params?: any) => api.get('/support', { params }),
  getById: (id: string) => api.get(`/support/${id}`),
  create: (data: any) => api.post('/support', data),
  update: (id: string, data: any) => api.put(`/support/${id}`, data),
  delete: (id: string) => api.delete(`/support/${id}`),
};

export const publicAppointmentsAPI = {
  book: (data: any) => api.post('/public-appointments', data),
  getTimeSlots: (date: string, department: string, hospitalId: string) => 
    api.get('/admin-appointments/slots', { params: { date, department, hospitalId, isPublic: true } }),
  lookupPatient: (params: { email: string; dob: string; hospitalId: string }) =>
    api.get('/public-appointments/lookup', { params }),
};

export const siteSettingsAPI = {
  get: (params?: { slug?: string; hospital_id?: string }) => api.get('/site-settings', { params }),
  update: (data: any) => api.put('/site-settings', data),
};

export const contentAPI = {
  getByPage: (page: string, slug?: string) => api.get('/site-content', { params: { page, slug } }),
  update: (data: any[]) => api.put('/site-content', data),
};

export const uploadAPI = {
  upload: (formData: FormData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const profileAPI = {
  uploadPhoto: (formData: FormData) => api.post('/profile/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePhoto: () => api.delete('/profile/photo'),
};

export const platformAdminAPI = {
  getHospitals: () => api.get('/platform-admin/hospitals'),
  createHospital: (data: any) => api.post('/platform-admin/hospitals', data),
  updateHospital: (id: string, data: any) => api.patch(`/platform-admin/hospitals/${id}`, data),
};

export const demoRequestsAPI = {
  getAll: () => api.get('/platform-admin/demo-requests'),
  update: (data: any) => api.put('/platform-admin/demo-requests', data),
};

export const subscriptionPlansAPI = {
  getPublic: () => api.get('/subscription-plans/public'),
  getAll: () => api.get('/subscription-plans'),
  getById: (id: string) => api.get(`/subscription-plans/${id}`),
  create: (data: any) => api.post('/subscription-plans', data),
  update: (id: string, data: any) => api.put(`/subscription-plans/${id}`, data),
  delete: (id: string) => api.delete(`/subscription-plans/${id}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const vitalsAPI = {
  getPatientVitals: (patientId: string, appointmentId?: string) => 
    api.get<APIResponse<any[]>>('/vitals', { params: { patientId, appointmentId } }),
  recordVitals: (data: any) => api.post<APIResponse<any>>('/vitals', data),
};

export const labAPI = {
  getRequests: (params?: any) => api.get<APIResponse<any[]>>('/lab-services', { params }),
  createRequest: (data: {
    patient_id: string;
    test_name?: string;
    service_id?: string;
    unit_id?: string;
    test_price?: number;
    clinical_notes?: string;
    specimen_type?: string;
    priority?: 'Routine' | 'Urgent' | 'Stat';
    patient_preparation?: string;
    collection_instructions?: string;
    lab_number?: string;
    requested_by_name?: string;
    patient_age?: string;
    patient_gender?: string;
    tests?: Array<{
      test_name: string;
      test_price: number;
      unit_id?: string;
      service_id?: string;
    }>;
  }) => api.post<APIResponse<any>>('/lab-services', data),
  updateResult: (data: { 
    request_id: string; 
    status?: string; 
    results?: string; 
    file_url?: string;
    collected_at?: string;
    min_range?: number;
    max_range?: number;
    is_critical?: boolean;
    unit?: string;
    test_price?: number;
    test_name?: string;
    unit_id?: string;
    payment_status?: string;
    hospital_details?: any;
    unit_name?: string;
  }) => api.put<APIResponse<any>>('/lab-services', data),

  // Lab Matrix & Catalog
  getUnits: () => api.get<APIResponse<any[]>>('/lab-management/units'),
  createUnit: (data: any) => api.post<APIResponse<any>>('/lab-management/units', data),
  updateUnit: (id: string, data: any) => api.put<APIResponse<any>>(`/lab-management/units/${id}`, data),
  deleteUnit: (id: string) => api.delete<APIResponse<void>>(`/lab-management/units/${id}`),

  getCatalog: (params?: any) => api.get<APIResponse<any[]>>('/lab-management/catalog', { params }),
  upsertCatalogItem: (data: any) => api.post<APIResponse<any>>('/lab-management/catalog', data),
  deleteCatalogItem: (id: string) => api.delete<APIResponse<void>>(`/lab-management/catalog/${id}`),

  getAssignments: (params?: any) => api.get<APIResponse<any[]>>('/lab-management/assignments', { params }),
  assignScientist: (data: { unit_id: string; scientist_id: string }) => api.post<APIResponse<any>>('/lab-management/assignments', data),
  removeAssignment: (id: string) => api.delete<APIResponse<void>>(`/lab-management/assignments/${id}`),
};

export const pharmacyAPI = {
  getInventory: (params?: any) => api.get<APIResponse<InventoryItem[]>>('/pharmacy/inventory', { params }),
  createInventoryItem: (data: Partial<InventoryItem>) => api.post<APIResponse<InventoryItem>>('/pharmacy/inventory', data),
  updateInventoryItem: (data: Partial<InventoryItem> & { id: string }) => api.put<APIResponse<InventoryItem>>('/pharmacy/inventory', data),
  getPrescriptions: (params?: any) => api.get<APIResponse<any[]>>('/pharmacy/prescriptions', { params }),
  createPrescription: (data: any) => api.post<APIResponse<any>>('/pharmacy/prescriptions', data),
  updatePrescription: (data: any) => api.put<APIResponse<any>>('/pharmacy/prescriptions', data),
};

export const radiologyAPI = {
  getRequests: (params?: any) => api.get<APIResponse<any[]>>('/radiology', { params }),
  createRequest: (data: any) => api.post<APIResponse<any>>('/radiology', data),
  updateResult: (data: any) => api.put<APIResponse<any>>('/radiology', data),
};

export const subscriptionAPI = {
  verifyPayment: (data: any) => api.post<APIResponse<any>>('/billing/verify', data),
  getHistory: () => api.get<APIResponse<any[]>>('/billing/history'),
};

// Aliases for backward compatibility
export const appointmentAPI = appointmentsAPI;
export const departmentAPI = departmentsAPI;
export const doctorAPI = doctorsAPI;
export const patientAPI = patientsAPI;

export default api;
