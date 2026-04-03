'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Search, User, Heart, Calendar, MapPin, ShieldCheck,
  ArrowLeft, ArrowRight, Phone, Mail, Loader2, CheckCircle,
  Stethoscope, UserPlus, RotateCcw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { appointmentsAPI, departmentsAPI, doctorsAPI } from '@/lib/api';
import { DOBInput } from '@/components/common/DOBInput';
import { calculateAge, cn } from '@/lib/utils';

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
  const [phase, setPhase] = useState<'select' | 'lookup' | 'form'>('select');
  const [visitType, setVisitType] = useState<'New Patient' | 'Follow-up'>('New Patient');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
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

  useEffect(() => {
    if (formData.appointmentDate && formData.department) {
      setSlotsLoading(true);
      appointmentsAPI.getTimeSlots(formData.appointmentDate, formData.department)
        .then((res: any) => setTimeSlots(res.timeSlots || []))
        .catch(console.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [formData.appointmentDate, formData.department]);

  const handleLookup = async () => {
    if (!lookupMobile || lookupMobile.length < 10) return toast.error('Enter valid mobile');
    setLookupLoading(true);
    try {
      const res: any = await appointmentsAPI.lookupPatient(lookupMobile);
      const p = res.data;
      setFormData(prev => ({
        ...prev,
        fullName: p.fullName || '',
        gender: p.gender || '',
        emailAddress: p.emailAddress || '',
        mobileNumber: p.mobileNumber || lookupMobile,
        knownAllergies: p.knownAllergies || 'No',
        allergiesDetails: p.allergiesDetails || '',
        existingConditions: p.existingConditions || '',
        address: p.address || '',
      }));
      setExistingPatientId(p.patientId || '');
      setPhase('form');
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

  const filteredDoctors = doctors.filter(d => 
    !formData.department || d.department?.name === formData.department
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm shadow-xl" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Appointment</h2>
              <p className="text-xs text-gray-500 font-medium">Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {phase === 'select' && (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Choose Patient Type</h3>
                <p className="text-sm text-gray-500">Pick how you want to register this appointment.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => { setVisitType('New Patient'); setPhase('form'); }}
                  className="p-6 rounded-2xl border-2 border-gray-100 hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">New Patient</h4>
                  <p className="text-xs text-gray-500 mt-1">Register a patient for the first time.</p>
                </button>
                <button 
                  onClick={() => { setVisitType('Follow-up'); setPhase('lookup'); }}
                  className="p-6 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <RotateCcw className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">Follow-up</h4>
                  <p className="text-xs text-gray-500 mt-1">Book for an existing returning patient.</p>
                </button>
              </div>
            </div>
          )}

          {phase === 'lookup' && (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Find Records</h3>
                <p className="text-sm text-gray-500">Enter patient mobile number to fetch details.</p>
              </div>
              <div className="max-w-md mx-auto space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    value={lookupMobile}
                    onChange={(e) => setLookupMobile(e.target.value)}
                    className="input w-full pl-12 h-14 text-lg font-bold"
                  />
                </div>
                <button 
                  onClick={handleLookup}
                  disabled={lookupLoading}
                  className="btn-primary w-full h-12 text-base"
                >
                  {lookupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search Records'}
                </button>
                <button onClick={() => setPhase('select')} className="btn-secondary w-full h-12 border-none">Go Back</button>
              </div>
            </div>
          )}

          {phase === 'form' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                {steps.map((s, i) => (
                  <React.Fragment key={s.key}>
                    <div className={cn(
                      "flex items-center gap-2",
                      i === currentStep ? "text-primary-600" : i < currentStep ? "text-emerald-500" : "text-gray-300"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0",
                        i === currentStep ? "border-primary-600 bg-primary-50" : i < currentStep ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
                      )}>
                        {i < currentStep ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                      </div>
                      <span className="hidden md:block text-xs font-bold uppercase tracking-wider">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className="h-0.5 flex-1 bg-gray-100"></div>}
                  </React.Fragment>
                ))}
              </div>

              {steps[currentStep].key === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Patient Full Name</label>
                    <input type="text" className="input w-full" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                    <select className="input w-full" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <DOBInput
                      label="Date of Birth"
                      required
                      value={formData.dateOfBirth}
                      onChange={val => setFormData({...formData, dateOfBirth: val})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <input type="tel" className="input w-full" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input type="email" className="input w-full" value={formData.emailAddress} onChange={e => setFormData({...formData, emailAddress: e.target.value})} />
                  </div>
                </div>
              )}

              {steps[currentStep].key === 'medical' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Known Allergies</label>
                    <select className="input w-full" value={formData.knownAllergies} onChange={e => setFormData({...formData, knownAllergies: e.target.value})}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {formData.knownAllergies === 'Yes' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Allergy Details</label>
                      <textarea className="input w-full" rows={2} value={formData.allergiesDetails} onChange={e => setFormData({...formData, allergiesDetails: e.target.value})}></textarea>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Primary Health Concern</label>
                    <textarea className="input w-full" rows={3} value={formData.primaryConcern} onChange={e => setFormData({...formData, primaryConcern: e.target.value})} placeholder="Describe symptoms or reason for visit..."></textarea>
                  </div>
                </div>
              )}

              {steps[currentStep].key === 'appointment' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                    <select className="input w-full" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value, doctorAssigned: ''})}>
                      <option value="">Select Dept</option>
                      {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Doctor</label>
                    <select className="input w-full" value={formData.doctorAssigned} onChange={e => setFormData({...formData, doctorAssigned: e.target.value})}>
                      <option value="">Select Doctor (Optional)</option>
                      {filteredDoctors.map(d => <option key={d._id} value={d._id}>{d.user?.name || d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Appointment Date</label>
                    <input type="date" className="input w-full" value={formData.appointmentDate} onChange={e => setFormData({...formData, appointmentDate: e.target.value, appointmentTime: ''})} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Available Slots</label>
                    <div className="relative">
                      <select className="input w-full pr-10" value={formData.appointmentTime} onChange={e => setFormData({...formData, appointmentTime: e.target.value})} disabled={!formData.appointmentDate || slotsLoading}>
                        <option value="">Select Time</option>
                        {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {slotsLoading && <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-gray-400" />}
                    </div>
                  </div>
                </div>
              )}

              {steps[currentStep].key === 'verify' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-bold text-gray-900">Summary Review</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Patient</p>
                        <p className="text-sm font-bold text-gray-700">{formData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Visit Type</p>
                        <p className="text-sm font-bold text-primary-600">{visitType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">DateTime</p>
                        <p className="text-sm font-bold text-gray-700">{formData.appointmentDate} at {formData.appointmentTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Department</p>
                        <p className="text-sm font-bold text-gray-700">{formData.department}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700">Please ensure all details are correct. Confirmation will be sent via email to patient.</p>
                  </div>
                </div>
              )}

              <div className="pt-8 flex items-center justify-between border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => currentStep === 0 ? setPhase('select') : setCurrentStep(c => c - 1)}
                  className="btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {currentStep === 0 ? 'Back to Type' : 'Previous Step'}
                </button>
                <button 
                  type="button" 
                  onClick={() => currentStep === steps.length - 1 ? handleSubmit() : setCurrentStep(c => c + 1)}
                  disabled={isSubmitting}
                  className={cn("btn-primary min-w-[140px]", currentStep === steps.length - 1 && "bg-primary-600 hover:bg-primary-700")}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {currentStep === steps.length - 1 ? 'Confirm & Book' : 'Continue'}
                      {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
