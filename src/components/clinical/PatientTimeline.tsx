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
  Activity, 
  Pill, 
  Microscope, 
  ImageIcon, 
  Calendar, 
  User, 
  Clock, 
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  ArrowUpDown,
  History,
  HeartPulse,
  Stethoscope,
  ClipboardList
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

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const [
        vitalsRes, 
        pharmacyRes, 
        labRes, 
        radiologyRes, 
        appointmentsRes,
        patientData
      ] = await Promise.all([
        vitalsAPI.getPatientVitals(patientId),
        pharmacyAPI.getPrescriptions({ patientId }),
        labAPI.getRequests({ patientId }),
        radiologyAPI.getRequests({ patientId }),
        appointmentsAPI.getAll({ patientId }),
        patientAPI.getById(patientId)
      ]) as any;

      setPatient(patientData.data);

      const allEvents: TimelineEvent[] = [];

      // 1. Process Vitals
      (vitalsRes.data || []).forEach((v: any) => {
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

      // 2. Process Prescriptions
      (pharmacyRes.data || []).forEach((p: any) => {
        allEvents.push({
          id: p.id,
          type: 'Prescription',
          title: `Drug Regimen: ${p.medications?.[0]?.item_name || 'Pharmacotherapy'}`,
          date: p.prescribed_at,
          status: p.status,
          clinician: p.doctor_profile?.name || 'Authorized Physician',
          details: p
        });
      });

      // 3. Process Labs
      (labRes.data || []).forEach((l: any) => {
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

      // 4. Process Radiology
      (radiologyRes.data || []).forEach((r: any) => {
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

      // 5. Process Appointments
      (appointmentsRes.data || []).forEach((a: any) => {
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
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <History className="w-12 h-12 text-gray-200 mb-4 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Synchronizing Longitudinal Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Patient Header */}
      {patient && (
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 shadow-sm font-black text-3xl text-indigo-600">
            {patient.fullName?.[0]}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{patient.fullName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">ID: {patient.patientId || 'N/A'}</span>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">{patient.gender} • {patient.dateOfBirth}</span>
              {patient.bloodGroup && (
                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">B.Group: {patient.bloodGroup}</span>
              )}
            </div>
          </div>
          <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95">
            <Download className="w-5 h-5" /> Export EMR
          </button>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Blood Pressure</p>
                             <p className="text-xs font-black text-gray-900">{event.details.blood_pressure || 'N/A'} mmHg</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Temperature</p>
                             <p className="text-xs font-black text-gray-900">{event.details.temperature || 'N/A'} °C</p>
                          </div>
                        </div>
                      )}
                      {(event.type === 'Laboratory' || event.type === 'Radiology') && (
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocol Results</p>
                           <p className="text-xs font-bold text-gray-700 leading-relaxed truncate">{event.details.results || 'Informatics processed. Refer to certified report.'}</p>
                        </div>
                      )}
                      {event.type === 'Prescription' && (
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Regimen Context</p>
                           <p className="text-xs font-bold text-gray-700 leading-relaxed">
                            {event.details.medications?.map((m: any) => m.item_name).join(', ') || 'Medication protocol.'}
                           </p>
                        </div>
                      )}
                      {event.type === 'Appointment' && (
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Primary Concern</p>
                           <p className="text-xs font-bold text-gray-700 leading-relaxed truncate">{event.details.primaryConcern || 'Consultation session.'}</p>
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
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 group/btn">
                        View Details <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                   </div>
                </div>
              </div>

              {/* Time indicator for large screens */}
              <div className="hidden md:flex md:w-[45%] flex-col items-center">
                 {/* This creates the dates on the opposite side to balance the UI */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
