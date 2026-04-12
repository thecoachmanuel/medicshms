'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  vitalsAPI, 
  pharmacyAPI, 
  labAPI, 
  radiologyAPI, 
  appointmentsAPI,
  patientAPI 
} from '@/lib/api';
import { 
  History,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  Waves,
  Thermometer,
  Wind,
  Gauge,
  Scale,
  Ruler,
  Dna,
  FileSearch,
  Eye,
  MoreVertical,
  ArrowRight,
  Info,
  Activity,
  CheckCircle2,
  Calendar,
  Microscope,
  Pill,
  FileText,
  Download,
  ChevronRight,
  X,
  ImageIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineEvent {
  id: string;
  type: 'Vitals' | 'Prescription' | 'Laboratory' | 'Radiology' | 'Appointment';
  title: string;
  date: string;
  status: string;
  details: any;
  clinician?: string;
}

export default function PatientTimeline({ patientId }: { patientId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        vitalsAPI.getPatientVitals(patientId),
        pharmacyAPI.getPrescriptions({ patientId }),
        labAPI.getRequests({ patientId }),
        radiologyAPI.getRequests({ patientId }),
        appointmentsAPI.getAll({ patientId }),
        patientAPI.getById(patientId)
      ]);

      const [
        vitalsRes, 
        pharmacyRes, 
        labRes, 
        radiologyRes, 
        appointmentsRes,
        patientRes
      ] = results;

      // Set Patient Data if successful
      if (patientRes.status === 'fulfilled') {
        setPatient((patientRes.value as any).data);
      }

      const allEvents: TimelineEvent[] = [];

      // 1. Process Vitals
      if (vitalsRes.status === 'fulfilled' && (vitalsRes.value as any).data) {
        (vitalsRes.value as any).data.forEach((v: any) => {
          allEvents.push({
            id: v._id || v.id,
            type: 'Vitals',
            title: 'Physiological Snapshot',
            date: v.recorded_at,
            status: 'Recorded',
            clinician: v.recorded_by_profile?.name || 'Staff Nurse',
            details: v
          });
        });
      }

      // 2. Process Prescriptions
      if (pharmacyRes.status === 'fulfilled' && (pharmacyRes.value as any).data) {
        (pharmacyRes.value as any).data.forEach((p: any) => {
          allEvents.push({
            id: p.id,
            type: 'Prescription',
            title: p.medications?.length > 1 
              ? `Multi-Drug Regimen (${p.medications.length} items)`
              : `Drug Regimen: ${p.medications?.[0]?.item_name || 'Pharmacotherapy'}`,
            date: p.prescribed_at,
            status: p.status,
            clinician: p.doctor?.profile?.name || 'Authorized Physician',
            details: p
          });
        });
      }

      // 3. Process Labs
      if (labRes.status === 'fulfilled' && (labRes.value as any).data) {
        (labRes.value as any).data.forEach((l: any) => {
          allEvents.push({
            id: l.id,
            type: 'Laboratory',
            title: `Investigation: ${l.test_name}`,
            date: l.requested_at,
            status: l.status,
            clinician: l.handled_by_profile?.name || 'Lab Scientist',
            details: l
          });
        });
      }

      // 4. Process Radiology
      if (radiologyRes.status === 'fulfilled' && (radiologyRes.value as any).data) {
        (radiologyRes.value as any).data.forEach((r: any) => {
          allEvents.push({
            id: r.id,
            type: 'Radiology',
            title: `Imaging Protocol: ${r.test_name}`,
            date: r.requested_at,
            status: r.status,
            clinician: r.handled_by_profile?.name || 'Radiologist',
            details: r
          });
        });
      }

      // 5. Process Appointments
      if (appointmentsRes.status === 'fulfilled' && (appointmentsRes.value as any).data) {
        (appointmentsRes.value as any).data.forEach((a: any) => {
          allEvents.push({
            id: a._id || a.id,
            type: 'Appointment',
            title: `Clinical Encounter: ${a.department || 'General Medicine'}`,
            date: a.appointmentDate + 'T' + (a.appointmentTime || '00:00:00'),
            status: a.appointmentStatus,
            clinician: a.doctorAssigned?.user?.name || 'Staff Physician',
            details: a
          });
        });
      }

      // Sort by date descending
      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(allEvents);
    } catch (err) {
      console.error('EMR Aggregation Error:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const filteredEvents = filter === 'All' ? events : events.filter(e => e.type === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center mb-6">
           <History className="w-10 h-10 text-indigo-200 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Synchronizing Clinical Intelligence...</p>
      </div>
    );
  }

  const getLatestVitals = () => {
    const vitalsCards = events.filter(e => e.type === 'Vitals');
    return vitalsCards[0]?.details || null;
  };

  const latestVitals = getLatestVitals();

  const MetricBadge = ({ icon: Icon, label, value, unit, color }: any) => (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm transition-all hover:bg-white hover:shadow-md group">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-gray-900 tracking-tight">{value} <span className="text-[10px] text-gray-400 font-bold">{unit}</span></p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Clinical Intelligence Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in slide-in-from-top-4 duration-700">
        <MetricBadge icon={Activity} label="BP" value={latestVitals?.blood_pressure || '--'} unit="mmHg" color="bg-rose-50 text-rose-600" />
        <MetricBadge icon={Thermometer} label="TEMP" value={latestVitals?.temperature || '--'} unit="°C" color="bg-amber-50 text-amber-600" />
        <MetricBadge icon={HeartPulse} label="HR" value={latestVitals?.heart_rate || '--'} unit="BPM" color="bg-emerald-50 text-emerald-600" />
        <MetricBadge icon={Waves} label="SPO2" value={latestVitals?.spo2 || '--'} unit="%" color="bg-blue-50 text-blue-600" />
        <MetricBadge icon={Scale} label="WEIGHT" value={latestVitals?.weight || '--'} unit="KG" color="bg-indigo-50 text-indigo-600" />
        <MetricBadge icon={ClipboardList} label="VISITS" value={events.filter(e => e.type === 'Appointment' && e.status === 'Completed').length} unit="TOTAL" color="bg-gray-100 text-gray-900" />
      </div>

      {/* Patient Header (Simplified redundant profile) */}
      {patient && (
        <div className="relative group overflow-hidden bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/10 transition-all hover:scale-[1.01] duration-500">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row gap-8 items-center">
            <div className="w-28 h-28 rounded-[2.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner font-black text-4xl text-white">
              {patient.fullName?.[0]}
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase">{patient.fullName}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mt-1">Holistic 360 Clinical Intelligence</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/80 border border-white/10 shadow-sm transition-colors hover:bg-white/20">ID: {patient.patientId || 'N/A'}</span>
                <span className="px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-sm transition-colors hover:bg-white/20">{patient.gender} • {patient.dateOfBirth}</span>
                {patient.bloodGroup && (
                  <span className="px-4 py-1.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/30">Blood Group: {patient.bloodGroup}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
               <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95 group/export">
                <Download className="w-5 h-5 transition-transform group-hover/export:-translate-y-1" /> Export Archival EMR
               </button>
               <div className="px-8 py-3 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Status:</span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active File</span>
                  </span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar no-scrollbar">
        {['All', 'Vitals', 'Prescription', 'Laboratory', 'Radiology', 'Appointment'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              filter === type 
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200 border-gray-900" 
                : "bg-white/70 backdrop-blur-md text-gray-400 border-white hover:bg-white"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-100 via-gray-100 to-transparent -translate-x-1/2 -z-10" />

        <div className="space-y-12">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 opacity-30">
               <ClipboardList className="w-12 h-12 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">No longitudinal records found</p>
            </div>
          ) : filteredEvents.map((event, idx) => (
            <div key={event.id} className={cn(
              "relative flex flex-col md:flex-row items-start md:items-center gap-8 group",
              idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            )}>
              {/* Icon Node */}
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-white border-4 border-gray-50 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 z-10">
                {event.type === 'Vitals' && <HeartPulse className="w-5 h-5 text-emerald-500" />}
                {event.type === 'Prescription' && <Pill className="w-5 h-5 text-amber-500" />}
                {event.type === 'Laboratory' && <Microscope className="w-5 h-5 text-indigo-500" />}
                {event.type === 'Radiology' && <ImageIcon className="w-5 h-5 text-violet-500" />}
                {event.type === 'Appointment' && <Calendar className="w-5 h-5 text-blue-500" />}
              </div>

              {/* Content Card */}
              <div className="ml-16 md:ml-0 md:w-[45%]">
                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white hover:border-indigo-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 duration-500 relative overflow-hidden">
                   {/* Background Decor */}
                   <div className={cn(
                     "absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8",
                     event.type === 'Vitals' && "text-emerald-600",
                     event.type === 'Prescription' && "text-amber-600",
                     event.type === 'Laboratory' && "text-indigo-600",
                     event.type === 'Radiology' && "text-violet-600",
                     event.type === 'Appointment' && "text-blue-600"
                   )}>
                      {event.type === 'Vitals' && <Activity className="w-full h-full" />}
                      {event.type === 'Prescription' && <Pill className="w-full h-full" />}
                      {event.type === 'Laboratory' && <Microscope className="w-full h-full" />}
                    </div>

                   <div className="flex justify-between items-start mb-6">
                      <span className={cn(
                        "px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        event.type === 'Vitals' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                        event.type === 'Prescription' && "bg-amber-50 text-amber-600 border-amber-100",
                        event.type === 'Laboratory' && "bg-indigo-50 text-indigo-600 border-indigo-100",
                        event.type === 'Radiology' && "bg-violet-50 text-violet-600 border-violet-100",
                        event.type === 'Appointment' && "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {event.type}
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                   </div>

                   <h3 className="font-black text-gray-900 text-lg uppercase leading-tight mb-2 truncate group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                   <div className="flex items-center gap-2 mb-6">
                      <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{event.clinician}</p>
                   </div>
                   <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                      {event.type === 'Vitals' && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                           {[
                             { icon: Activity, label: 'BP', value: event.details.blood_pressure, unit: 'mmHg' },
                             { icon: HeartPulse, label: 'Pulse', value: event.details.heart_rate, unit: 'BPM' },
                             { icon: Thermometer, label: 'Temp', value: event.details.temperature, unit: '°C' },
                             { icon: Waves, label: 'SpO2', value: event.details.spo2, unit: '%' }
                           ].map((m, i) => (
                             <div key={i} className="flex flex-col items-center p-2 bg-white rounded-xl shadow-sm border border-gray-50">
                                <m.icon className="w-3.5 h-3.5 text-gray-300 mb-1" />
                                <span className="text-[10px] font-black text-gray-900 leading-none">{m.value || '--'}</span>
                                <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{m.label}</span>
                             </div>
                           ))}
                        </div>
                      )}
                      {event.type === 'Laboratory' && (
                        <div className="space-y-3">
                           <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                             <div className="flex items-center gap-2">
                               <Dna className="w-3.5 h-3.5 text-indigo-400" />
                               <span className="text-[9px] font-black text-gray-900 uppercase">Test Metrics</span>
                             </div>
                             <span className="text-[8px] font-black text-emerald-500 uppercase">Result Found</span>
                           </div>
                           <p className="text-[10px] font-bold text-gray-600 leading-relaxed italic truncate">
                             {event.details.results && event.details.results.includes('METRIC_DATA:') 
                               ? 'Diagnostic Informatics Processed. Automated report generated.' 
                               : event.details.results || 'Result Pending Informatics Verification.'}
                           </p>
                        </div>
                      )}
                      {event.type === 'Appointment' && (
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 mb-2">
                              <FileSearch className="w-4 h-4 text-blue-400" />
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Encounter Focus</p>
                           </div>
                           <p className="text-xs font-bold text-gray-700 leading-relaxed line-clamp-2">
                            {event.details.doctor_notes || event.details.reasonForVisit || 'General Clinical Consultation.'}
                           </p>
                        </div>
                      )}
                      {event.type === 'Prescription' && (
                        <div className="space-y-3">
                           <div className="grid grid-cols-1 gap-2">
                             {event.details.medications?.map((m: any, i: number) => (
                               <div key={i} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                 <div>
                                   <p className="text-[10px] font-black text-amber-900 uppercase leading-none mb-1">{m.item_name}</p>
                                   <p className="text-[8px] text-amber-600 font-bold uppercase tracking-widest leading-none">
                                     {m.dosage} • {m.frequency} {m.duration && `• ${m.duration}`}
                                   </p>
                                 </div>
                                 <Pill className="w-3.5 h-3.5 text-amber-300" />
                               </div>
                             ))}
                           </div>
                           {event.details.notes && (
                             <p className="text-[9px] text-gray-400 italic">Note: {event.details.notes}</p>
                           )}
                        </div>
                      )}
                   </div>

                   <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={cn(
                          "w-4 h-4",
                          event.status === 'Completed' || event.status === 'Dispensed' ? "text-emerald-500" : "text-amber-500"
                        )} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{event.status}</span>
                      </div>
                      <button 
                        onClick={() => { setSelectedEvent(event); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center gap-2 group/btn active:scale-95 shadow-sm"
                      >
                        Deep Dive <ArrowRight className="w-3 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )) }
        </div>
      </div>

      {/* Detail Modal Integration */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-[3.5rem] w-full max-w-2xl p-12 shadow-[0_32px_128px_rgba(30,41,59,0.3)] space-y-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-lg",
                    selectedEvent.type === 'Vitals' && "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10",
                    selectedEvent.type === 'Prescription' && "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/10",
                    selectedEvent.type === 'Laboratory' && "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-500/10",
                    selectedEvent.type === 'Radiology' && "bg-violet-50 text-violet-600 border-violet-100 shadow-violet-500/10",
                    selectedEvent.type === 'Appointment' && "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/10"
                  )}>
                    {selectedEvent.type === 'Vitals' && <HeartPulse className="w-8 h-8" />}
                    {selectedEvent.type === 'Prescription' && <Pill className="w-8 h-8" />}
                    {selectedEvent.type === 'Laboratory' && <Microscope className="w-8 h-8" />}
                    {selectedEvent.type === 'Radiology' && <ImageIcon className="w-8 h-8" />}
                    {selectedEvent.type === 'Appointment' && <Calendar className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{selectedEvent.title}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Historical Archival Document</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-gray-50 rounded-2xl text-gray-400 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Encounter Metadadata</p>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">Clinician ID:</span>
                         <span className="text-[10px] font-black text-gray-900 uppercase">{selectedEvent.clinician}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">Timestamp:</span>
                         <span className="text-[10px] font-black text-gray-900 uppercase">{new Date(selectedEvent.date).toLocaleString()}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">Protocol Code:</span>
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">#{selectedEvent.id.slice(-8).toUpperCase()}</span>
                       </div>
                    </div>
                  </div>

                  {selectedEvent.type === 'Laboratory' || selectedEvent.type === 'Radiology' ? (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Diagnostic Informatics</p>
                      <div className="p-6 bg-gray-900 rounded-[2rem] text-white space-y-4 shadow-xl">
                        {selectedEvent.details.results && selectedEvent.details.results.includes('METRIC_DATA:') ? (() => {
                          try {
                            const metrics = JSON.parse(selectedEvent.details.results.split('METRIC_DATA:')[1]);
                            return (
                              <div className="space-y-4">
                                {Array.isArray(metrics) ? metrics.map((m: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-0 last:pb-0">
                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{m.label}</span>
                                    <div className="text-right">
                                      <p className="text-[12px] font-black text-white">{m.value} <span className="text-[9px] text-white/40">{m.unit}</span></p>
                                      {m.referenceRange && <p className="text-[7px] font-bold text-emerald-400 truncate tracking-tighter">REF: {m.referenceRange}</p>}
                                    </div>
                                  </div>
                                )) : Object.entries(metrics).map(([k, v]: any, i) => (
                                  <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-0 last:pb-0">
                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{k}</span>
                                    <p className="text-[12px] font-black text-white italic">{v}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            return <p className="text-xs text-white/60 italic">Error decoding metric informatics.</p>;
                          }
                        })() : (
                          <p className="text-xs text-white leading-relaxed font-medium pb-4 border-b border-white/10">{selectedEvent.details.results || 'No detailed results available.'}</p>
                        )}
                      </div>
                    </div>
                  ) : selectedEvent.type === 'Vitals' ? (
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Full Vitals Panel</p>
                       <div className="grid grid-cols-2 gap-3">
                         {[
                           { label: 'Systolic/Diastolic', value: selectedEvent.details.blood_pressure, unit: 'mmHg' },
                           { label: 'Body Temperature', value: selectedEvent.details.temperature, unit: '°C' },
                           { label: 'Pulse Frequency', value: selectedEvent.details.heart_rate, unit: 'BPM' },
                           { label: 'Oxygen Saturation', value: selectedEvent.details.spo2, unit: '%' },
                           { label: 'Respiratory Rate', value: selectedEvent.details.respiratory_rate, unit: 'insp/m' },
                           { label: 'Body Weight', value: selectedEvent.details.weight, unit: 'KG' },
                           { label: 'Patient Height', value: selectedEvent.details.height, unit: 'CM' },
                           { label: 'BMI Quotient', value: selectedEvent.details.bmi, unit: 'kg/m²' }
                         ].map((v, i) => (
                           <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                             <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">{v.label}</span>
                             <span className="text-[11px] font-black text-gray-900">{v.value || 'N/A'} <span className="text-[8px] text-gray-400">{v.unit}</span></span>
                           </div>
                         ))}
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Clinical Narrative</p>
                      <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 shadow-inner">
                        <p className="text-xs text-indigo-900/80 font-bold leading-relaxed whitespace-pre-wrap">
                          {selectedEvent.details.doctor_notes || selectedEvent.details.findings || selectedEvent.details.prescription || 'Informational EMR entry logged as clinical history.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-10">
                   <div className="space-y-5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Status & Validation</p>
                      <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                         <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                         <div>
                           <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1.5">{selectedEvent.status}</p>
                           <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest opacity-60 italic">Certified by hospital protocol</p>
                         </div>
                      </div>
                   </div>

                    <div className="space-y-5">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Resource Actions</p>
                       <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => window.print()}
                            className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-indigo-200 transition-all hover:bg-indigo-50 group shadow-sm"
                          >
                             <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-white transition-colors"><FileText className="w-5 h-5" /></div>
                                <span className="text-[10px] font-black text-gray-900 uppercase">Export Report PDF</span>
                             </div>
                             <Download className="w-4 h-4 text-gray-300" />
                          </button>
                          <button 
                            onClick={() => {
                              const url = selectedEvent.details.file_url || selectedEvent.details.dicom_url;
                              if (url) {
                                window.open(url, '_blank');
                              } else {
                                toast.error('No specialized attachments found for this artifact.');
                              }
                            }}
                            className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-violet-200 transition-all hover:bg-violet-50 group shadow-sm"
                          >
                             <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-violet-50 rounded-xl text-violet-600 group-hover:bg-white transition-colors"><ImageIcon className="w-5 h-5" /></div>
                                <span className="text-[10px] font-black text-gray-900 uppercase">View Specialized Attachments</span>
                             </div>
                             <ChevronRight className="w-4 h-4 text-gray-300" />
                          </button>
                         <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="flex gap-4 items-start">
                               <Info className="w-5 h-5 text-gray-300 mt-1" />
                               <p className="text-[9px] text-gray-400 font-bold leading-relaxed uppercase tracking-tighter italic">This historical clinical artifact is read-only. Modifications require administrative escalation protocols.</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
