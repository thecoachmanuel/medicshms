'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, Activity, ShieldCheck, Clock, 
  ArrowRight, Users, Stethoscope, BriefcaseMedical,
  Stethoscope as DoctorIcon, UserPlus, FileText,
  Edit3, Zap, Mail, Phone, MapPin, Globe, Share2
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { useContent } from '@/hooks/useContent';
import SectionEditorModal from '@/components/cms/SectionEditorModal';
import { use } from 'react';

const ICON_MAP: Record<string, any> = {
  Activity, Heart, UserPlus, Clock, 
  ShieldCheck, Zap, Stethoscope, BriefcaseMedical,
  FileText, Users
};

export default function HomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { settings } = useSettings(slug);
  const { getContent, refresh, loading: contentLoading } = useContent('home', slug);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const hero = getContent('hero');
  const statsContent = getContent('stats');
  const isAdmin = user?.role === 'Admin';
  const emergencyContact = settings?.emergency_contact;

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

  return (
    <div className="space-y-32 relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <EditButton section="hero" />
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={hero.image_url || "/hospital_hero.png"} 
            alt="Modern Hospital" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-left-8 duration-1000">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
              {hero.title || "Compassionate Care, Advanced Technology."}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-500 max-w-4xl leading-relaxed font-medium">
              {hero.description || "We provide world-class medical services with a touch of humanity. Manage your health journey seamlessly with our integrated hospital ecosystem."}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href={`/${slug}/booking`} className="btn-primary py-4 px-10 rounded-2xl text-lg group w-full sm:w-auto text-center">
                {hero.button_primary || "Book Consultation"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {user ? (
                <Link 
                  href={user.role === 'platform_admin' ? '/platform-admin/dashboard' : `/${slug}/${user.role.toLowerCase()}/dashboard`} 
                  className="btn-secondary py-4 px-10 rounded-2xl text-lg border-none hover:bg-gray-100 w-full sm:w-auto text-center"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link href={`/${slug}/login`} className="btn-secondary py-4 px-10 rounded-2xl text-lg border-none hover:bg-gray-100 w-full sm:w-auto text-center">
                  {hero.button_secondary || "Portal Login"}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 shadow-sm"></div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{hero.badge_text || "5000+ Happy Patients"}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-amber-400"></div>
                  ))}
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Top Rated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <EditButton section="stats" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {(Array.isArray(statsContent) ? statsContent : [
            { label: 'Specialist Doctors', value: '150+' },
            { label: 'Patient Recovered', value: '45k+' },
            { label: 'Success Rate', value: '98%' },
            { label: 'Years Experience', value: '25+' },
          ]).map((stat: any, i: number) => {
            const icons = [Stethoscope, Users, ShieldCheck, Clock];
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-all hover:shadow-xl hover:shadow-primary-600/5 group text-center">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Departments Section */}
      <section className="bg-gray-50 py-32 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <EditButton section="departments_intro" />
          {(() => {
            const intro = getContent('departments_intro');
            const list = getContent('departments_list');
            const depts = Array.isArray(list) ? list : [];
            
            return (
              <>
                <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                  <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">{intro.tagline || "Our Departments"}</h2>
                  <h3 className="text-4xl font-black text-gray-900 leading-tight">{intro.title || "Comprehensive Care in Every Specialty"}</h3>
                  <p className="text-gray-500 font-medium">{intro.description || "Equipped with state-of-the-art technology and led by industry experts."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                  <div className="absolute -top-10 right-0">
                    <EditButton section="departments_list" />
                  </div>
                  {depts.map((dept, i) => {
                    const Icon = ICON_MAP[dept.icon_name] || Activity;
                    return (
                      <div key={i} className="p-8 rounded-3xl bg-white border border-gray-100 hover:border-primary-500 transition-all hover:shadow-2xl hover:shadow-primary-600/10 group">
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors">
                          <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-3">{dept.name}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">{dept.desc}</p>
                        <Link href={`/${slug}/services`} className="inline-flex items-center text-xs font-black text-primary-600 uppercase tracking-widest hover:gap-3 transition-all">
                          Learn More <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* Meet Doctors Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-32 relative">
        <EditButton section="doctors_section" />
        {(() => {
          const intro = getContent('doctors_section');
          const list = getContent('doctors_list');
          const doctors = Array.isArray(list) ? list : [];

          return (
            <>
              <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
                <div className="max-w-2xl space-y-4 text-center md:text-left">
                  <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">{intro.tagline || "Our Specialists"}</h2>
                  <h3 className="text-4xl font-black text-gray-900 leading-tight">{intro.title || "Learn from Our Renowned Medical Professionals"}</h3>
                </div>
                <Link href={`/${slug}/services`} className="btn-secondary rounded-2xl font-bold border-none hover:bg-gray-100">
                  {intro.button_text || "View All Doctors"}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                <div className="absolute -top-10 right-0">
                  <EditButton section="doctors_list" />
                </div>
                {doctors.map((doc, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-[3/4] rounded-3xl bg-gray-100 mb-6 overflow-hidden relative shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {doc.image_url ? (
                        <img src={doc.image_url} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <DoctorIcon className="w-20 h-20" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{doc.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doc.role} • {doc.specialty}</p>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-32 relative">
        <EditButton section="cta" />
        {(() => {
          const cta = getContent('cta');
          return (
            <div className="rounded-[3rem] bg-gray-900 py-20 px-8 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400 rounded-full blur-[120px] opacity-10 translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  {cta.title || "Ready to Experience Better Healthcare Management?"}
                </h3>
                <p className="text-lg text-gray-400 leading-relaxed font-medium">
                  {cta.description || "Book your appointment today or explore our portal for seamless record management and care coordination."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link href={`/${slug}/booking`} className="btn-primary py-4 px-12 rounded-2xl text-lg shadow-xl shadow-primary-600/20 w-full sm:w-auto">
                    {cta.button_primary || "Book Visit Now"}
                  </Link>
                  <Link href={`/${slug}/about`} className="text-white font-bold hover:text-primary-500 transition-colors flex items-center gap-2 group">
                    {cta.button_secondary || "Learn About MedicsHMS"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Emergency Contact Floating Button */}
      {emergencyContact && (
        <a 
          href={`tel:${emergencyContact}`}
          className="fixed bottom-8 right-8 z-[60] bg-red-600 text-white p-4 rounded-2xl shadow-2xl shadow-red-600/40 hover:scale-110 hover:bg-red-700 transition-all group flex items-center gap-3 animate-bounce"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div className="pr-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Emergency</p>
            <p className="text-sm font-black leading-none">{emergencyContact}</p>
          </div>
        </a>
      )}

      {/* Editing Modal */}
      {editingSection && (
        <SectionEditorModal 
          pagePath="home"
          sectionKey={editingSection}
          initialContent={getContent(editingSection)}
          onClose={() => setEditingSection(null)}
          onSave={refresh}
        />
      )}
    </div>
  );
}
