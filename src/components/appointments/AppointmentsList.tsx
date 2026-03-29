'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Search, Edit2, Eye, UserPlus, Check, X, Clock, 
  RefreshCw, XCircle, CheckCircle, UserMinus, Printer, 
  Download, Filter, ChevronDown, Loader2, Plus, MoreHorizontal,
  Mail, Phone, Building2, Stethoscope, ArrowUpRight, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { appointmentAPI, departmentAPI, doctorAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import BookAppointmentModal from './BookAppointmentModal';
import AppointmentModal from './AppointmentModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  role: 'Admin' | 'Doctor' | 'Receptionist';
}

export default function AppointmentsList({ role }: Props) {
  const { user } = useAuth();
  const isDoctor = role === 'Doctor';
  const isAdminOrReceptionist = role === 'Admin' || role === 'Receptionist';

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'assign'>('view');
  const [showModal, setShowModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        status: filter !== 'all' ? filter : undefined,
        search: debouncedSearch || undefined,
        date: dateFilter || undefined
      };
      const res = (isDoctor 
        ? await appointmentAPI.getMyAppointments(params)
        : await appointmentAPI.getAll(params)) as any;
      
      setAppointments(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      console.error('Fetch appointments error:', err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, debouncedSearch, dateFilter, isDoctor]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (isAdminOrReceptionist) {
      doctorAPI.getAll().then(r => setDoctors((r as any).data || [])).catch(console.error);
      departmentAPI.getAll().then(r => setDepartments((r as any).data || [])).catch(console.error);
    }
  }, [isAdminOrReceptionist]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      if (status === 'Cancelled') {
        const reason = prompt('Reason for cancellation?');
        if (!reason) return;
        await appointmentAPI.updateStatus(id, status, reason);
      } else if (status === 'Completed' && isDoctor) {
        await appointmentAPI.doctorComplete(id);
      } else {
        await appointmentAPI.updateStatus(id, status);
      }
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update appointment');
    }
  };

  const openModal = (apt: any, type: 'view' | 'edit' | 'assign') => {
    setSelectedAppointment(apt);
    setModalType(type);
    setShowModal(true);
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      'Pending': 'bg-amber-100 text-amber-700',
      'Confirmed': 'bg-primary-100 text-primary-700',
      'Completed': 'bg-emerald-100 text-emerald-700',
      'Cancelled': 'bg-rose-100 text-rose-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const handleDownloadCSV = async () => {
    try {
      toast.loading('Preparing download...');
      const params = {
        status: filter !== 'all' ? filter : undefined,
        search: debouncedSearch || undefined,
        date: dateFilter || undefined
      };
      const res = await appointmentAPI.download(params) as any;
      const records = res.data || [];
      
      if (!records.length) {
        toast.dismiss();
        toast.error('No records to download');
        return;
      }

      const headers = ['Appointment ID', 'Patient Name', 'Mobile', 'Date', 'Time', 'Department', 'Doctor', 'Status', 'Visit Type'];
      const csvData = [
        headers.join(','),
        ...records.map((apt: any) => [
          apt.appointmentId,
          `"${apt.fullName}"`,
          apt.mobileNumber,
          apt.appointmentDate,
          apt.appointmentTime,
          apt.department,
          `"${apt.doctorName}"`,
          apt.appointmentStatus,
          apt.visitType
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.dismiss();
      toast.success('Download started');
    } catch (err) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {isDoctor ? 'My Consultations' : 'Appointment Queue'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isDoctor ? 'Review and manage your patient appointments.' : 'Manage all hospital appointments and schedules.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchAppointments()} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw className={cn("w-4 h-4 text-gray-400", loading && "animate-spin")} />
          </button>
          {!isDoctor && (
            <button onClick={handleDownloadCSV} className="btn-secondary">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
          {isAdminOrReceptionist && (
            <button onClick={() => setShowBookModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Book New
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID, Patient Name or Mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-full shadow-sm"
          />
        </div>
        <div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Appointment ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
                {isAdminOrReceptionist && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctor</th>}
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={isAdminOrReceptionist ? 7 : 6} className="px-6 py-6 h-20 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrReceptionist ? 7 : 6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-medium">No appointments found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : appointments.map((apt) => (
                <tr key={apt._id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-black text-gray-900 text-sm">#{apt.appointmentId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{apt.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {apt.mobileNumber} {apt.age ? `• ${apt.age}y` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-xs font-bold text-gray-700">{formatDate(apt.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400">{apt.appointmentTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{apt.department}</span>
                  </td>
                  {isAdminOrReceptionist && (
                    <td className="px-6 py-4">
                      {apt.doctorAssigned ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-700">Dr. {apt.doctorAssigned?.user?.name || apt.doctorAssigned?.name}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openModal(apt, 'assign')}
                          className="text-[10px] font-black uppercase text-primary-600 hover:text-primary-700 underline underline-offset-4"
                        >
                          Assign Doc
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      getStatusStyle(apt.appointmentStatus)
                    )}>
                      {apt.appointmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {apt.appointmentStatus === 'Pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt._id, 'Confirmed')}
                          className="p-2 bg-primary-50 rounded-lg shadow-sm text-primary-600 hover:bg-primary-100 transition-all border border-primary-100"
                          title="Approve Appointment"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => openModal(apt, 'view')}
                        className="p-2 hover:bg-white rounded-lg shadow-sm text-gray-400 hover:text-primary-600 transition-all border border-transparent hover:border-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdminOrReceptionist && (
                        <button 
                          onClick={() => openModal(apt, 'edit')}
                          className="p-2 hover:bg-white rounded-lg shadow-sm text-gray-400 hover:text-amber-600 transition-all border border-transparent hover:border-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdminOrReceptionist && apt.appointmentStatus !== 'Cancelled' && apt.appointmentStatus !== 'Completed' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt._id, 'Cancelled')}
                          className="p-2 hover:bg-white rounded-lg shadow-sm text-gray-400 hover:text-rose-600 transition-all border border-transparent hover:border-gray-100"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(isDoctor || role === 'Admin') && apt.appointmentStatus === 'Confirmed' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt._id, 'Completed')}
                          className={cn(
                            "p-2 rounded-lg shadow-sm transition-all border",
                            isDoctor 
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100" 
                              : "bg-primary-50 text-primary-600 hover:bg-primary-100 border-primary-100"
                          )}
                          title="Complete Appointment"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {isAdminOrReceptionist && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this appointment?')) {
                              try {
                                await appointmentAPI.delete(apt._id);
                                toast.success('Appointment deleted');
                                fetchAppointments();
                              } catch (err) {
                                toast.error('Failed to delete appointment');
                              }
                            }
                          }}
                          className="p-2 hover:bg-white rounded-lg shadow-sm text-gray-400 hover:text-rose-600 transition-all border border-transparent hover:border-gray-100"
                          title="Delete Appointment"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                Previous
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showBookModal && (
        <BookAppointmentModal 
          onClose={() => setShowBookModal(false)} 
          onSuccess={fetchAppointments} 
        />
      )}

      {showModal && (
        <AppointmentModal 
          appointment={selectedAppointment}
          type={modalType}
          doctors={doctors}
          departments={departments}
          onClose={() => setShowModal(false)}
          onRefresh={fetchAppointments}
        />
      )}
    </div>
  );
}
