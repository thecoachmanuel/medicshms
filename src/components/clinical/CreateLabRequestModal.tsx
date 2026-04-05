'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Search, User, Plus, CheckCircle, 
  Clock, AlertCircle, TestTubes, Info, 
  Phone, Mail, Calendar, Loader2 
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
    clinical_notes: '',
    lab_number: '',
    requesting_doctor: '',
    clinical_summary: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      const role = user.role || 'Doctor';
      if (role === 'Doctor' && user.name) {
        setRequestData(prev => ({ ...prev, requesting_doctor: user.name }));
      }
    }
  }, [isOpen, user]);

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

  const { user } = useAuth();
  const userRole = user?.role || 'Doctor';
  const isDoctor = userRole === 'Doctor';

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
      lab_number: ''
    });
  };

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll() as any;
      const all = res.data || res || [];
      setLabServices(all.filter((s: any) => 
        s.category?.toLowerCase() === 'laboratory' || 
        s.name.toLowerCase().includes('test') ||
        s.department?.name?.toLowerCase().includes('lab')
      ));
    } catch (error) {
      console.error('Failed to load services');
    }
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
    } catch (error) {
      console.error('Search error');
    }
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
    } catch (error) {
      toast.error('Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = (test: any) => {
    if (selectedTests.find(t => t.test_name === test.test_name)) {
      return toast.error('Test already added to batch');
    }
    setSelectedTests([...selectedTests, test]);
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

    // Double check: all new tests must have a price
    const missingPrice = selectedTests.find(t => t.is_new && (!t.test_price || t.test_price <= 0));
    if (missingPrice) {
      return toast.error(`Please provide a price for manual investigation: ${missingPrice.test_name}`);
    }

    setLoading(true);
    try {
      let patientId = selectedPatient.id || selectedPatient._id;

      // RAPID ENROLLMENT: If patient was quick-added without an ID
      if (!patientId && selectedPatient.isVirtual) {
        try {
          const enrollRes = await patientsAPI.create({
            fullName: selectedPatient.fullName,
            mobileNumber: '0000000000', // Placeholder for rapid entry
            gender: 'Male' // Default
          }) as any;
          const newP = enrollRes.data || enrollRes;
          patientId = newP.id || newP._id;
        } catch (enrollError) {
          console.error('Rapid Enrollment failed:', enrollError);
          setLoading(false);
          return toast.error('Rapid enrollment failed. Please check network.');
        }
      }

      const promises = selectedTests.map(async (test) => {
        // Auto-Indexing for Scientists if price is provided manually
        if (test.is_new && !isDoctor && test.test_price > 0) {
          try {
            await labAPI.upsertCatalogItem({
              test_name: test.test_name,
              price: test.test_price,
              unit_id: test.unit_id,
              is_auto_created: true
            });
          } catch (e: any) {
            console.warn('⚠️ Auto-Indexing failed - schema may be outdated', e);
            // We continue even if auto-indexing fails, but check for critical schema error
            if (e.response?.status === 409) {
              throw new Error('Database Schema Error: template_schema column is missing. Please run migrations.');
            }
          }
        }

        return labAPI.createRequest({
          patient_id: patientId,
          test_name: test.test_name,
          test_price: test.test_price,
          unit_id: test.unit_id,
          ...requestData
        });
      });

      await Promise.all(promises);
      toast.success(`${selectedTests.length} investigations queued`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ Batch Initiation Error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to initiate batch';
      toast.error(`Batch Initiation Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white/95 backdrop-blur-md rounded-[3rem] max-w-2xl w-full shadow-[0_32px_128px_rgba(30,41,59,0.15)] border border-white/40 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all duration-500",
              stage === 'Discovery' ? "bg-blue-600 shadow-blue-200" :
              stage === 'Enroll' ? "bg-emerald-600 shadow-emerald-200" : "bg-indigo-600 shadow-indigo-200"
            )}>
              {stage === 'Discovery' ? <Search className="w-7 h-7 text-white" /> :
               stage === 'Enroll' ? <Plus className="w-7 h-7 text-white" /> : <TestTubes className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {stage === 'Discovery' ? 'Initiate Job' : 
                 stage === 'Enroll' ? 'Rapid Enrollment' : 'Diagnostic Protocol'}
              </h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-0.5">
                {stage === 'Discovery' ? 'Stage 1: Subject Discovery' : 
                 stage === 'Enroll' ? 'Stage 1b: Clinical Identity Creation' : 'Stage 2: Parameter Configuration'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300" type="button">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
          {/* STAGE: DISCOVERY */}
          {stage === 'Discovery' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Identify Subject</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Search by Name, ID or Phone..."
                    className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                    value={patientSearchTerm}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                  />
                </div>
              </div>

              {patients.length > 0 ? (
                <div className="space-y-3">
                   {patients.map(p => (
                     <button 
                       key={p.id}
                       onClick={() => { setSelectedPatient(p); setStage('Configure'); }}
                       className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                       type="button"
                     >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 font-black text-blue-600 text-sm">
                            {p.fullName?.[0]}
                          </div>
                          <div className="text-left">
                            <p className="font-black text-gray-900 text-base leading-none mb-1.5">{p.fullName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">#{p.patientId} • {p.mobileNumber}</p>
                          </div>
                        </div>
                        <CheckCircle className="w-6 h-6 text-blue-100 group-hover:text-blue-500 transition-colors" />
                     </button>
                   ))}
                </div>
              ) : patientSearchTerm.length >= 2 && (
                <div className="py-12 px-8 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-[2.25rem] flex items-center justify-center mb-6 shadow-xl shadow-gray-200/50">
                    <User className="w-10 h-10 text-blue-100" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">"{patientSearchTerm}"</h3>
                  <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto mb-10">Subject not found in registry. You can proceed with rapid enrollment or create a full clinical file.</p>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                    <button 
                      onClick={() => {
                          setSelectedPatient({ fullName: patientSearchTerm, isVirtual: true });
                          setStage('Configure');
                      }}
                      className="flex-1 px-8 py-5 bg-gray-900 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 shadow-2xl shadow-gray-200"
                      type="button"
                    >
                      Quick Proceed
                    </button>
                    <button 
                      onClick={() => {
                          setEnrollData(prev => ({ ...prev, fullName: patientSearchTerm }));
                          setStage('Enroll');
                      }}
                      className="flex-1 px-8 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all active:scale-95"
                      type="button"
                    >
                      Full Enrollment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE: ENROLL */}
          {stage === 'Enroll' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Legal Name</label>
                    <input 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-gray-900"
                      value={enrollData.fullName}
                      onChange={e => setEnrollData({...enrollData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Mobile Contact</label>
                    <input 
                      placeholder="+234..."
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-gray-900"
                      value={enrollData.mobileNumber}
                      onChange={e => setEnrollData({...enrollData, mobileNumber: e.target.value})}
                    />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email (Optional)</label>
                    <input 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-gray-900"
                      value={enrollData.emailAddress}
                      onChange={e => setEnrollData({...enrollData, emailAddress: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Biological Sex</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-gray-900 appearance-none"
                      value={enrollData.gender}
                      onChange={e => setEnrollData({...enrollData, gender: e.target.value})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Date of Birth</label>
                  <input 
                    type="date"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-gray-900"
                    value={enrollData.dateOfBirth}
                    onChange={e => setEnrollData({...enrollData, dateOfBirth: e.target.value})}
                  />
               </div>
               <div className="flex gap-4 pt-4">
                  <button onClick={() => setStage('Discovery')} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors" type="button">Discard</button>
                  <button 
                    onClick={handleEnrollPatient}
                    disabled={loading}
                    className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                    type="button"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Create Identity
                  </button>
               </div>
            </div>
          )}

          {/* STAGE: CONFIGURE */}
          {stage === 'Configure' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex items-center justify-between shadow-sm mr-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center font-black text-blue-600 text-xs shadow-sm">
                    {selectedPatient?.fullName?.[0]}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 leading-none">{selectedPatient?.fullName}</p>
                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-1">Ready for assignment</p>
                  </div>
                </div>
                <button onClick={() => setStage('Discovery')} className="text-[10px] font-black uppercase text-blue-600 hover:underline" type="button">Change Subject</button>
              </div>

              <div className="space-y-4 col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 flex justify-between">
                  Protocol Investigation
                  {isNewTest && <span className="text-amber-500 animate-pulse">Auto-Indexed Mode</span>}
                </label>
                <div className="relative">
                  <div className="relative group">
                    <TestTubes className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      placeholder="Search or Type new test..."
                      className="w-full pl-14 pr-48 py-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 shadow-inner"
                      value={testSearchTerm}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTestSearchTerm(val);
                        const match = labCatalog.find(c => c.test_name.toLowerCase() === val.toLowerCase());
                        setIsNewTest(!match && val.length > 0);
                        setShowCatalogSuggestions(val.length > 0);
                      }}
                      onFocus={() => setShowCatalogSuggestions(testSearchTerm.length > 0)}
                    />
                    {isNewTest && (
                      <div className="absolute right-32 top-1/2 -translate-y-1/2 flex items-center gap-2 border-l border-amber-100 pl-4 h-8">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">₦</span>
                        <input 
                          type="number" 
                          placeholder="Fee"
                          required
                          className="w-16 bg-transparent outline-none text-[10px] font-black text-emerald-600 placeholder:text-amber-300"
                          id="manual-test-price"
                        />
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        if (testSearchTerm) {
                          const match = labCatalog.find(c => c.test_name.toLowerCase() === testSearchTerm.toLowerCase());
                          const manualPriceInput = document.getElementById('manual-test-price') as HTMLInputElement;
                          const manualPrice = manualPriceInput ? parseFloat(manualPriceInput.value) : 0;
                          
                          if (!match && (!manualPrice || manualPrice <= 0)) {
                            return toast.error('A diagnostic fee is required for new investigations');
                          }

                          handleAddTest({
                            test_name: match?.test_name || testSearchTerm,
                            test_price: match?.price || manualPrice,
                            unit_id: match?.unit_id || null,
                            is_new: !match
                          });
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                      type="button"
                    >
                      Add Test
                    </button>
                  </div>
                  
                  {showCatalogSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden z-[80] animate-in fade-in slide-in-from-top-2">
                      <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {labCatalog
                          .filter(c => c.test_name.toLowerCase().includes(testSearchTerm.toLowerCase()))
                          .map(c => (
                            <button 
                              key={c.id}
                              onClick={() => {
                                handleAddTest({
                                  test_name: c.test_name,
                                  test_price: c.price,
                                  unit_id: c.unit_id,
                                  is_new: false
                                });
                              }}
                              className="w-full flex items-center justify-between p-5 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                              type="button"
                            >
                              <div>
                                <p className="font-black text-gray-900 text-sm">{c.test_name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{c.unit?.name || 'General'}</p>
                              </div>
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest group-hover:bg-white text-right">₦{c.price.toLocaleString()}</span>
                            </button>
                          ))}
                        
                        {isNewTest && (
                            <button 
                              onClick={() => {
                                const manualPriceInput = document.getElementById('manual-test-price') as HTMLInputElement;
                                const manualPrice = manualPriceInput ? parseFloat(manualPriceInput.value) : 0;
                                if (!manualPrice || manualPrice <= 0) return toast.error('Diagnostic fee required');
                                handleAddTest({ test_name: testSearchTerm, test_price: manualPrice, unit_id: null, is_new: true });
                              }}
                              className="w-full p-4 bg-amber-50/50 border-t border-amber-100 hover:bg-amber-100 transition-colors"
                              type="button"
                            >
                               <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                 <Plus className="w-3 h-3" /> Add Research Investigation: "{testSearchTerm}"
                               </p>
                             </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedTests.length > 0 && (
                <div className="space-y-3 p-6 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Investigation Batch ({selectedTests.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTests.map(t => (
                      <div key={t.test_name} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-white border border-gray-100 rounded-xl shadow-sm group">
                        <span className="text-xs font-black text-gray-700">{t.test_name}</span>
                        <button onClick={() => handleRemoveTest(t.test_name)} className="p-1 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-500 transition-all" type="button">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Priority Level</label>
                  <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100 group">
                    {(['Routine', 'Urgent', 'Stat'] as const).map(p => (
                      <button 
                        key={p}
                        onClick={() => setRequestData({...requestData, priority: p})}
                        type="button"
                        className={cn(
                          "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                          requestData.priority === p ? 
                            (p === 'Stat' ? "bg-rose-500 text-white shadow-lg shadow-rose-100" :
                             p === 'Urgent' ? "bg-amber-500 text-white shadow-lg shadow-amber-100" :
                             "bg-gray-900 text-white shadow-lg shadow-gray-200") : 
                            "text-gray-400 hover:bg-white hover:text-gray-600"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Lab Accession No. (Optional)</label>
                   <input 
                     placeholder="e.g. LAB-2024-001"
                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-gray-900"
                     value={requestData.lab_number}
                     onChange={e => setRequestData({...requestData, lab_number: e.target.value})}
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Requesting Physician</label>
                  <input 
                    placeholder="Enter doctor's name..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-900"
                    value={requestData.requesting_doctor}
                    onChange={e => setRequestData({...requestData, requesting_doctor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Specimen Type</label>
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-gray-900 appearance-none"
                    value={requestData.specimen_type}
                    onChange={e => setRequestData({...requestData, specimen_type: e.target.value})}
                  >
                    <option>Venous Blood</option>
                    <option>Capillary Blood</option>
                    <option>Mid-stream Urine</option>
                    <option>24-hour Urine</option>
                    <option>Nasopharyngeal Swab</option>
                    <option>Saliva</option>
                    <option>Cerebrospinal Fluid</option>
                    <option>Stool</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Clinical Summary / Brief History</label>
                <textarea 
                  rows={2}
                  placeholder="Summary of patient's clinical state or indications..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-gray-700 resize-none"
                  value={requestData.clinical_summary}
                  onChange={e => setRequestData({...requestData, clinical_summary: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Analytical Instructions / Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Standard operating instructions or specific requirements..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-gray-700 resize-none"
                  value={requestData.clinical_notes}
                  onChange={e => setRequestData({...requestData, clinical_notes: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/20 mt-4 overflow-hidden">
                <div className="px-6 py-2">
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">Job Valuation</p>
                  <p className="text-xl font-black text-gray-900">
                    ₦ {selectedTests.reduce((acc, t) => acc + (t.test_price || 0), 0).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={handleSubmitRequest}
                  disabled={loading}
                  type="button"
                  className="bg-gray-900 text-white px-10 py-5 rounded-[1.75rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {isDoctor ? 'Request Investigation' : 'Authorize Job'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
