'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, User, Mail, Phone, 
  Calendar, CheckCircle, Clock, Trash2, 
  ChevronRight, Search, Filter, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/contact');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // In a real app, this would call an API
    setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
    if (selectedMessage?.id === id) {
      setSelectedMessage({ ...selectedMessage, status: newStatus });
    }
    toast.success(`Message marked as ${newStatus}`);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Contact Messages</h1>
          <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mt-1">Patient & Public Inquiries</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inbox ({messages.length})</span>
            <button onClick={fetchMessages} className="text-primary-600 hover:text-primary-700 transition-colors">
              <Clock className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <MessageSquare className="w-12 h-12 mx-auto opacity-20" />
                <p className="font-bold text-sm">No messages found</p>
              </div>
            ) : (
              messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full text-left p-6 border-b border-gray-50 hover:bg-primary-50/30 transition-all relative group ${selectedMessage?.id === message.id ? 'bg-primary-50/50 border-r-4 border-r-primary-600' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{message.subject || 'General'}</span>
                    <span className="text-[9px] font-bold text-gray-400">{new Date(message.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-black text-gray-900 truncate">{message.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">{message.message}</p>
                  
                  {message.status === 'pending' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-primary-600/20">
                    {selectedMessage.name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedMessage.name}</h2>
                    <p className="text-sm font-bold text-gray-400">{selectedMessage.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                    className="p-2 bg-white text-gray-400 hover:text-primary-600 border border-gray-100 rounded-xl transition-all shadow-sm"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-white text-gray-400 hover:text-red-500 border border-gray-100 rounded-xl transition-all shadow-sm">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-black text-gray-900">{selectedMessage.phone || 'N/A'}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Subject</p>
                    <p className="text-sm font-black text-primary-600">{selectedMessage.subject || 'General Inquiry'}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Received On</p>
                    <p className="text-sm font-black text-gray-900">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedMessage.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                      {selectedMessage.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary-600 rounded-full"></div>
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Message Content</h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed font-medium bg-gray-50 p-8 rounded-[2rem] border border-gray-100 border-dashed italic">
                    "{selectedMessage.message}"
                  </p>
                </div>

                <div className="pt-10 border-t border-gray-100 flex flex-col items-center gap-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Quick Reply via Email</p>
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=RE: ${selectedMessage.subject}`}
                    className="btn-primary px-10 rounded-2xl flex items-center gap-2"
                  >
                    Compose Reply <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-30 grayscale">
              <MessageSquare className="w-24 h-24 text-gray-200" />
              <div>
                <h3 className="text-2xl font-black text-gray-900">Select a Message</h3>
                <p className="text-sm font-bold text-gray-500">Choose a message from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
