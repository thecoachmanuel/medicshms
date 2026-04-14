'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Search, User, Plus, 
  AlertCircle, Loader2, TestTubes, CheckCircle 
} from 'lucide-react';
import { labAPI, patientsAPI, servicesAPI } from '@/lib/api';
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

export default function CreateLabRequestModal({ isOpen, onClose, onSuccess, initialPatientId }: Props) {
  const [stage, setStage] = useState<ModalStage>('Discovery');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [labServices, setLabServices] = useState<any[]>([]);
  const [labCatalog, setLabCatalog] = useState<any[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [showCatalogSuggestions, setShowCatalogSuggestions] = useState(false);
  const [isNewTest, setIsNewTest] = useState(false);
  
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
    specimen_type: 'Venous Blood',
    priority: 'Routine' as 'Routine' | 'Urgent' | 'Stat',
    patient_preparation: '',
    collection_instructions: '',
    clinical_notes: '', // Analytical Instructions
    lab_number: '',
    requested_by_name: '',
    clinical_summary: ''
  });
  const [isCustomSpecimen, setIsCustomSpecimen] = useState(false);
  const [customSpecimen, setCustomSpecimen] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      if (isDoctor && user.name) {
        setRequestData(prev => ({ ...prev, requested_by_name: user.name }));
      }
    }
  }, [isOpen, user, isDoctor]);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchCatalog();
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

  const fetchCatalog = async () => {
    try {
      const res = await labAPI.getCatalog() as any;
      setLabCatalog(res.data || []);
    } catch (e) { console.error('Catalog fetch error'); }
  };

  const resetForms = () => {
    setSelectedPatient(null);
    setPatientSearchTerm('');
    setTestSearchTerm('');
    setSelectedTests([]);
    setEnrollData({ fullName: '', mobileNumber: '', emailAddress: '', gender: 'Male', dateOfBirth: '' });
    setRequestData({
      specimen_type: 'Venous Blood',
      priority: 'Routine',
      patient_preparation: '',
      collection_instructions: '',
      clinical_notes: '',
      lab_number: '',
      requested_by_name: isDoctor ? (user?.name || '') : '',
      clinical_summary: ''
    });
    setIsCustomSpecimen(false);
    setCustomSpecimen('');
  };

  // Auto-generate Accession Number
  useEffect(() => {
    if (selectedTests.length === 1 && !requestData.lab_number) {
      const testName = selectedTests[0].test_name || 'LAB';
      const prefix = testName.substring(0, 3).toUpperCase();
      const unique = Math.floor(1000 + Math.random() * 9000); // 4-digit unique
      const timestamp = new Date().getTime().toString().slice(-4);
      setRequestData(prev => ({ 
        ...prev, 
        lab_number: `${prefix}${unique}${timestamp}` 
      }));
    }
  }, [selectedTests, requestData.lab_number]);

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll() as any;
      const all = res.data || res || [];
      setLabServices(all.filter((s: any) => 
        s.category?.toLowerCase() === 'laboratory' || 
        s.name.toLowerCase().includes('test') ||
        s.department?.name?.toLowerCase().includes('lab')
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
      
      // Explicitly wait to properly load the full patient details from the database
      // before opening the stage two modal to select the test.
      let fullPatient = newPatient;
      try {
        const fullPatientRes = await patientsAPI.getById(newPatient.id || newPatient._id) as any;
        fullPatient = fullPatientRes.data || fullPatientRes;
      } catch (err) {
        console.error("Failed to fetch full patient details, using created object fallback", err);
      }

      setSelectedPatient(fullPatient);
      toast.success('Patient enrolled successfully');
      setStage('Configure');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Enrollment failed';
      toast.error(`Enrollment failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = (test: any) => {
    if (selectedTests.find(t => t.test_name === test.test_name)) {
      return toast.error('Test already added to batch');
    }
    // Ensure price is mapped correctly (Catalog uses 'price', Form expects 'test_price')
    const preparedTest = {
      ...test,
      test_price: test.test_price || test.price || 0
    };
    setSelectedTests([...selectedTests, preparedTest]);
    setTestSearchTerm('');
    setShowCatalogSuggestions(false);
  };

  const handleRemoveTest = (name: string) => {
    setSelectedTests(selectedTests.filter(t => t.test_name !== name));
  };

  const handleSubmitRequest = async () => {
    if (!selectedPatient || selectedTests.length === 0) {
      return toast.error('Selection required');
    }

    const missingPrice = selectedTests.find(t => t.is_new && (!t.test_price || t.test_price <= 0));
    if (missingPrice) {
      return toast.error(`Please provide a price for manual investigation: ${missingPrice.test_name}`);
    }

    setLoading(true);
    try {
      let patientId = selectedPatient.id || selectedPatient._id;
      let pAge = calculateAge(selectedPatient.dateOfBirth);
      let pGender = selectedPatient.gender || 'N/A';

      // RAPID ENROLLMENT
      if (!patientId && selectedPatient.isVirtual) {
        try {
          const enrollRes = await patientsAPI.create({
            fullName: selectedPatient.fullName,
            mobileNumber: `RAPID-${Date.now()}`,
            gender: 'Male'
          }) as any;
          const newP = enrollRes.data || enrollRes;
          patientId = newP.id || newP._id;
          pAge = 'N/A';
          pGender = 'Male';
        } catch (enrollError) {
          setLoading(false);
          return toast.error('Rapid enrollment failed');
        }
      }

      await labAPI.createRequest({
        patient_id: patientId,
        patient_age: pAge,
        patient_gender: pGender,
        ...requestData,
        specimen_type: isCustomSpecimen ? customSpecimen : requestData.specimen_type,
        tests: selectedTests.map(t => ({
          test_name: t.test_name,
          test_price: t.test_price,
          unit_id: t.unit_id,
          service_id: t.service_id
        }))
      });
      
      toast.success('Job Authorized & Invoiced Successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to authorize';
      toast.error(`Error: ${msg}`);
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
              stage === 'Discovery' ? "bg-blue-600 shadow-blue-200" :
              stage === 'Enroll' ? "bg-emerald-600 shadow-emerald-200" : "bg-indigo-600 shadow-indigo-200"
            )}>
              {stage === 'Discovery' ? <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> :
               stage === 'Enroll' ? <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <TestTubes className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                {stage === 'Discovery' ? 'Initiate Job' : 
                 stage === 'Enroll' ? 'Rapid Enrollment' : 'Diagnostic Protocol'}
              </h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate">
                {stage === 'Discovery' ? 'Discovery' : 
                 stage === 'Enroll' ? 'Identity Creation' : 'Configuration'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all duration-300 cursor-pointer shrink-0 ml-2" type="button">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-10 no-scrollbar custom-scrollbar overscroll-behavior-contain">
          {stage === 'Discovery' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identify Subject</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" autoFocus placeholder="Search Patient..."
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-2xl sm:rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                    value={patientSearchTerm}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                  />
                </div>
              </div>

              {patients.length > 0 ? (
                <div className="space-y-3">
                    {patients.map(p => (
                      <button 
                        key={p.id || p._id}
                        onClick={() => { setSelectedPatient(p); setStage('Configure'); }}
                        className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                        type="button"
                      >
                         <div className="flex items-center gap-4 min-w-0">
                           <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-indigo-600 shrink-0">
                             {p.fullName?.[0]}
                           </div>
                           <div className="text-left min-w-0">
                             <p className="font-black text-gray-900 leading-none mb-1.5 truncate">{p.fullName}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none truncate">#{p.patientId} • {p.gender}</p>
                           </div>
                         </div>
                         <CheckCircle className="w-6 h-6 text-indigo-100 group-hover:text-indigo-500 transition-colors shrink-0" />
                      </button>
                    ))}
                </div>
              ) : patientSearchTerm.length >= 2 && (
                <div className="py-12 sm:py-16 px-8 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-[2.25rem] flex items-center justify-center mb-6 shadow-xl">
                    <User className="w-10 h-10 text-indigo-100" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 italic">"{patientSearchTerm}"</h3>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-8">
                    <button 
                      onClick={() => { setSelectedPatient({ fullName: patientSearchTerm, isVirtual: true }); setStage('Configure'); }}
                      className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl cursor-pointer"
                      type="button"
                    >Quick Proceed</button>
                    <button 
                      onClick={() => { setEnrollData(prev => ({ ...prev, fullName: patientSearchTerm })); setStage('Enroll'); }}
                      className="flex-1 px-8 py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer"
                      type="button"
                    >Full Enroll</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'Enroll' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Legal Name</label>
                    <input className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" value={enrollData.fullName} onChange={e => setEnrollData({...enrollData, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Mobile Contact</label>
                    <input placeholder="+234..." className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" value={enrollData.mobileNumber} onChange={e => setEnrollData({...enrollData, mobileNumber: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email (Optional)</label>
                    <input className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" value={enrollData.emailAddress} onChange={e => setEnrollData({...enrollData, emailAddress: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Biological Sex</label>
                    <select className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" value={enrollData.gender} onChange={e => setEnrollData({...enrollData, gender: e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Date of Birth</label>
                  <input type="date" className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" value={enrollData.dateOfBirth} onChange={e => setEnrollData({...enrollData, dateOfBirth: e.target.value})} />
               </div>
               <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                  <button onClick={() => setStage('Discovery')} className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest" type="button">Discard</button>
                  <button onClick={handleEnrollPatient} disabled={loading} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.75rem] text-[10px] font-black uppercase flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-95 transition-all" type="button">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Create Identity
                  </button>
               </div>
            </div>
          )}

          {stage === 'Configure' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center font-black text-indigo-600 shadow-sm shrink-0">
                    {selectedPatient?.fullName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-gray-900 leading-none truncate">{selectedPatient?.fullName}</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2 truncate">
                      {calculateAge(selectedPatient?.dateOfBirth)} • {selectedPatient?.gender || 'N/A'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setStage('Discovery')} className="px-5 py-2.5 rounded-xl bg-white border border-indigo-100 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm cursor-pointer shrink-0 ml-4" type="button">Change Subject</button>
              </div>

              <div className="space-y-3 relative">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 flex justify-between">
                  Protocol Investigation {isNewTest && <span className="text-amber-500 animate-pulse">Auto-Indexed Mode</span>}
                </label>
                 <div className="relative group">
                  <TestTubes className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input placeholder="Search or Type new test..." className="w-full pl-16 pr-24 sm:pr-48 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-gray-900 shadow-inner overflow-hidden"
                    value={testSearchTerm} onChange={(e) => {
                      const val = e.target.value; setTestSearchTerm(val);
                      const match = labCatalog.find(c => c.test_name.toLowerCase() === val.toLowerCase());
                      setIsNewTest(!match && val.length > 0); setShowCatalogSuggestions(val.length > 0);
                    }} onFocus={() => setShowCatalogSuggestions(testSearchTerm.length > 0)} />
                  {isNewTest && (
                    <div className="absolute right-20 sm:right-32 top-1/2 -translate-y-1/2 flex items-center gap-2 border-l border-amber-100 pl-4 h-8 bg-white/50 backdrop-blur-sm rounded-r-2xl pr-2">
                      <span className="text-[9px] font-black text-amber-600 tracking-tighter sm:block hidden">₦</span>
                      <input type="number" placeholder="Fee" required className="w-12 sm:w-16 bg-transparent outline-none text-[10px] font-black text-emerald-600" id="manual-test-price" />
                    </div>
                  )}
                  <button onClick={() => {
                    const match = labCatalog.find(c => c.test_name.toLowerCase() === testSearchTerm.toLowerCase());
                    const manualPrice = (document.getElementById('manual-test-price') as HTMLInputElement)?.value;
                    if (!match && (!manualPrice || parseFloat(manualPrice) <= 0)) return toast.error('Fee required');
                    handleAddTest({ test_name: match?.test_name || testSearchTerm, test_price: match?.price || parseFloat(manualPrice), unit_id: match?.unit_id || null, is_new: !match });
                  }} className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 cursor-pointer" type="button">Add</button>
                </div>
                 {showCatalogSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-3 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_32px_128px_rgba(30,41,59,0.2)] border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="max-h-72 overflow-y-auto no-scrollbar custom-scrollbar p-3 space-y-1">
                      {labCatalog.filter(c => c.test_name.toLowerCase().includes(testSearchTerm.toLowerCase())).map(c => (
                        <button key={c.id} onClick={() => handleAddTest({ test_name: c.test_name, test_price: c.price, unit_id: c.unit_id, is_new: false })}
                          className="w-full flex items-center justify-between p-5 hover:bg-indigo-50 rounded-[1.75rem] transition-all text-left group cursor-pointer" type="button">
                          <div><p className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{c.test_name}</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{c.unit?.name || 'General diagnostic'}</p></div>
                          <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">₦{c.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

               {selectedTests.length > 0 && (
                <div className="space-y-4 p-8 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                  <div className="flex flex-wrap gap-3">{selectedTests.map(t => (
                    <div key={t.test_name} className="flex items-center gap-3 pl-5 pr-3 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow min-w-0">
                      <span className="text-xs font-black text-gray-700 truncate">{t.test_name}</span>
                      <button onClick={() => handleRemoveTest(t.test_name)} className="p-1.5 hover:bg-rose-50 rounded-xl text-gray-300 hover:text-rose-500 shrink-0 transition-colors" type="button"><X className="w-4 h-4" /></button>
                    </div>
                  ))}</div>
                </div>
              )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Requesting Physician</label>
                  <input placeholder="Doctor's name..." className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" 
                    value={requestData.requested_by_name} onChange={e => setRequestData({...requestData, requested_by_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Accession Reference</label>
                  <input placeholder="Auto-generated..." className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 shadow-inner" 
                    value={requestData.lab_number} onChange={e => setRequestData({...requestData, lab_number: e.target.value})} />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Urgency Protocol</label>
                  <div className="flex p-1.5 bg-gray-100/50 rounded-[1.75rem] border border-gray-100">
                    {(['Routine', 'Urgent', 'Stat'] as const).map(p => {
                      const isActive = requestData.priority === p;
                      let activeClass = "bg-gray-900 text-white shadow-xl";
                      if (isActive) {
                        if (p === 'Routine') activeClass = "bg-emerald-600 text-white shadow-lg shadow-emerald-100";
                        else if (p === 'Urgent') activeClass = "bg-amber-500 text-white shadow-lg shadow-amber-100";
                        else if (p === 'Stat') activeClass = "bg-rose-600 text-white shadow-lg shadow-rose-100";
                      }
                      
                      return (
                        <button key={p} onClick={() => setRequestData({...requestData, priority: p})} type="button" 
                          className={cn("flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all", isActive ? activeClass : "text-gray-400 hover:text-gray-600")}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Primary Specimen</label>
                  <div className="space-y-3">
                    <select className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" 
                      value={isCustomSpecimen ? 'custom' : requestData.specimen_type} onChange={e => {
                        if (e.target.value === 'custom') {
                          setIsCustomSpecimen(true);
                        } else {
                          setIsCustomSpecimen(false);
                          setRequestData({...requestData, specimen_type: e.target.value});
                        }
                      }}>
                      <option>Venous Blood</option>
                      <option>Capillary Blood</option>
                      <option>Mid-stream Urine</option>
                      <option>Stool</option>
                      <option>CSF</option>
                      <option value="custom">Other / Manual Entry</option>
                    </select>
                    {isCustomSpecimen && (
                      <input 
                        placeholder="Manual specimen source..." 
                        className="w-full px-6 py-4 bg-white border-2 border-indigo-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-indigo-500 shadow-xl shadow-indigo-50 transition-all animate-in slide-in-from-top-4 duration-300"
                        value={customSpecimen}
                        onChange={e => setCustomSpecimen(e.target.value)}
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Clinical Manifestations</label>
                <textarea rows={3} placeholder="Brief summary of symptoms or indications..." className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-medium text-gray-700 resize-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" 
                  value={requestData.clinical_summary} onChange={e => setRequestData({...requestData, clinical_summary: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Analytical Pre-conditions</label>
                <textarea rows={3} placeholder="Specific handling or patient prep notes..." className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-medium text-gray-700 resize-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner" 
                  value={requestData.clinical_notes} onChange={e => setRequestData({...requestData, clinical_notes: e.target.value})} />
              </div>

               <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:p-2 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 mt-8 group overflow-hidden">
                <div className="px-8 py-4 sm:py-2">
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">Authorization Value</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">₦ {selectedTests.reduce((acc, t) => acc + (t.test_price || 0), 0).toLocaleString()}</p>
                </div>
                <button onClick={handleSubmitRequest} disabled={loading} type="button" className="bg-gray-900 hover:bg-emerald-600 text-white px-10 sm:px-14 py-5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-4 cursor-pointer shadow-2xl shadow-indigo-100 hover:shadow-emerald-100 group-hover:scale-[1.02] duration-500">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-6 h-6" />} Authorize Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
