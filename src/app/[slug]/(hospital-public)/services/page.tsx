'use client';

import React, { useState } from 'react';
import { 
  Heart, Activity, ShieldCheck, Clock, 
  ArrowRight, Users, Stethoscope, BriefcaseMedical,
  Stethoscope as DoctorIcon, UserPlus, FileText,
  Edit3, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/context/AuthContext';
import SectionEditorModal from '@/components/cms/SectionEditorModal';
import { use } from 'react';

const ICON_MAP: Record<string, any> = {
  Activity, Heart, UserPlus, Clock, 
  ShieldCheck, Zap, Stethoscope, BriefcaseMedical,
  FileText, Users
};

export default function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { getContent, refresh, loading: contentLoading } = useContent('services', slug);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const isAdmin = user?.role === 'Admin';

  if (contentLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center animate-pulse">
          <BriefcaseMedical className="w-10 h-10 text-emerald-300" />
        </div>
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-80 bg-gray-50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const EditButton = ({ section }: { section: string }) => {
    if (!isAdmin) return null;
    return (
      <button 
        onClick={() => setEditingSection(section)}
        className="absolute top-4 right-4 z-50 p-2 bg-primary-600 text-white rounded-xl shadow-xl hover:scale-110 transition-all group flex items-center gap-2"
      >
        <Edit3 className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Edit Section</span>
      </button>
    );
  };

  const header = getContent('services_header');
  const servicesList = getContent('services_list');
  const cta = getContent('process_cta');

  return (
    <div className="pt-32 pb-32 space-y-32">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <EditButton section="services_header" />
        <div className="max-w-3xl space-y-6">
          <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">{header.tagline || "Our Services"}</h2>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
            {header.title_part1 || "Advanced Healthcare"} <span className="text-primary-600">{header.title_part2 || "Tailored for You."}</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            {header.description || "We offer a wide range of medical services designed to provide you with the best possible care. From routine check-ups to complex surgical procedures, our team is here for you."}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          <div className="absolute -top-10 right-0">
             <EditButton section="services_list" />
          </div>
          {(Array.isArray(servicesList) ? servicesList : [
            { title: 'General Checkup', desc: 'Regular health screenings and comprehensive physical examinations.', icon_name: 'Activity' },
            { title: 'Cardiology', desc: 'Expert heart care using latest diagnostic and treatment techniques.', icon_name: 'Heart' },
            { title: 'Neurology', desc: 'Specialized treatment for brain, spine, and nervous system disorders.', icon_name: 'Zap' },
          ]).map((service, i) => {
            const Icon = ICON_MAP[service.icon_name] || Activity;
            return (
              <div key={i} className="p-10 rounded-[3rem] bg-white border border-gray-100 hover:border-primary-200 transition-all hover:shadow-2xl hover:shadow-primary-600/5 group">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-8 group-hover:bg-primary-600 transition-colors">
                  <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-xl font-black text-gray-900 mb-4">{service.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium mb-8">
                  {service.desc}
                </p>
                <Link href={`/${slug}/contact`} className="inline-flex items-center text-xs font-black text-primary-600 uppercase tracking-[0.2em] hover:gap-3 transition-all">
                  Book Service <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <EditButton section="process_cta" />
        <div className="bg-gray-900 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="max-w-3xl mx-auto space-y-10 relative z-10">
            <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
              {cta.title || "Experience Seamless Patient Care Journey"}
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href={`/${slug}/contact`} className="btn-primary py-5 px-12 rounded-2xl text-lg shadow-2xl shadow-primary-600/20">
                {cta.button_text || "Get Started Today"}
              </Link>
            </div>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{cta.subtext || "No payment required for booking"}</p>
          </div>
        </div>
      </section>

      {/* Editing Modal */}
      {editingSection && (
        <SectionEditorModal 
          pagePath="services"
          sectionKey={editingSection}
          initialContent={getContent(editingSection)}
          onClose={() => setEditingSection(null)}
          onSave={refresh}
        />
      )}
    </div>
  );
}
