'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Bot, Mic, MicOff, X, Send, 
  ListTodo, Bell, Calendar, MessageSquare, 
  Loader2, Trash2, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { speechEngine } from '@/lib/audio/speech-engine';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export default function AIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleVoiceResult = (text: string) => {
    setPrompt(text);
    handleSubmit(text);
  };

  const toggleListening = () => {
    if (status === 'listening') {
      speechEngine.stop();
    } else {
      speechEngine.start(handleVoiceResult, setStatus);
    }
  };

  const handleSubmit = async (text: string = prompt) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setStatus('processing');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        toast.error(data.message || 'AI Engine failed');
      }
    } catch (e) {
      toast.error('Connection to AI Agent failed');
    } finally {
      setStatus('idle');
      setIsTyping(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-50 transition-all duration-500 hover:scale-110 flex items-center justify-center group",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
          status === 'listening' ? "bg-rose-500 animate-pulse" : "bg-slate-900"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl group-hover:blur-2xl transition-all" />
        <Sparkles className="w-7 h-7 text-white relative z-10" />
        
        {/* Wake word indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
      </button>

      {/* Side Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white/90 backdrop-blur-2xl shadow-[-20px_0_80px_-20px_rgba(0,0,0,0.1)] z-[60] transition-all duration-500 transform border-l border-white/50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Medics AI</h3>
                <div className="flex items-center gap-2">
                  <div className={cn(
                     "w-2 h-2 rounded-full",
                     status === 'listening' ? "bg-rose-500 animate-ping" : "bg-emerald-500"
                  )} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {status === 'listening' ? 'Listening...' : status === 'processing' ? 'Thinking...' : 'Ready to help'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Tools */}
          <div className="px-8 py-4 border-b border-gray-50 flex items-center gap-3 overflow-x-auto no-scrollbar">
            {[
              { icon: ListTodo, label: 'Add Task' },
              { icon: Bell, label: 'Brief Alerts' },
              { icon: Calendar, label: 'Today' }
            ].map((tool, i) => (
              <button 
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap hover:bg-white hover:shadow-sm transition-all"
              >
                <tool.icon className="w-3 h-3" />
                {tool.label}
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">I'm listening</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 italic">"Create a task to check vitals for Ward B"</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex flex-col space-y-2",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-slate-900 text-white rounded-tr-none" 
                    : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="p-4 bg-gray-50 rounded-3xl rounded-tl-none border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-8 bg-gray-50/50 border-t border-gray-100">
            <div className="relative group">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={status === 'listening' ? 'Speaking...' : "Ask Medics Anything..."}
                className="w-full pl-6 pr-24 py-5 bg-white border border-gray-100 rounded-3xl shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none font-medium placeholder:text-gray-300 text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300 group/btn",
                    status === 'listening' ? "bg-rose-500 text-white" : "bg-gray-50 text-gray-400 hover:text-indigo-600"
                  )}
                >
                  {status === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => handleSubmit()}
                  disabled={!prompt.trim() || status === 'processing'}
                  className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-widest mt-6">
              AI Powered Hospital Assistant • 100% Unlimited Local Logic
            </p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[55] animate-in fade-in duration-500"
        />
      )}
    </>
  );
}
