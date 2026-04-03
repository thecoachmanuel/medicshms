'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, Heart, Calendar, ShieldCheck,
  ArrowLeft, ArrowRight, Phone, Mail, Loader2, CheckCircle,
  AlertCircle, Clock, MapPin, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { publicAppointmentsAPI, departmentsAPI, doctorsAPI } from '@/lib/api';
import { DOBInput } from '@/components/common/DOBInput';
import { calculateAge, cn } from '@/lib/utils';

const STEPS = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'medical', label: 'Medical Info', icon: Heart },
  { key: 'appointment', label: 'Schedule', icon: Calendar },
  { key: 'confirm', label: 'Confirm', icon: ShieldCheck },
];

interface Props {
  hospitalId: string;
  slug: string;
}

export default function PublicBookingForm({ hospitalId, slug }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

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
    visitType: 'New Patient',
    patientId: ''
  });

  useEffect(() => {
    // Fetch departments for THIS hospital
    departmentsAPI.getAll({ hospitalSlug: slug })
      .then(r => setDepartments(r.data || []))
      .catch(console.error);
    
    doctorsAPI.getAll()
      .then(r => setDoctors(r.data || []))
      .catch(console.error);
  }, [slug]);

  const handlePatientLookup = async () => {
    if (!formData.emailAddress || !formData.dateOfBirth) {
      toast.error('Please enter Email and Date of Birth to lookup');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await publicAppointmentsAPI.lookupPatient({
        email: formData.emailAddress,
        dob: formData.dateOfBirth,
        hospitalId
      }) as any;

      if (res.success && res.data) {
        setFormData({
          ...formData,
          ...res.data,
          visitType: 'Returning Patient'
        });
        toast.success('Patient details found and pre-filled!');
      }
    } catch (err: any) {
      toast.error(err.response?.status === 404 ? 'No record found. Please continue as New Patient.' : 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    if (formData.appointmentDate && formData.department) {
      setSlotsLoading(true);
      publicAppointmentsAPI.getTimeSlots(formData.appointmentDate, formData.department, hospitalId)
        .then((res: any) => setTimeSlots(res.timeSlots || []))
        .catch(() => setTimeSlots(['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']))
        .finally(() => setSlotsLoading(false));
    }
  }, [formData.appointmentDate, formData.department, hospitalId]);

  const validateStep = () => {
    if (currentStep === 0) {
      return formData.fullName && formData.gender && formData.dateOfBirth && formData.emailAddress && formData.mobileNumber;
    }
    if (currentStep === 2) {
      return formData.department && formData.appointmentDate && formData.appointmentTime;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await publicAppointmentsAPI.book({
        ...formData,
        age: calculateAge(formData.dateOfBirth),
        hospitalId
      });
      setIsSuccess(true);
      toast.success('Appointment booked successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-20 px-8 bg-white rounded-[3rem] border border-emerald-100 shadow-2xl shadow-emerald-600/5 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4">Appointment Confirmed!</h2>
        <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed mb-10">
          Your request has been received. A confirmation email with details has been sent to <span className="text-primary-600 font-bold">{formData.emailAddress}</span>.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.location.href = `/${slug}`}
            className="btn-primary w-full sm:w-auto px-10 py-4 rounded-2xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={cn(
                "flex flex-col items-center gap-2 relative z-10",
                i <= currentStep ? "text-primary-600" : "text-gray-300"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  i === currentStep ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-110" : 
                  i < currentStep ? "bg-emerald-500 text-white" : "bg-white border-2 border-gray-100"
                )}>
                  {i < currentStep ? <CheckCircle className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-primary-600 transition-all duration-500" 
                    style={{ width: i < currentStep ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-8 md:p-12">
        <div className="max-w-3xl mx-auto">
            {currentStep === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500 font-medium">Please provide your basic details for identification.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter your full legal name"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Gender</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold appearance-none cursor-pointer"
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <DOBInput 
                      label="Date of Birth"
                      required
                      value={formData.dateOfBirth}
                      onChange={(val: string) => setFormData({...formData, dateOfBirth: val})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="email@example.com"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold"
                      value={formData.emailAddress}
                      onChange={e => setFormData({...formData, emailAddress: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+234 000 000 0000"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold"
                      value={formData.mobileNumber}
                      onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handlePatientLookup}
                      disabled={lookupLoading || !formData.emailAddress || !formData.dateOfBirth}
                      className="w-full py-4 bg-primary-50 text-primary-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {formData.visitType === 'Returning Patient' ? 'Update Details' : 'I am a Returning Patient (Auto-fill)'}
                    </button>
                    {formData.visitType === 'Returning Patient' && (
                      <p className="mt-2 text-center text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                        Returning Patient Verified
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                 <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">Medical Background</h3>
                  <p className="text-sm text-gray-500 font-medium">This helps our specialists prepare for your visit.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Known Allergies</label>
                    <div className="flex gap-4">
                      {['No', 'Yes'].map(opt => (
                        <button 
                          key={opt}
                          onClick={() => setFormData({...formData, knownAllergies: opt})}
                          className={cn(
                            "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all",
                            formData.knownAllergies === opt ? "bg-primary-600 text-white border-primary-600" : "bg-white border-gray-100 text-gray-400 hover:border-primary-200"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.knownAllergies === 'Yes' && (
                    <div className="space-y-2 animate-in slide-in-from-top-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Allergy Details</label>
                      <textarea 
                        rows={2}
                        placeholder="Please list any specific allergies..."
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold resize-none"
                        value={formData.allergiesDetails}
                        onChange={e => setFormData({...formData, allergiesDetails: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Primary Concern / Symptoms</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="What is the main reason for your visit?"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold resize-none"
                      value={formData.primaryConcern}
                      onChange={e => setFormData({...formData, primaryConcern: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Existing Medical Conditions (Optional)</label>
                    <textarea 
                      rows={2}
                      placeholder="Diabetes, Hypertension, etc."
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold resize-none"
                      value={formData.existingConditions}
                      onChange={e => setFormData({...formData, existingConditions: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">Schedule Appointment</h3>
                  <p className="text-sm text-gray-500 font-medium">Select your preferred department and time slot.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Department</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold appearance-none cursor-pointer"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value, appointmentTime: ''})}
                    >
                      <option value="">Choose Department</option>
                      {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Choose Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all font-bold"
                      value={formData.appointmentDate}
                      onChange={e => setFormData({...formData, appointmentDate: e.target.value, appointmentTime: ''})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Available Time Slots</label>
                    {!formData.appointmentDate || !formData.department ? (
                       <div className="p-8 rounded-[2rem] bg-gray-50 border border-dashed border-gray-200 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                         Select department and date to see slots
                       </div>
                    ) : slotsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 text-center text-red-500 font-bold text-xs uppercase tracking-widest">
                        No slots available for this selection
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {timeSlots.map(slot => (
                          <button 
                            key={slot}
                            onClick={() => setFormData({...formData, appointmentTime: slot})}
                            className={cn(
                              "py-3 rounded-xl text-[10px] font-black transition-all",
                              formData.appointmentTime === slot ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">Final Confirmation</h3>
                  <p className="text-sm text-gray-500 font-medium">Review your details before submitting.</p>
                </div>
                
                <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient Details</p>
                        <p className="text-xl font-black">{formData.fullName}</p>
                        <p className="text-xs text-gray-400 font-medium italic">{formData.mobileNumber} • {formData.emailAddress}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Appointment Timing</p>
                        <p className="text-xl font-black text-primary-400">{formData.appointmentDate}</p>
                        <p className="text-xs text-gray-400 font-medium tracking-[0.2em]">{formData.appointmentTime}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical Department</p>
                        <p className="text-lg font-bold">{formData.department}</p>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-wider leading-tight">
                              Please arrive 15 mins early with valid ID.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 italic text-sm text-gray-500 font-medium text-center">
                  "By confirming, you agree to receive medical communications via email and SMS."
                </div>
              </div>
            )}

            <div className={`flex items-center gap-4 pt-12 ${currentStep === 0 ? 'justify-end' : 'justify-between'}`}>
              {currentStep > 0 && (
                <button 
                  onClick={() => setCurrentStep(c => c - 1)}
                  className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              <button 
                disabled={!validateStep() || isSubmitting}
                onClick={() => currentStep === STEPS.length - 1 ? handleSubmit() : setCurrentStep(c => c + 1)}
                className={cn(
                  "px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3",
                  currentStep === STEPS.length - 1 ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700" : "bg-primary-600 text-white shadow-primary-600/20 hover:bg-primary-700",
                  (!validateStep() || isSubmitting) && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === STEPS.length - 1 ? (
                  'Confirm Booking'
                ) : (
                  <>
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}
