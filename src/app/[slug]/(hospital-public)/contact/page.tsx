'use client';

import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, 
  Send, Clock, MessageSquare, 
  CheckCircle, Loader2, Edit3 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useContent } from '@/hooks/useContent';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import SectionEditorModal from '@/components/cms/SectionEditorModal';
import { use } from 'react';

const ICON_MAP: Record<string, any> = {
  Phone, Mail, MapPin, Send, Clock, CheckCircle
};

export default function ContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { settings } = useSettings(slug);
  const { getContent, refresh } = useContent('contact', slug);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const isAdmin = user?.role === 'Admin';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hospital_id: settings?.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const header = getContent('contact_header');
  const info = getContent('contact_info');
  const accessGrid = getContent('quick_access');

  return (
    <div className="pt-32 pb-32 space-y-32">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <EditButton section="contact_header" />
        <div className="max-w-3xl space-y-6">
          <h2 className="text-[10px] font-black uppercase text-primary-600 tracking-[0.3em]">{header.tagline || "Contact Us"}</h2>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
            {header.title_part1 || "We're Here to"} <span className="text-primary-600">{header.title_part2 || "Listen and Care."}</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            {header.description || "Have questions about our services or need to book an appointment? Our team is available 24/7 to assist you."}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 relative">
        <EditButton section="contact_info" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Contact Info Cards */}
          <div className="space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-xl font-black text-gray-900">Phone Support</h4>
              <p className="text-sm text-gray-500">Available 24/7 for appointments and queries.</p>
              <div className="space-y-1">
                <p className="text-lg font-black text-gray-900">{info.phone1 || "+1 (800) 123-4567"}</p>
                <p className="text-lg font-black text-gray-900">{info.phone2 || "+1 (800) 765-4321"}</p>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-xl font-black text-gray-900">Email Us</h4>
              <p className="text-sm text-gray-500">Send us your medical queries or feedback.</p>
              <div className="space-y-1">
                <p className="text-lg font-black text-gray-900">{info.email1 || "care@medicshms.com"}</p>
                <p className="text-lg font-black text-gray-900">{info.email2 || "info@medicshms.com"}</p>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="text-xl font-black text-gray-900">Visit Us</h4>
              <p className="text-sm text-gray-500">Our main campus is located in the heart of NY.</p>
              <p className="text-lg font-black text-gray-900 leading-tight">
                {info.address_line1 || "123 Health Ave, Medical District,"}<br />
                {info.address_line2 || "New York, NY 10001"}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-2xl shadow-gray-200/50">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Send a Message</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Responses within 2 business hours</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (000) 000-0000"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Subject</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium appearance-none cursor-pointer"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    >
                      <option value="">Select Option</option>
                      <option value="Appointment">Appointment Inquiry</option>
                      <option value="Feedback">Feedback/Complaints</option>
                      <option value="General">General Inquiry</option>
                      <option value="Careers">Careers</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Your Message</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-600/10 transition-all font-medium resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button 
                  disabled={loading}
                  className="w-full btn-primary py-5 rounded-2xl text-lg flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-32 relative">
        <EditButton section="quick_access" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Array.isArray(accessGrid) ? accessGrid : [
            { title: 'Emergency Room', meta: 'Open 24/7', icon_name: 'Clock', contact: '+1 (800) 911-0000' },
            { title: 'Appointments', meta: 'Mon - Sat (8am - 8pm)', icon_name: 'CheckCircle', contact: '+1 (800) 123-4567' },
            { title: 'Patient Records', meta: 'Through Portal', icon_name: 'Send', contact: 'portal@medicshms.com' },
          ]).map((item, i) => {
            const Icon = ICON_MAP[item.icon_name] || Send;
            return (
              <div key={i} className="flex items-center gap-6 p-8 rounded-3xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-xl hover:border-primary-100 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <Icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{item.meta}</p>
                  <h5 className="text-xl font-black text-gray-900 mb-1">{item.title}</h5>
                  <p className="text-sm text-gray-500 font-bold">{item.contact}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Editing Modal */}
      {editingSection && (
        <SectionEditorModal 
          pagePath="contact"
          sectionKey={editingSection}
          initialContent={getContent(editingSection)}
          onClose={() => setEditingSection(null)}
          onSave={refresh}
        />
      )}
    </div>
  );
}
