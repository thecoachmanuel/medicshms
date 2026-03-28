'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, User, Mail, Phone, FileText, Download, Filter, 
  RefreshCw, ChevronLeft, ChevronRight, X, Loader2, 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { patientsAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import RegisterPatientModal from './RegisterPatientModal';
import EditPatientModal from './EditPatientModal';
import { Edit2, Trash2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  role: 'Admin' | 'Doctor' | 'Receptionist';
}

export default function PatientsList({ role }: Props) {
  const isDoctor = role === 'Doctor';
  const isAdminOrReceptionist = role === 'Admin' || role === 'Receptionist';
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientsAPI.getAll({
        search: searchTerm || undefined,
        page: currentPage,
        limit: 10
      }) as any;
      setPatients(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
      setTotalResults(res.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch patients error:', err);
      toast.error('Failed to load patient records');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleViewAppointments = async (patient: any) => {
    setSelectedPatient(patient);
    setShowAppointmentsModal(true);
    setAppointmentsLoading(true);
    try {
      const res = await patientsAPI.getById(patient.patientId || patient._id);
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      toast.error('Failed to load patient history');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      toast.loading('Preparing download...');
      const res = await patientsAPI.download();
      const records = res.data || [];
      
      if (!records.length) {
        toast.dismiss();
        toast.error('No records to download');
        return;
      }

      const headers = ['Patient ID', 'Full Name', 'Mobile', 'Email', 'Gender', 'Age', 'Total Appointments'];
      const csvData = [
        headers.join(','),
        ...records.map((p: any) => [
          p.patientId,
          `"${p.fullName}"`,
          p.mobileNumber,
          p.emailAddress,
          p.gender,
          p.age,
          p.totalAppointments
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital_patients_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.dismiss();
      toast.success('Download started');
    } catch (err) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };
  
  const handleDeletePatient = async (patient: any) => {
    if (!window.confirm(`Are you sure you want to delete patient ${patient.fullName || patient.fullName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      toast.loading('Deleting patient record...');
      await patientsAPI.delete(patient.patientId || patient._id);
      toast.dismiss();
      toast.success('Patient deleted successfully');
      fetchPatients();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || err.message || 'Failed to delete patient');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Patient Registry</h1>
          <p className="text-gray-500 text-sm mt-1">Holistic view of all patient medical records and histories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchPatients()} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw className={cn("w-4 h-4 text-gray-400", loading && "animate-spin")} />
          </button>
          {isAdminOrReceptionist && (
            <button onClick={() => setShowRegisterModal(true)} className="btn-primary">
              <User className="w-4 h-4" />
              Register Patient
            </button>
          )}
          {!isDoctor && (
            <button onClick={handleDownloadCSV} className="btn-secondary">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by Name, Email, Phone or Patient ID..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{totalResults} Results</span>
        </div>
      </div>

      <div className="card overflow-hidden border-none shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">UID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Demographics</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">History</th>
                {isAdminOrReceptionist && (
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-20 bg-gray-50/20"></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-medium">No patient records found.</p>
                    </div>
                  </td>
                </tr>
              ) : patients.map((patient) => (
                <tr key={patient._id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-5">
                    <span className="font-black text-gray-900 text-sm">#{patient.patientId || patient._id.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                        <span className="text-indigo-600 font-black text-sm">{patient.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">{patient.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Lifetime Record</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {patient.mobileNumber}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Mail className="w-3.5 h-3.5 text-gray-300" />
                        {patient.emailAddress}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 px-3 py-1 rounded-lg text-[10px] font-black text-gray-600 uppercase tracking-wider">{patient.gender}</div>
                      <span className="text-sm font-bold text-gray-700">{patient.age} Yrs</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handleViewAppointments(patient)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-primary-600 shadow-sm hover:shadow-md hover:bg-primary-50 hover:border-primary-100 transition-all active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      History ({patient.totalAppointments || 0})
                    </button>
                  </td>
                  {isAdminOrReceptionist && (
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setPatientToEdit(patient); setShowEditModal(true); }}
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                          title="Edit Patient"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {role === 'Admin' && (
                          <button 
                            onClick={() => handleDeletePatient(patient)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium font-bold uppercase tracking-[0.2em]">Phase {currentPage} / {totalPages}</p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xs"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xs"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {showAppointmentsModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAppointmentsModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Medical History</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedPatient.fullName} • #{selectedPatient.patientId}</p>
                </div>
              </div>
              <button onClick={() => setShowAppointmentsModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8">
              {appointmentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Retrieving archives...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">No previous appointments documented.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt._id} className="relative pl-6 border-l-2 border-primary-100 pb-8 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                      <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 group hover:border-primary-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            {new Date(apt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            apt.appointmentStatus === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                            apt.appointmentStatus === 'Cancelled' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {apt.appointmentStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-tight">Dr. {apt.doctorName || 'General Staff'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{apt.department}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-600 mb-1">{apt.appointmentTime}</p>
                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{apt.visitType}</p>
                          </div>
                        </div>
                        {apt.reasonForVisit && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 italic">" {apt.reasonForVisit} "</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showRegisterModal && (
        <RegisterPatientModal 
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={fetchPatients}
        />
      )}
      {showEditModal && patientToEdit && (
        <EditPatientModal 
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setPatientToEdit(null); }}
          onSuccess={fetchPatients}
          patient={patientToEdit}
        />
      )}
    </div>
  );
}
