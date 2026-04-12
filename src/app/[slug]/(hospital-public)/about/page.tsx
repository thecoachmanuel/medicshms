'use client';

import React, { useState } from 'react';
import { 
  Heart, Activity, ShieldCheck, Clock, 
  Target, Eye, Award, Users,
  Zap, ArrowRight, Edit3
} from 'lucide-react';
import Link from 'next/link';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/context/AuthContext';
import SectionEditorModal from '@/components/cms/SectionEditorModal';
import { use } from 'react';

const ICON_MAP: Record<string, any> = {
  Heart, Activity, ShieldCheck, Clock, 
  Target, Eye, Award, Users, Zap
};

export default function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { getContent, refresh, loading: contentLoading } = useContent('about', slug);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const isAdmin = user?.role === 'Admin';

  if (contentLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center animate-pulse">
           <Zap className="w-10 h-10 text-indigo-300" />
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

  const header = getContent('about_header');
  const mission = getContent('mission');
  const vision = getContent('vision');
  const valuesIntro = getContent('values_intro');
  const valuesList = getContent('values_list');

  return (
    <div className="pt-32 pb-32 space-y-32">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <EditButton section="about_header" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">{header.tagline || "Our Story"}</h2>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
              {header.title_part1 || "A Legacy of"} <span className="text-primary-600">{header.title_part2 || "Care and Innovation."}</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed font-medium">
              {header.description || "Founded on the principles of empathy and excellence, MedicsHMS has grown from a local clinic to a premier multi-specialty hospital."}
            </p>
            
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-1">
                <p className="text-4xl font-black text-gray-900">{header.stat1_value || "25+"}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{header.stat1_label || "Years of Excellence"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-gray-900">{header.stat2_value || "500+"}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{header.stat2_label || "Staff Members"}</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gray-100 overflow-hidden shadow-2xl">
              <img 
                src={header.image_url || "/about_hero.png"} 
                alt="Hospital Building" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">National Excellence</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Healthcare Award 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="p-12 rounded-[3rem] bg-primary-600 text-white space-y-6 relative overflow-hidden">
            <EditButton section="mission" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center relative z-10">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-black relative z-10">{mission.title || "Our Mission"}</h3>
            <p className="text-primary-50 leading-relaxed font-medium relative z-10">
              {mission.description || "To provide world-class, affordable healthcare to all through technological innovation, clinical excellence, and deep compassion."}
            </p>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>

          <div className="p-12 rounded-[3rem] bg-gray-900 text-white space-y-6 relative overflow-hidden">
            <EditButton section="vision" />
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center relative z-10">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-black relative z-10">{vision.title || "Our Vision"}</h3>
            <p className="text-gray-400 leading-relaxed font-medium relative z-10">
              {vision.description || "To become the most trusted healthcare partner globally, known for transforming lives through personalized medicine and groundbreaking research."}
            </p>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-gray-50 py-32 relative">
        <EditButton section="values_intro" />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-2xl space-y-4 mb-20">
            <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">{valuesIntro.tagline || "Our Values"}</h2>
            <h3 className="text-4xl font-black text-gray-900 leading-tight">{valuesIntro.title || "The Pillars of MedicsHMS"}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="absolute -top-10 right-0">
               <EditButton section="values_list" />
            </div>
            {(Array.isArray(valuesList) ? valuesList : [
              { title: 'Compassion', desc: 'We treat every patient with dignity and deep empathy.', icon_name: 'Heart' },
              { title: 'Excellence', desc: 'We strive for clinical and operational perfection.', icon_name: 'Zap' },
              { title: 'Innovation', desc: 'Always pushing boundaries in medical technology.', icon_name: 'Activity' },
            ]).map((value, i) => {
              const Icon = ICON_MAP[value.icon_name] || Heart;
              return (
                <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-gray-100 hover:border-primary-200 transition-all hover:shadow-2xl hover:shadow-primary-600/5 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-8 group-hover:bg-primary-600 transition-colors">
                    <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-4">{value.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{value.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Editing Modal */}
      {editingSection && (
        <SectionEditorModal 
          pagePath="about"
          sectionKey={editingSection}
          initialContent={getContent(editingSection)}
          onClose={() => setEditingSection(null)}
          onSave={refresh}
        />
      )}
    </div>
  );
}
