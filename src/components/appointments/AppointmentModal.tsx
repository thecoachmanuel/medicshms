'use client';

import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, Calendar, Clock, Stethoscope, 
  CheckCircle2, AlertCircle, Printer, Save, Loader2, UserPlus, XCircle,
  Eye, Edit2, Building2, FileText, Plus, Pill
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { appointmentAPI, pharmacyAPI, labAPI, radiologyAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CreateLabRequestModal from '@/components/clinical/CreateLabRequestModal';
import CreateRadiologyRequestModal from '@/components/clinical/CreateRadiologyRequestModal';
import MedicationSearch from '@/components/clinical/MedicationSearch';
import PatientTimeline from '@/components/clinical/PatientTimeline';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import NairaSign from '@/components/common/NairaSign';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  appointment: any;
  type: 'view' | 'edit' | 'assign';
  doctors: any[];
  departments: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function AppointmentModal({ appointment, type, doctors, departments, onClose, onRefresh }: Props) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(appointment?.doctorAssigned?._id || appointment?.doctorAssigned?.id || '');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completePrescription, setCompletePrescription] = useState('');
  const [labRequest, setLabRequest] = useState('');
  const [radiologyRequest, setRadiologyRequest] = useState('');
  const [showLabModal, setShowLabModal] = useState(false);
  const [showRadiologyModal, setShowRadiologyModal] = useState(false);
  const [editData, setEditData] = useState({
    fullName: appointment?.fullName || appointment?.patientName || '',
    mobileNumber: appointment?.mobileNumber || '',
    emailAddress: appointment?.emailAddress || '',
    appointmentDate: appointment?.appointmentDate ? 
      (typeof appointment.appointmentDate === 'string' ? appointment.appointmentDate.split('T')[0] : '') : '',
    appointmentTime: appointment?.appointmentTime || '',
    appointmentStatus: appointment?.appointmentStatus || appointment?.status || 'Pending',
  });

  // Clinical Order State
  const [prescribedMeds, setPrescribedMeds] = useState<any[]>([]);
  const [pendingLabTests, setPendingLabTests] = useState<any[]>([]);
  const [pendingImaging, setPendingImaging] = useState<any[]>([]);
  const [patientUUID, setPatientUUID] = useState<string | null>(null);

  // Resolve UUID for Timeline and Requests
  React.useEffect(() => {
    const pId = appointment.patient_id || appointment.patientId;
    if (!pId) return;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pId);
    if (isUUID) {
      setPatientUUID(pId);
    } else {
      patientsAPI.getById(pId).then(res => {
        if (res.data?._id) setPatientUUID(res.data._id);
      }).catch(err => console.error('UUID Resolve Error:', err));
    }
  }, [appointment]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (type === 'assign') {
        await appointmentAPI.assignDoctor(appointment._id, selectedDoctor);
        toast.success('Doctor assigned successfully');
      } else {
        await appointmentAPI.update(appointment._id, editData);
        toast.success('Appointment updated successfully');
      }
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error('Failed to update appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      let pId = patientUUID || appointment.patient_id || appointment.patientId;
      if (!pId) throw new Error('Patient Identity Lost');

      // 0. Resolve Patient UUID if needed (Diagnostic APIs require UUID)
      // If patientUUID wasn't resolved by the useEffect yet, do it now.
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pId);
      if (!isUUID) {
        try {
          const pRes = await patientsAPI.getById(pId);
          if (pRes.data?._id) {
            pId = pRes.data._id;
          }
        } catch (resError) {
          console.error('Failed to resolve patient UUID:', resError);
        }
      }

      // 1. Finalize Appointment Status & Notes
      const completionData = {
        doctor_notes: completeNotes,
        prescription: completePrescription // Fallback/Alternative notes
      };
      await appointmentAPI.doctorComplete(appointment._id || appointment.id, completionData);

      // 2. Authorize Structured Medications
      if (prescribedMeds.length > 0) {
        await pharmacyAPI.createPrescription({
          patient_id: pId,
          appointment_id: appointment._id || appointment.id,
          medications: prescribedMeds,
          notes: completePrescription
        });
      }

      // 3. Authorize Lab Investigations
      if (pendingLabTests.length > 0) {
        await labAPI.createRequest({
          patient_id: pId,
          clinical_notes: completeNotes,
          requested_by_name: user?.name,
          tests: pendingLabTests.map(t => ({
            test_name: t.test_name || t.name,
            test_price: t.test_price || t.price || 0,
            unit_id: t.unit_id
          }))
        });
      }

      // 4. Authorize Radiology Scans (Sequential or Batch)
      if (pendingImaging.length > 0) {
        await Promise.all(pendingImaging.map(img => 
           radiologyAPI.createRequest({
             patient_id: pId,
             test_name: img.name,
             clinical_notes: completeNotes,
             requested_by_name: user?.name
           })
        ));
      }

      toast.success('Clinical Session Authorized & Finalized');
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to authorize clinical set');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = {
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Confirmed': 'bg-primary-50 text-primary-700 border-blue-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              type === 'view' ? "bg-white" : type === 'edit' ? "bg-primary-50" : "bg-emerald-50"
            )}>
              {type === 'view' ? <Eye className="w-5 h-5 text-gray-500" /> : type === 'edit' ? <Edit2 className="w-5 h-5 text-primary-600" /> : <UserPlus className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {type === 'view' ? (showCompleteForm ? 'Complete Consultation' : 'Appointment Ticket') : type === 'edit' ? 'Reschedule Appointment' : 'Assign Specialist'}
              </h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{appointment.appointmentId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          {type === 'view' ? (
            showCompleteForm ? (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-emerald-900 font-bold text-sm">Finishing Appointment</h3>
                    <p className="text-emerald-700 text-xs leading-relaxed mt-1">
                      Please enter the final consultation notes and any medications prescribed for this patient.
                    </p>
                  </div>
                </div>

                {/* Patient Clinical History Context */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                   <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <FileText className="w-4 h-4 text-primary-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Patient EMR Context</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">Holistic Insight</span>
                   </div>
                   <div className="max-h-[300px] overflow-y-auto p-4 bg-white/50">
                       <PatientTimeline patientId={patientUUID || appointment.patient_id || appointment.patientId} />
                   </div>
                </div>

                <div className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Structured Medication Regimen</label>
                      <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Inventory Linked</span>
                    </div>
                    <div className="space-y-3">
                       <MedicationSearch 
                          onSelect={(med) => {
                            const newMed = {
                              item_id: med.id,
                              item_name: med.item_name,
                              dosage: '1 Tab',
                              frequency: 'Daily',
                              duration: '5 Days'
                            };
                            setPrescribedMeds([...prescribedMeds, newMed]);
                          }}
                          placeholder="Search Pharmacy Goods..."
                       />
                       
                       {prescribedMeds.length > 0 && (
                         <div className="space-y-2">
                            {prescribedMeds.map((med, idx) => (
                              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl animate-in slide-in-from-top-2">
                                <div className="flex-1 flex items-center gap-3">
                                   <Pill className="w-5 h-5 text-primary-500 shrink-0" />
                                   <p className="text-sm font-bold text-gray-900">{med.item_name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input 
                                    className="w-16 h-8 bg-transparent border-b border-gray-200 text-xs font-bold text-center outline-none focus:border-primary-500 transition-colors"
                                    value={med.dosage}
                                    placeholder="Dosage"
                                    onChange={e => {
                                      const newMeds = [...prescribedMeds];
                                      newMeds[idx].dosage = e.target.value;
                                      setPrescribedMeds(newMeds);
                                    }}
                                  />
                                  <select 
                                    className="h-8 bg-transparent border-b border-gray-200 text-xs font-bold outline-none focus:border-primary-500 transition-colors"
                                    value={med.frequency}
                                    onChange={e => {
                                      const newMeds = [...prescribedMeds];
                                      newMeds[idx].frequency = e.target.value;
                                      setPrescribedMeds(newMeds);
                                    }}
                                  >
                                    <option>Daily</option>
                                    <option>BD (2x)</option>
                                    <option>TDS (3x)</option>
                                    <option>QDS (4x)</option>
                                    <option>Weekly</option>
                                    <option>Stat</option>
                                    <option>PRN</option>
                                  </select>
                                  <input 
                                    className="w-16 h-8 bg-transparent border-b border-gray-200 text-xs font-bold text-center outline-none focus:border-primary-500 transition-colors"
                                    value={med.duration}
                                    placeholder="Duration"
                                    onChange={e => {
                                      const newMeds = [...prescribedMeds];
                                      newMeds[idx].duration = e.target.value;
                                      setPrescribedMeds(newMeds);
                                    }}
                                  />
                                  <button 
                                    onClick={() => setPrescribedMeds(prescribedMeds.filter((_, i) => i !== idx))}
                                    className="p-1 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-500 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pathology & Investigations</label>
                    <div className="space-y-4">
                       <button 
                         type="button"
                         onClick={() => setShowLabModal(true)}
                         className="w-full h-[54px] bg-white border border-gray-100 rounded-2xl flex items-center justify-between px-6 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                       >
                         <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600 italic">Request Laboratory Analysis...</span>
                         <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                       </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Doctor's Consultation Narrative</label>
                    <textarea 
                      className="input w-full min-h-[120px] py-3 text-sm" 
                      placeholder="Enter clinical findings, observations, and recommendations..."
                      value={completeNotes}
                      onChange={e => setCompleteNotes(e.target.value)}
                    />
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                        <span>Alternative / Free-text Prescription</span>
                        <span className="text-[9px] lowercase italic text-gray-300 tracking-normal opacity-50 font-medium">Shown if no structured drugs added</span>
                     </label>
                    <textarea 
                      className="input w-full min-h-[80px] py-3 text-sm italic" 
                      placeholder="dosage, frequency, and additional pharmacist notes..."
                      value={completePrescription}
                      onChange={e => setCompletePrescription(e.target.value)}
                    />
                  </div>

                  {/* Summary Footer */}
                  <div className="p-4 bg-gray-900 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-indigo-900/10">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                           <NairaSign className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Estimated Invoice Content</p>
                           <p className="text-sm font-black tracking-tight leading-none">Consultation + {prescribedMeds.length} Orders</p>
                        </div>
                     </div>
                     <CheckCircle2 className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-6 bg-primary-900 rounded-2xl text-white shadow-lg overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="text-primary-200 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Current Status</p>
                    <h3 className="text-2xl font-bold">{appointment.appointmentStatus}</h3>
                  </div>
                  <div className="relative z-10 text-right">
                    <p className="text-primary-200 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Queue Number</p>
                    <p className="text-3xl font-black">#{(appointment.queueNumber || 'N/A')}</p>
                  </div>
                  <Stethoscope className="absolute -right-4 -bottom-4 w-32 h-32 text-primary-800/40 rotate-12" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
                      <User className="w-3 h-3" /> Patient Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{appointment.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {appointment.gender}{appointment.age ? `, ${appointment.age} Years` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {appointment.emailAddress}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {appointment.mobileNumber}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
                      <Calendar className="w-3 h-3" /> Schedule Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span className="font-bold text-gray-900">
                          {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'} at {appointment.appointmentTime || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {appointment.department}
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Specialist</p>
                          <p className="text-xs font-bold text-gray-900">Dr. {appointment.doctorAssigned?.user?.name || appointment.doctorAssigned?.name || 'Not Assigned'}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {(appointment.appointmentStatus === 'Completed' && (appointment.doctor_notes || appointment.prescription)) ? (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                       <section className="space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">
                          <FileText className="w-3 h-3" /> Consultation Summary
                        </h4>
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {appointment.doctor_notes || 'No notes provided.'}
                          </p>
                        </div>
                      </section>
                      <section className="space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest border-b border-primary-100 pb-2">
                          <Stethoscope className="w-3 h-3" /> Prescription
                        </h4>
                        <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100/50">
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap italic font-medium">
                            {appointment.prescription || 'No medicines prescribed.'}
                          </p>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <section className="md:col-span-2 space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
                        <AlertCircle className="w-3 h-3" /> Medical Notes
                      </h4>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          <span className="font-bold text-gray-900">Chief Complaint:</span> {appointment.primaryConcern || 'Routine checkup'}
                        </p>
                        {(appointment.knownAllergies === 'Yes' || appointment.known_allergies === true) && (
                          <p className="mt-2 text-sm text-rose-600 font-medium flex items-center gap-1.5">
                            <span className="p-1 bg-rose-100 rounded-md">⚠️</span> High Allergy Alert: {appointment.allergiesDetails || appointment.allergies_details}
                          </p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
              {type === 'assign' ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">Select Specialist for {appointment.department}</label>
                  <div className="grid grid-cols-1 gap-3">
                    {doctors.filter(d => (d.department?.name === appointment.department) || (d.department === appointment.department)).map(doc => (
                      <button
                        key={doc._id || doc.id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc._id || doc.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                          (selectedDoctor === doc._id || selectedDoctor === doc.id) ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                           {(doc.profilePhoto || doc.user?.profilePhoto) ? (
                            <img src={doc.profilePhoto || doc.user?.profilePhoto} className="w-full h-full object-cover" />
                          ) : (
                            <Stethoscope className="w-6 h-6 text-primary-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Dr. {doc.user?.name || doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.qualifications || 'Expert Specialist'}</p>
                        </div>
                        {(selectedDoctor === doc._id || selectedDoctor === doc.id) && <CheckCircle2 className="w-5 h-5 text-primary-500 ml-auto" />}
                      </button>
                    ))}
                    {doctors.filter(d => (d.department?.name === appointment.department) || (d.department === appointment.department)).length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No doctors found in {appointment.department}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Patient Name</label>
                    <input type="text" className="input w-full" value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Reschedule Date</label>
                    <input type="date" className="input w-full" value={editData.appointmentDate} onChange={e => setEditData({...editData, appointmentDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Slot Time</label>
                    <input type="text" className="input w-full" value={editData.appointmentTime} onChange={e => setEditData({...editData, appointmentTime: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Update Status</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.keys(statusColors).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditData({...editData, appointmentStatus: s})}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                            editData.appointmentStatus === s 
                              ? "bg-primary-900 text-white border-primary-900 shadow-lg" 
                              : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          {type === 'view' ? (
            <>
              <div className="flex items-center gap-2">
                  {!showCompleteForm && (
<button 
  onClick={() => window.print()}
  className="btn-secondary"
>
  <Printer className="w-4 h-4" />
  Print Ticket
</button>
)}
                {appointment.appointmentStatus === 'Confirmed' && (user?.role === 'Admin' || (user?.role === 'Doctor' && (appointment.doctorAssigned?._id === user?.doctorProfileId || appointment.doctorAssigned?.id === user?.doctorProfileId || appointment.doctor_assigned_id === user?.doctorProfileId))) && (
                  showCompleteForm ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowCompleteForm(false)} className="btn-secondary">Cancel</button>
                      <button 
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-xl shadow-emerald-500/20"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Finalize & Close
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowCompleteForm(true)}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete consultation
                    </button>
                  )
                )}
              </div>
              {!showCompleteForm && <button onClick={onClose} className="btn-primary min-w-[120px]">Done</button>}
            </>
          ) : (
            <>
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button 
                disabled={isSubmitting || (type === 'assign' && !selectedDoctor)} 
                onClick={handleUpdate}
                className="btn-primary min-w-[140px]"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {type === 'assign' ? 'Confirm Assignment' : 'Save Changes'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      {/* Clinical Sub-Modules */}
      <CreateLabRequestModal 
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        initialPatientId={patientUUID || appointment.patient_id || appointment.patientId}
      />
      <CreateRadiologyRequestModal 
        isOpen={showRadiologyModal}
        onClose={() => setShowRadiologyModal(false)}
        initialPatientId={patientUUID || appointment.patient_id || appointment.patientId}
      />
    </div>
  );
}
