'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, User, Mail, Phone, FileText, Download, Filter, 
  RefreshCw, ChevronLeft, ChevronRight, X, Loader2, RotateCcw,
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Stethoscope, 
  History, Activity 
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { patientsAPI } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import RegisterPatientModal from './RegisterPatientModal';
import EditPatientModal from './EditPatientModal';
import CreateLabRequestModal from '@/components/clinical/CreateLabRequestModal';
import { Edit2, Trash2, Microscope } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  role: 'Admin' | 'Doctor' | 'Receptionist' | 'Lab Scientist' | 'Radiologist' | 'Pharmacist' | 'Nurse';
}

export default function PatientsList({ role }: Props) {
  const params = useParams();
  const slug = params?.slug as string;
  const portalRole = role.toLowerCase();
  const isDoctor = role === 'Doctor';
  const canOnboardPatients = role === 'Admin' || role === 'Receptionist' || role === 'Lab Scientist';
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
  const [showLabModal, setShowLabModal] = useState(false);
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
      const res = await patientsAPI.getById(patient.patient_id || patient.patientId || patient._id);
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

      const headers = ['Patient ID', 'Full Name', 'Mobile', 'Email', 'Gender', 'Age', 'Blood Group', 'Emergency Contact', 'Emergency Phone', 'Total Appointments'];
      const csvData = [
        headers.join(','),
        ...records.map((p: any) => [
          p.patientId,
          `"${p.fullName}"`,
          p.mobileNumber,
          p.emailAddress,
          p.gender,
          p.age,
          p.bloodGroup || 'N/A',
          `"${p.emergencyContactName || 'N/A'}"`,
          p.emergencyContactNumber || 'N/A',
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
  
  const handleResetPassword = async (patient: any) => {
    if (!window.confirm(`Reset password for ${patient.fullName || 'this patient'} to hms@patient?`)) return;
    try {
      toast.loading('Resetting credentials...');
      await patientsAPI.resetPassword(patient.patientId || patient._id);
      toast.dismiss();
      toast.success('Password reset to: hms@patient');
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password');
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
    <div className="relative min-h-[calc(100vh-10rem)] space-y-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-white -z-10" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Patient Registry</h1>
          <p className="text-gray-500 text-sm mt-1">Holistic view of all patient medical records and histories.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => fetchPatients()} className="p-3 bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all" title="Synchronize Records">
            <RefreshCw className={cn("w-4 h-4 text-gray-400 font-bold", loading && "animate-spin")} />
          </button>
          {canOnboardPatients && (
            <button onClick={() => setShowRegisterModal(true)} className="btn-primary px-6">
              <User className="w-4 h-4" />
              Onboard Patient
            </button>
          )}
          {(role === 'Admin' || role === 'Receptionist' || role === 'Lab Scientist') && (
            <button onClick={handleDownloadCSV} className="btn-secondary px-6">
              <Download className="w-4 h-4" />
              Export Archive
            </button>
          )}
        </div>
      </div>

      <div className="relative group max-w-3xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by Name, Email, Phone or Patient ID..." 
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border border-white/80 rounded-[1.25rem] text-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">{totalResults} Active Files</span>
        </div>
      </div>

      <div className="card bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="table-container">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="bg-gray-50/20 border-b border-gray-100">
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Record UID</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient Profile</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Primary Contact</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Demographics</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Medical History</th>
                {canOnboardPatients && (
                  <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                       <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-2"></div>
                       <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                        <User className="w-10 h-10 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Zero Files Found</p>
                    </div>
                  </td>
                </tr>
              ) : patients.map((patient) => (
                <tr key={patient._id} className="group hover:bg-blue-50/30 transition-all duration-300">
                  <td className="px-6 py-5">
                    <span className="font-black text-gray-900 text-sm">#{patient.patientId || patient._id.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[1rem] bg-blue-50 border border-blue-100/50 flex items-center justify-center shadow-sm shadow-blue-100/20 group-hover:bg-white group-hover:scale-110 transition-all duration-300 font-black text-blue-600 text-xs">
                        {patient.fullName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-none mb-1.5">{patient.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">Active Protocol</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5 font-bold">
                      <div className="flex items-center gap-2.5 text-xs text-gray-700">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        {patient.mobileNumber}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
                        <Mail className="w-3.5 h-3.5 text-gray-300" />
                        {patient.emailAddress}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="bg-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200/50">{patient.gender}</div>
                      {patient.age && <span className="text-xs font-black text-gray-700 tracking-tight">{patient.age} YRS</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-2">
                         {isDoctor && (
                           <button 
                             onClick={() => { setSelectedPatient(patient); setShowLabModal(true); }}
                             className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 w-full justify-center"
                           >
                             <Stethoscope className="w-3.5 h-3.5" />
                             Request Lab
                           </button>
                         )}
                         <Link 
                          href={`/${slug}/${portalRole}/patients/${patient._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95 w-full justify-center"
                        >
                          <History className="w-3.5 h-3.5" />
                          360 History
                        </Link>
                        <button 
                          onClick={() => handleViewAppointments(patient)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all w-full justify-center"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Encounters
                        </button>
                      </div>
                  </td>
                  {canOnboardPatients && (
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
                          <>
                            <button 
                              onClick={() => handleResetPassword(patient)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Reset Password"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeletePatient(patient)}
                              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Patient"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/20 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Showing Lifecycle {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xs shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-xs shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAppointmentsModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAppointmentsModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm shadow-blue-100/20">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Clinical Archive</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{selectedPatient.fullName}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.1em]">Patient #{selectedPatient.patientId}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAppointmentsModal(false)} className="p-3 hover:bg-gray-100 rounded-[1rem] transition-all group">
                <X className="w-5 h-5 text-gray-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-10">
              {appointmentsLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Health Intelligence...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                  <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No Documented Encounters</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {appointments.map((apt, idx) => (
                    <div key={apt._id} className="relative pl-10 border-l-2 border-blue-100/50 pb-10 last:pb-0">
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-blue-500 shadow-sm shadow-blue-200"></div>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] group hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                              {new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                              REF: #{apt.appointmentId}
                            </span>
                          </div>
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border self-start md:self-center shadow-sm",
                            apt.appointmentStatus === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/20" :
                            apt.appointmentStatus === 'Cancelled' ? "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/20" : "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/20"
                          )}>
                            {apt.appointmentStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                              <Stethoscope className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 leading-tight">Dr. {apt.doctorName || 'Senior Consultant'}</p>
                              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">{apt.department}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-sm font-black text-gray-900 tracking-tight">{apt.appointmentTime}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{apt.visitType}</p>
                          </div>
                        </div>
                        
                        {(apt.appointmentStatus === 'Completed' || apt.doctor_notes || apt.prescription) && (
                          <div className="mt-6 pt-6 border-t border-gray-100/80 space-y-4">
                            {(apt.doctor_notes || apt.reasonForVisit) && (
                              <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/50">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Consultation Logic</p>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                  {apt.doctor_notes || apt.reasonForVisit}
                                </p>
                              </div>
                            )}
                            {apt.prescription && (
                              <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50">
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Therapeutic Directives</p>
                                <p className="text-xs text-indigo-900/70 font-bold italic">
                                  {apt.prescription}
                                </p>
                              </div>
                            )}
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
      {showLabModal && selectedPatient && (
        <CreateLabRequestModal 
          isOpen={showLabModal}
          onClose={() => setShowLabModal(false)}
          initialPatientId={selectedPatient.patientId || selectedPatient._id}
        />
      )}
    </div>
  );
}
