'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Search, User, Plus, 
  AlertCircle, Loader2, ImageIcon, CheckCircle 
} from 'lucide-react';
import { radiologyAPI, patientsAPI, servicesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPatientId?: string;
}

type ModalStage = 'Discovery' | 'Enroll' | 'Configure';

export default function CreateRadiologyRequestModal({ isOpen, onClose, onSuccess, initialPatientId }: Props) {
  const [stage, setStage] = useState<ModalStage>('Discovery');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [radiologyServices, setRadiologyServices] = useState<any[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  
  const { user } = useAuth();
  const userRole = user?.role || 'Doctor';
  const isDoctor = userRole === 'Doctor';

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [enrollData, setEnrollData] = useState({
    fullName: '',
    mobileNumber: '',
    emailAddress: '',
    gender: 'Male',
    dateOfBirth: ''
  });
  
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [requestData, setRequestData] = useState({
    priority: 'Routine' as 'Routine' | 'Urgent' | 'Stat',
    clinical_notes: '',
    requested_by_name: '',
    clinical_summary: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      if (isDoctor && user.name) {
        setRequestData(prev => ({ ...prev, requested_by_name: user.name }));
      } else if (userRole === 'Receptionist' && user.name) {
        setRequestData(prev => ({ ...prev, requested_by_name: `Reception: ${user.name}` }));
      }
    }
  }, [isOpen, user, isDoctor, userRole]);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      if (initialPatientId) {
        fetchInitialPatient(initialPatientId);
      } else {
        setStage('Discovery');
        resetForms();
      }
    }
  }, [isOpen, initialPatientId]);

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age.toString() + 'Y';
    } catch { return 'N/A'; }
  };

  const fetchInitialPatient = async (pid: string) => {
    try {
      setLoading(true);
      const res = await patientsAPI.getById(pid) as any;
      const data = res.data || res;
      if (data) {
        setSelectedPatient(data);
        setStage('Configure');
      } else {
        setStage('Discovery');
        resetForms();
      }
    } catch (e) {
      setStage('Discovery');
      resetForms();
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setSelectedPatient(null);
    setPatientSearchTerm('');
    setTestSearchTerm('');
    setSelectedTests([]);
    setEnrollData({ fullName: '', mobileNumber: '', emailAddress: '', gender: 'Male', dateOfBirth: '' });
    setRequestData({
      priority: 'Routine',
      clinical_notes: '',
      requested_by_name: isDoctor ? (user?.name || '') : '',
      clinical_summary: ''
    });
  };

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll() as any;
      const all = res.data || res || [];
      setRadiologyServices(all.filter((s: any) => 
        s.category?.toLowerCase() === 'radiology' || 
        s.name.toLowerCase().includes('x-ray') ||
        s.name.toLowerCase().includes('mri') ||
        s.name.toLowerCase().includes('ct scan') ||
        s.name.toLowerCase().includes('ultrasound')
      ));
    } catch (error) { console.error('Failed to load services'); }
  };

  const handleSearchPatients = async (term: string) => {
    setPatientSearchTerm(term);
    if (term.length < 2) {
      setPatients([]);
      return;
    }
    try {
      const res = await patientsAPI.getAll({ search: term }) as any;
      setPatients(res.data || []);
    } catch (error) { console.error('Search error'); }
  };

  const handleEnrollPatient = async () => {
    if (!enrollData.fullName || !enrollData.mobileNumber) {
      return toast.error('Name and Phone are required for enrollment');
    }
    setLoading(true);
    try {
      const res = await patientsAPI.create(enrollData) as any;
      const newPatient = res.data || res;
      setSelectedPatient(newPatient);
      toast.success('Patient enrolled successfully');
      setStage('Configure');
    } catch (error: any) {
      toast.error('Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = (test: any) => {
    if (selectedTests.find(t => t.name === test.name)) {
      return toast.error('Imaging protocol already added');
    }
    setSelectedTests([...selectedTests, test]);
    setTestSearchTerm('');
  };

  const handleRemoveTest = (name: string) => {
    setSelectedTests(selectedTests.filter(t => t.name !== name));
  };

  const handleSubmitRequest = async () => {
    if (!selectedPatient || selectedTests.length === 0) {
      return toast.error('Selection required');
    }

    setLoading(true);
    try {
      const patientId = selectedPatient.id || selectedPatient._id;
      
      // Batch creation (if backend supports it, otherwise loop)
      // For now, we'll loop or use the first one if we don't update backend yet
      // To streamline, I will update backend to support multiple tests
      
      const promises = selectedTests.map(test => 
        radiologyAPI.createRequest({
          patient_id: patientId,
          test_name: test.name,
          clinical_notes: requestData.clinical_notes,
          priority: requestData.priority,
          requested_by_name: requestData.requested_by_name
        })
      );

      await Promise.all(promises);
      
      toast.success('Imaging Orders Authorized Successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error('Failed to authorize orders');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 flex flex-col max-h-[96vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="px-5 sm:px-10 py-5 sm:py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all duration-500 shrink-0",
              stage === 'Discovery' ? "bg-blue-600" :
              stage === 'Enroll' ? "bg-emerald-600" : "bg-violet-600"
            )}>
              {stage === 'Discovery' ? <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> :
               stage === 'Enroll' ? <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                {stage === 'Discovery' ? 'Initiate Imaging' : 
                 stage === 'Enroll' ? 'Rapid Enrollment' : 'Imaging Protocol'}
              </h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">
                {stage === 'Discovery' ? 'Discovery' : 
                 stage === 'Enroll' ? 'Identity Creation' : 'Configuration'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 shrink-0 ml-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-10 no-scrollbar custom-scrollbar overscroll-behavior-contain">
          {stage === 'Discovery' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identify Subject</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                  <input 
                    type="text" autoFocus placeholder="Search Patient..."
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-2xl sm:rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-violet-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                    value={patientSearchTerm}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                  />
                </div>
              </div>

              {patients.length > 0 && (
                <div className="space-y-3">
                    {patients.map(p => (
                      <button 
                        key={p.id || p._id}
                        onClick={() => { setSelectedPatient(p); setStage('Configure'); }}
                        className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-violet-200 hover:bg-violet-50/30 transition-all group min-w-0 shadow-sm hover:shadow-md cursor-pointer"
                        type="button"
                      >
                         <div className="flex items-center gap-4 min-w-0">
                           <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-violet-600 shrink-0 shadow-sm">
                             {p.fullName?.[0]}
                           </div>
                           <div className="text-left min-w-0">
                             <p className="font-black text-gray-900 leading-none mb-1.5 truncate">{p.fullName}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate">#{p.patientId} • {p.gender}</p>
                           </div>
                         </div>
                         <CheckCircle className="w-6 h-6 text-violet-100 group-hover:text-violet-500 transition-colors shrink-0" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {stage === 'Configure' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="p-6 bg-violet-50/50 rounded-[2.5rem] border border-violet-100 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-violet-100 flex items-center justify-center font-black text-violet-600 shadow-sm shrink-0">
                    {selectedPatient?.fullName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-gray-900 leading-none truncate">{selectedPatient?.fullName}</p>
                    <p className="text-[10px] text-violet-500 font-bold uppercase tracking-widest mt-2 truncate">
                      {calculateAge(selectedPatient?.dateOfBirth)} • {selectedPatient?.gender}
                    </p>
                  </div>
                </div>
                <button onClick={() => setStage('Discovery')} className="px-5 py-2.5 rounded-xl bg-white border border-violet-100 text-[10px] font-black uppercase text-violet-600 hover:bg-violet-600 hover:text-white transition-all shadow-sm cursor-pointer shrink-0 ml-4" type="button">Change Subject</button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Imaging Protocol</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
                  <input placeholder="Select imaging scan..." className="w-full pl-16 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-violet-500/10 outline-none font-black text-gray-900 shadow-inner"
                    value={testSearchTerm} onChange={(e) => setTestSearchTerm(e.target.value)} />
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  {radiologyServices.filter(s => s.name.toLowerCase().includes(testSearchTerm.toLowerCase())).slice(0, 15).map(s => (
                    <button key={s.id} onClick={() => handleAddTest(s)} className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all shadow-sm cursor-pointer" type="button">
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

               {selectedTests.length > 0 && (
                <div className="space-y-4 p-8 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                  <div className="flex flex-wrap gap-3">{selectedTests.map(t => (
                    <div key={t.id} className="flex items-center gap-3 pl-5 pr-3 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow min-w-0">
                      <span className="text-xs font-black text-gray-700 truncate">{t.name}</span>
                      <button onClick={() => handleRemoveTest(t.name)} className="p-1.5 hover:bg-rose-50 rounded-xl text-gray-300 hover:text-rose-500 shrink-0 transition-colors" type="button"><X className="w-4 h-4" /></button>
                    </div>
                  ))}</div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Clinical Manifestations</label>
                <textarea rows={4} placeholder="Suspected pathology, anatomical focus or reason for imaging..." className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-medium text-gray-700 resize-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all shadow-inner" 
                  value={requestData.clinical_notes} onChange={e => setRequestData({...requestData, clinical_notes: e.target.value})} />
              </div>

               <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-2 bg-violet-50/50 rounded-[2.5rem] border border-violet-100/50 mt-8 group overflow-hidden">
                <div className="px-8 py-4 sm:py-2">
                  <p className="text-[10px] text-violet-600 font-black uppercase tracking-[0.2em] mb-3 sm:mb-2">Urgency Protocol</p>
                  <div className="flex gap-2">
                    {['Routine', 'Urgent', 'Stat'].map(p => (
                      <button key={p} onClick={() => setRequestData(prev => ({...prev, priority: p as any}))} type="button"
                        className={cn(
                          "text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-sm", 
                          requestData.priority === p 
                            ? "bg-violet-600 text-white shadow-violet-100" 
                            : "text-gray-400 bg-white hover:bg-gray-50"
                        )}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleSubmitRequest} disabled={loading} type="button" className="bg-gray-900 hover:bg-emerald-600 text-white px-10 sm:px-14 py-5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-4 cursor-pointer shadow-2xl shadow-violet-100 hover:shadow-emerald-100 group-hover:scale-[1.02] duration-500 mt-4 sm:mt-0">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-6 h-6" />} Authorize Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
