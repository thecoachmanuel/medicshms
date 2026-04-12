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
  const [modalType, setModalType] = useState<'view' | 'edit' | 'assign' | 'complete'>('view');
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
      } else if (status === 'Arrived') {
        await appointmentAPI.updateStatus(id, status);
        toast.success('Patient checked in & queued for triage');
      } else if (status === 'Completed' && isDoctor) {
        await appointmentAPI.doctorComplete(id);
      } else {
        await appointmentAPI.updateStatus(id, status);
      }
      toast.success(`Appointment status synchronized`);
      fetchAppointments();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(`Uplink failed: ${msg}`);
    }
  };

  const openModal = (apt: any, type: 'view' | 'edit' | 'assign' | 'complete') => {
    setSelectedAppointment(apt);
    setModalType(type);
    setShowModal(true);
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      'Pending': 'bg-amber-50 text-amber-600 border-amber-100/50 shadow-sm shadow-amber-100/20',
      'Confirmed': 'bg-indigo-50 text-indigo-600 border-indigo-100/50 shadow-sm shadow-indigo-100/20',
      'Arrived': 'bg-sky-50 text-sky-600 border-sky-100/50 shadow-sm shadow-sky-100/20 animate-pulse',
      'Triaged': 'bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-sm shadow-emerald-100/20',
      'Completed': 'bg-emerald-100 text-emerald-900 border-emerald-200/50 shadow-sm shadow-emerald-200/20',
      'Cancelled': 'bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm shadow-rose-100/20',
    };
    return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100 shadow-sm';
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
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/30 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {isDoctor ? 'My Consultations' : 'Appointment Queue'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isDoctor ? 'Review and manage your patient appointments.' : 'Manage all hospital appointments and schedules.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => fetchAppointments()} className="p-3 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all" title="Refresh Feed">
            <RefreshCw className={cn("w-4 h-4 text-gray-400 font-bold", loading && "animate-spin")} />
          </button>
          {!isDoctor && (
            <button onClick={handleDownloadCSV} className="btn-secondary px-6">
              <Download className="w-4 h-4" />
              Export Records
            </button>
          )}
          {isAdminOrReceptionist && (
            <button onClick={() => setShowBookModal(true)} className="btn-primary px-6">
              <Plus className="w-4 h-4" />
              Book Encounter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by ID, Patient Name or Mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none w-full shadow-sm transition-all shadow-indigo-100/10"
          />
        </div>
        <div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm cursor-pointer transition-all appearance-none"
          >
            <option value="all">Every Status</option>
            <option value="Pending">Pending Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="relative group">
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all appearance-none uppercase font-bold tracking-widest text-[10px]"
          />
          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none group-focus-within:text-primary-500" />
        </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="table-container">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="bg-gray-50/20 border-b border-gray-100">
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Ref ID</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Time-Slot</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Unit</th>
                {isAdminOrReceptionist && <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Physician</th>}
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={isAdminOrReceptionist ? 7 : 6} className="px-6 py-8">
                       <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2"></div>
                       <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrReceptionist ? 7 : 6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                        <Calendar className="w-10 h-10 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Empty Workspace</p>
                    </div>
                  </td>
                </tr>
              ) : appointments.map((apt) => (
                <tr key={apt._id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                  <td className="px-6 py-4">
                    <span className="font-black text-gray-900 text-sm">#{apt.appointmentId}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/50 shadow-sm shadow-indigo-100/20 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{apt.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">
                          {apt.mobileNumber} {apt.age ? `• ${apt.age}y` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-black text-gray-700 tracking-tight">{formatDate(apt.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-400">{apt.appointmentTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/30 uppercase tracking-widest">{apt.department}</span>
                  </td>
                  {isAdminOrReceptionist && (
                    <td className="px-6 py-5">
                      {apt.doctorAssigned ? (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                            <Stethoscope className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-xs font-black text-gray-700">Dr. {apt.doctorAssigned?.user?.name || apt.doctorAssigned?.name}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openModal(apt, 'assign')}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 hover:gap-2 transition-all"
                        >
                          Assign Physician <ArrowUpRight className="w-3 h-3" />
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
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {apt.appointmentStatus === 'Pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt._id, 'Confirmed')}
                          className="p-2.5 bg-indigo-50 rounded-xl shadow-sm text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100/50"
                          title="Verify Appointment"
                        >
                          <Check className="w-4.5 h-4.5" />
                        </button>
                      )}
                      {role === 'Receptionist' && apt.appointmentStatus === 'Confirmed' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt._id, 'Arrived')}
                          className="p-2.5 bg-sky-50 rounded-xl shadow-sm text-sky-600 hover:bg-sky-600 hover:text-white transition-all border border-sky-100/50 group/checkin"
                          title="Patient Check-In"
                        >
                          <Clock className="w-4.5 h-4.5 group-hover:animate-spin" />
                        </button>
                      )}
                      <button 
                        onClick={() => openModal(apt, 'view')}
                        className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                      {isAdminOrReceptionist && (
                        <button 
                          onClick={() => openModal(apt, 'edit')}
                          className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-amber-600 hover:border-amber-100 transition-all"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                      {isAdminOrReceptionist && apt.appointmentStatus !== 'Cancelled' && apt.appointmentStatus !== 'Completed' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt._id, 'Cancelled')}
                          className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-rose-600 hover:border-rose-100 transition-all"
                        >
                          <XCircle className="w-4.5 h-4.5" />
                        </button>
                      )}
                      {(isDoctor || role === 'Admin') && ['Confirmed', 'Arrived', 'Triaged'].includes(apt.appointmentStatus) && (
                        <button 
                          onClick={() => openModal(apt, 'complete')}
                          className={cn(
                            "p-2.5 rounded-xl shadow-sm transition-all border",
                            isDoctor 
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-100/50" 
                              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-100/50"
                          )}
                          title="Complete Session"
                        >
                          <CheckCircle className="w-4.5 h-4.5" />
                        </button>
                      )}
                      {isAdminOrReceptionist && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Confirm deletion of this record?')) {
                              try {
                                await appointmentAPI.delete(apt._id);
                                toast.success('Record purged');
                                fetchAppointments();
                              } catch (err) {
                                toast.error('Purge failed');
                              }
                            }
                          }}
                          className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-rose-600 hover:border-rose-100 transition-all"
                          title="Purge Record"
                        >
                          <UserMinus className="w-4.5 h-4.5" />
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
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/20 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Showing Cycle {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
              >
                Prev
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
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
