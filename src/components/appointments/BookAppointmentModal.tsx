'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Search, User, Heart, Calendar, MapPin, ShieldCheck,
  ArrowLeft, ArrowRight, Phone, Mail, Loader2, CheckCircle,
  Stethoscope, UserPlus, RotateCcw, AlertCircle,
  Sun, CloudSun, Moon, Sunrise
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { appointmentsAPI, departmentsAPI, doctorsAPI } from '@/lib/api';
import { DOBInput } from '@/components/common/DOBInput';
import { calculateAge, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const STEPS_NEW = [
  { key: 'personal', label: 'Patient Info', icon: User },
  { key: 'medical', label: 'Medical Info', icon: Heart },
  { key: 'appointment', label: 'Schedule', icon: Calendar },
  { key: 'verify', label: 'Confirm', icon: ShieldCheck },
];

const STEPS_FOLLOWUP = [
  { key: 'personal', label: 'Patient Info', icon: User },
  { key: 'medical', label: 'Medical Info', icon: Heart },
  { key: 'appointment', label: 'Schedule', icon: Calendar },
  { key: 'verify', label: 'Confirm', icon: ShieldCheck },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookAppointmentModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'select' | 'lookup' | 'form'>('select');
  const [visitType, setVisitType] = useState<'New Patient' | 'Follow-up'>('New Patient');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupName, setLookupName] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [existingPatientId, setExistingPatientId] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [bookingMode, setBookingMode] = useState<'Slot' | 'Range'>('Slot');
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    mobileNumber: '',
    emailAddress: '',
    knownAllergies: 'No',
    allergiesDetails: '',
    reasonForVisit: '',
    primaryConcern: '',
    existingConditions: '',
    department: '',
    doctorAssigned: '',
    appointmentDate: '',
    appointmentTime: '',
    address: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
  });

  const steps = visitType === 'Follow-up' ? STEPS_FOLLOWUP : STEPS_NEW;

  useEffect(() => {
    departmentsAPI.getAll().then(r => setDepartments(r.data || [])).catch(console.error);
    doctorsAPI.getAll().then(r => setDoctors(r.data || [])).catch(console.error);
  }, []);

  const handleSearch = async (term: string) => {
    setLookupName(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setLookupLoading(true);
    try {
      const res = await (await import('@/lib/api')).patientsAPI.getAll({ search: term }) as any;
      setSearchResults(res.data || []);
    } catch (e) {
      console.error('Search failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const selectPatient = (p: any) => {
    setFormData(prev => ({
      ...prev,
      fullName: p.fullName || '',
      gender: p.gender || '',
      emailAddress: p.emailAddress || '',
      mobileNumber: p.mobileNumber || '',
      knownAllergies: p.knownAllergies || 'No',
      allergiesDetails: p.allergiesDetails || '',
      existingConditions: p.existingConditions || '',
      address: p.address || '',
      dateOfBirth: p.dateOfBirth || '',
    }));
    setExistingPatientId(p.patientId || p.id || '');
    setPhase('form');
  };

  const handleLookup = async () => {
    if (!lookupMobile || lookupMobile.length < 10) return toast.error('Enter valid mobile');
    setLookupLoading(true);
    try {
      const res: any = await appointmentsAPI.lookupPatient(lookupMobile);
      const p = res.data;
      selectPatient(p);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No records found');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const selectedDoctor = doctors.find(d => d._id === formData.doctorAssigned);
      const payload = { 
        ...formData, 
        visitType, 
        patientId: existingPatientId,
        age: calculateAge(formData.dateOfBirth),
        doctorName: selectedDoctor ? (selectedDoctor.user?.name || selectedDoctor.name) : undefined
      };
      console.log('Booking Payload:', payload);
      await appointmentsAPI.book(payload);
      toast.success('Appointment booked successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (formData.appointmentDate && formData.department) {
      setSlotsLoading(true);
      const deptId = departments.find(d => d.name === formData.department)?._id;
      appointmentsAPI.getTimeSlots(
        formData.appointmentDate, 
        formData.department, 
        formData.doctorAssigned || undefined,
        deptId,
        user?.hospital_id
      )
        .then((res: any) => {
          const data = res.data || res;
          setTimeSlots(data.timeSlots || []);
          setBookingMode(data.bookingMode || 'Slot');
        })
        .catch(console.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [formData.appointmentDate, formData.department, formData.doctorAssigned, departments, user?.hospital_id]);

  const filteredDoctors = doctors.filter(d => 
    !formData.department || d.department?.name === formData.department
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 shrink-0">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Book Appointment</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0 ml-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 no-scrollbar custom-scrollbar overscroll-behavior-contain">
          {phase === 'select' && (
            <div className="py-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="text-center space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Initiate Appointment</h3>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em]">Protocol Selection</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => { setVisitType('New Patient'); setPhase('form'); }}
                  className="p-8 rounded-[2.5rem] border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left group relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100">
                    <UserPlus className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h4 className="font-black text-xl text-gray-900 mb-2">New Subject</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">Establish a new clinical identity in the lifetime registry.</p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-6 h-6 text-indigo-400" />
                  </div>
                </button>
                <button 
                  onClick={() => { setVisitType('Follow-up'); setPhase('lookup'); }}
                  className="p-8 rounded-[2.5rem] border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-100">
                    <RotateCcw className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-black text-xl text-gray-900 mb-2">Returning Subject</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">Synchronize with an existing medical record for subsequent care.</p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-6 h-6 text-emerald-400" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {phase === 'lookup' && (
            <div className="py-4 space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Identity Discovery</h3>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em]">Record Retrieval</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Identifier</label>
                   <div className="relative group">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                     <input 
                       type="text" autoFocus placeholder="Name, ID, or Phone..."
                       className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-2xl sm:rounded-[1.75rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-gray-900 shadow-sm"
                       value={lookupName}
                       onChange={(e) => handleSearch(e.target.value)}
                     />
                   </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2 no-scrollbar">
                    {searchResults.map(p => (
                      <button 
                        key={p.patientId || p.id}
                        onClick={() => selectPatient(p)}
                        className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group text-left shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-indigo-600 shadow-sm">
                            {p.fullName?.[0]}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 leading-none mb-1.5">{p.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">#{p.patientId} • {p.mobileNumber}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-indigo-100 group-hover:text-indigo-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
                
                <button onClick={() => setPhase('select')} className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-[.25em] hover:text-rose-500 transition-colors">Discard Search</button>
              </div>
            </div>
          )}

          {phase === 'form' && (
            <div className="space-y-8">
              <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                {steps.map((s, i) => (
                  <React.Fragment key={s.key}>
                    <div className={cn(
                      "flex items-center gap-3 shrink-0 transition-all duration-500",
                      i === currentStep ? "opacity-100 scale-105" : i < currentStep ? "opacity-100" : "opacity-40"
                    )}>
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-lg transition-all",
                        i === currentStep ? "border-indigo-600 bg-indigo-50 shadow-indigo-100" : i < currentStep ? "border-emerald-500 bg-emerald-50 shadow-emerald-100" : "border-gray-200 bg-white"
                      )}>
                        {i < currentStep ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" /> : <s.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", i === currentStep ? "text-indigo-600" : "text-gray-400")} />}
                      </div>
                      <div className="hidden sm:block">
                        <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", i === currentStep ? "text-indigo-600" : i < currentStep ? "text-emerald-500" : "text-gray-400")}>Step 0{i+1}</p>
                        <span className={cn("text-[11px] font-black uppercase tracking-wider", i === currentStep ? "text-gray-900" : "text-gray-400")}>{s.label}</span>
                      </div>
                    </div>
                    {i < steps.length - 1 && <div className={cn("h-px w-6 sm:w-12 mx-2 shrink-0 transition-colors duration-500", i < currentStep ? "bg-emerald-200" : "bg-gray-100")}></div>}
                  </React.Fragment>
                ))}
              </div>

              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                {steps[currentStep].key === 'personal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Legal Name</label>
                      <input type="text" className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Biological Sex</label>
                      <select className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <DOBInput
                        label="Date of Birth"
                        required
                        value={formData.dateOfBirth}
                        onChange={val => setFormData({...formData, dateOfBirth: val})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Contact Number</label>
                      <input type="tel" className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Email (Optional)</label>
                      <input type="email" className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.emailAddress} onChange={e => setFormData({...formData, emailAddress: e.target.value})} />
                    </div>
                  </div>
                )}

                {steps[currentStep].key === 'medical' && (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Allergy Protocol</label>
                      <div className="flex p-1 bg-gray-100/50 rounded-2xl border border-gray-100">
                        {['No', 'Yes'].map(opt => (
                          <button 
                            key={opt}
                            onClick={() => setFormData({...formData, knownAllergies: opt as any})}
                            className={cn(
                              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                              formData.knownAllergies === opt ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400"
                            )}
                          >
                            {opt === 'No' ? 'Clear History' : 'Report Allergies'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {formData.knownAllergies === 'Yes' && (
                      <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Allergy Specifications</label>
                        <textarea className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[2rem] font-medium text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none" rows={3} value={formData.allergiesDetails} onChange={e => setFormData({...formData, allergiesDetails: e.target.value})} placeholder="Specify drugs, foods, or environmental triggers..."></textarea>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Primary Medical Indication</label>
                      <textarea className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[2rem] font-medium text-gray-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none" rows={4} value={formData.primaryConcern} onChange={e => setFormData({...formData, primaryConcern: e.target.value})} placeholder="Describe symptoms or reason for clinical visit..."></textarea>
                    </div>
                  </div>
                )}

                {steps[currentStep].key === 'appointment' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Clinical Unit</label>
                        <select className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value, doctorAssigned: ''})}>
                          <option value="">Choose Department</option>
                          {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Requested Consultant</label>
                        <select className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer" value={formData.doctorAssigned} onChange={e => setFormData({...formData, doctorAssigned: e.target.value})}>
                          <option value="">Any Available Specialist</option>
                          {filteredDoctors.map(d => <option key={d._id} value={d._id}>{d.user?.name || d.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Preferred Date</label>
                        <input type="date" className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.appointmentDate} onChange={e => setFormData({...formData, appointmentDate: e.target.value, appointmentTime: ''})} min={new Date().toISOString().split('T')[0]} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Temporal Windows</label>
                      {!formData.appointmentDate || !formData.department ? (
                         <div className="py-20 rounded-[3rem] bg-gray-50 border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
                           <Calendar className="w-12 h-12 text-gray-200 mb-4" />
                           <p className="text-gray-400 font-black uppercase tracking-[.25em] text-[10px]">Select constraints to view slots</p>
                         </div>
                      ) : slotsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                          <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">Fetching Availability...</p>
                        </div>
                      ) : timeSlots.length === 0 ? (
                        <div className="py-20 rounded-[3rem] bg-rose-50/50 border-2 border-dashed border-rose-100 text-center flex flex-col items-center">
                          <AlertCircle className="w-12 h-12 text-rose-200 mb-4" />
                          <p className="text-rose-500 font-black uppercase tracking-[.25em] text-[10px]">No Availability for Selected Params</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {timeSlots.map(slot => (
                            <button 
                              key={slot}
                              onClick={() => setFormData({...formData, appointmentTime: slot})}
                              className={cn(
                                "group p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between relative overflow-hidden",
                                formData.appointmentTime === slot 
                                  ? "border-indigo-600 bg-indigo-50/50 shadow-2xl shadow-indigo-100" 
                                  : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50/50 shadow-sm"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                  formData.appointmentTime === slot ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400"
                                )}>
                                  <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className={cn("font-black text-lg leading-none mb-1", formData.appointmentTime === slot ? "text-indigo-900" : "text-gray-900")}>{slot.split(' (')[0]}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admission Window</p>
                                </div>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                formData.appointmentTime === slot ? "border-indigo-600 bg-indigo-600" : "border-gray-200"
                              )}>
                                {formData.appointmentTime === slot && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {steps[currentStep].key === 'verify' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="p-8 rounded-[3rem] bg-indigo-50/30 border border-indigo-100 space-y-8">
                       <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Patient Name</p>
                          <p className="text-lg font-black text-gray-900 leading-tight">{formData.fullName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Protocol Type</p>
                          <p className="text-lg font-black text-indigo-600 leading-tight">{visitType}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Clinical Unit</p>
                          <p className="text-lg font-black text-gray-900 leading-tight">{formData.department}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Schedule</p>
                          <p className="text-lg font-black text-gray-900 leading-tight">{formData.appointmentDate} • {formData.appointmentTime.split(' (')[0]}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-amber-600" /></div>
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed uppercase tracking-tight">Confirming this slot will authorize clinical resources and alert the consultant. Ensure protocol accuracy.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {phase === 'form' && (
          <div className="px-5 sm:px-10 py-5 sm:py-8 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 shrink-0">
            <button 
              type="button" 
              onClick={() => currentStep === 0 ? setPhase('select') : setCurrentStep(c => c - 1)}
              className="w-full sm:w-auto px-8 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors tracking-widest flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 0 ? 'Abort Selection' : 'Previous Protocol'}
            </button>
            <button 
              type="button" 
              onClick={() => currentStep === steps.length - 1 ? handleSubmit() : setCurrentStep(c => c + 1)}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-12 py-4 sm:py-5 bg-indigo-600 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {currentStep === steps.length - 1 ? 'Authorize & Book' : 'Proceed'}
                  {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
