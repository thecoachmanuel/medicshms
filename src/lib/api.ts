import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData: any) => api.put('/auth/profile', userData),
};

export const usersAPI = {
  getUsersByRole: (role: string) => api.get(`/user-management/role/${role}`),
  createUser: (data: any) => api.post('/user-management', data),
  updateUser: (id: string, data: any) => api.put(`/user-management/${id}`, data),
  toggleStatus: (id: string) => api.patch(`/user-management/${id}/toggle-status`),
  resetPassword: (id: string) => api.patch(`/user-management/${id}/reset-password`),
  getFullProfile: (id: string) => api.get(`/user-management/profile/${id}`),
  getProfile: (id: string) => api.get(`/user-management/profile/${id}`),
  deleteUser: (id: string) => api.delete(`/user-management/${id}`),
};

export const appointmentsAPI = {
  getAll: (params?: any) => api.get('/admin-appointments', { params }),
  getMyAppointments: (params?: any) => api.get('/admin-appointments/my-appointments', { params }),
  getById: (id: string) => api.get(`/admin-appointments/${id}`),
  create: (data: any) => api.post('/admin-appointments', data),
  book: (data: any) => api.post('/admin-appointments/book', data),
  update: (id: string, data: any) => api.put(`/admin-appointments/${id}`, data),
  delete: (id: string) => api.delete(`/admin-appointments/${id}`),
  updateStatus: (id: string, status: string, reason?: string) => 
    api.patch(`/admin-appointments/${id}/status`, { status, reason }),
  assignDoctor: (id: string, doctorId: string) => 
    api.patch(`/admin-appointments/${id}/assign-doctor`, { doctorId }),
  getTimeSlots: (date: string, department?: string) => 
    api.get('/admin-appointments/slots', { params: { date, department } }),
  lookupPatient: (mobile: string) => 
    api.get(`/admin-appointments/lookup/${mobile}`),
  doctorComplete: (id: string) => api.patch(`/admin-appointments/${id}/doctor-complete`),
  doctorRemove: (id: string, reason: string) => 
    api.patch(`/admin-appointments/${id}/doctor-remove`, { reason }),
  getStats: () => api.get('/admin-appointments/stats'),
};

export const patientsAPI = {
  getAll: (params?: any) => api.get('/patients', { params }),
  getById: (id: string) => api.get(`/patients/${id}`),
  getMe: () => api.get('/patients/me'),
  updateMe: (data: any) => api.put('/patients/me', data),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.patch(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
  download: (params?: any) => api.get('/patients/public-appointments/download', { params }),
  getPublicList: (params: any) => api.get('/patients/public-appointments/list', { params }),
};

export const departmentsAPI = {
  getAll: (params?: any) => api.get('/departments', { params }),
  getAdminAll: () => api.get('/departments/admin/all'),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (formData: FormData) => api.post('/departments', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  update: (id: string, formData: FormData) => api.put(`/departments/${id}`, formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  toggleStatus: (id: string) => api.patch(`/departments/${id}/toggle-status`),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id: string) => api.get(`/doctors/${id}`),
  createProfile: (data: any) => api.post('/doctors', data),
  updateProfile: (id: string, data: any) => api.put(`/doctors/${id}`, data),
};

export const billingAPI = {
  getAppointmentsOverview: (params: any) => api.get('/bills/appointments-billing', { params }),
  getDoctorFee: (appointmentId: string) => api.get(`/bills/doctor-fee/${appointmentId}`),
  generateInvoice: (appointmentId: string, data: any) => api.post(`/bills/generate/${appointmentId}`, data),
  getById: (id: string) => api.get(`/bills/${id}`),
  update: (id: string, data: any) => api.put(`/bills/${id}`, data),
  getInsights: (params: any) => api.get('/bills/insights', { params }),
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

// Aliases for backward compatibility
export const appointmentAPI = appointmentsAPI;
export const departmentAPI = departmentsAPI;
export const doctorAPI = doctorsAPI;
export const patientAPI = patientsAPI;

export default api;
