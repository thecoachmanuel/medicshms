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
import AudioVisualizer from './AudioVisualizer';

export default function AIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [prompt, setPrompt] = useState('');
  const transcriptRef = useRef('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleVoiceResult = (text: string) => {
    setPrompt(text);
    transcriptRef.current = text;
  };

  const startLiveConversation = () => {
    setIsLiveMode(true);
    setIsOpen(true);
    setMessages([]);
    setPrompt('');
    transcriptRef.current = '';
    
    // Auto-start listening
    speechEngine.start(handleVoiceResult, (newStatus: any) => {
      setStatus(newStatus);
      if (newStatus === 'idle' && transcriptRef.current.trim()) {
        handleSubmit(transcriptRef.current);
      }
    });
  };

  const toggleListening = () => {
    if (status === 'listening') {
      speechEngine.stop();
      // Manual stop also triggers the idle callback which handles submission
    } else {
      setPrompt('');
      transcriptRef.current = '';
      speechEngine.start(handleVoiceResult, (newStatus: any) => {
        setStatus(newStatus);
        if (newStatus === 'idle' && transcriptRef.current.trim()) {
          handleSubmit(transcriptRef.current);
        }
      });
    }
  };

  const handleSubmit = async (text: string = prompt) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setPrompt('');
    setStatus('processing');
    setIsTyping(true);

    // Initial assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              fullText += json.response;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].text = fullText;
                return newMsgs;
              });
            }
          } catch (e) { }
        }
      }

      // Voice Response after stream finishes
      if (fullText) {
        speechEngine.speak(fullText, () => {
          // Re-trigger listening automatically for live conversation
          if (isLiveMode) {
             toggleListening();
          }
        });
      }

    } catch (e) {
      toast.error('AI Agent failed to stream');
    } finally {
      setStatus('idle');
      setIsTyping(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Trigger - Minimal & Premium */}
      <div 
        className={cn(
          "fixed bottom-8 right-8 flex flex-col items-center gap-4 z-50 transition-all duration-500",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
      >
        <button 
          onClick={startLiveConversation}
          className="bg-slate-900 group relative px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 hover:scale-110 hover:-translate-y-2 transition-all active:scale-95 border border-white/10"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-indigo-500/20 blur-2xl group-hover:blur-3xl transition-all" />
          <div className="relative w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="relative text-[11px] font-black text-white uppercase tracking-[0.3em]">Live Pilot</span>
        </button>
        
        <button 
          onClick={() => { setIsLiveMode(false); setIsOpen(true); }}
          className="w-20 h-20 rounded-full bg-white shadow-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 group"
        >
           <MessageSquare className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </button>
      </div>

      {/* Main Interface Overlay */}
      <div className={cn(
        "fixed z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isLiveMode 
          ? "inset-0 flex items-center justify-center p-6 md:p-12" 
          : cn(
              "inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-[-30px_0_100px_-20px_rgba(0,0,0,0.15)]",
              isOpen ? "translate-x-0" : "translate-x-full"
            )
      )}>
        {/* Background Overlay for Live Mode */}
        {isLiveMode && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-1000 pointer-events-none" />
        )}

        <div className={cn(
          "flex flex-col relative h-full w-full",
          isLiveMode && "max-w-6xl max-h-[900px] bg-white/5 backdrop-blur-2xl rounded-[4rem] border border-white/10 shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
        )}>
          {/* Header - Unified for both modes */}
          <div className={cn(
            "p-10 flex items-center justify-between relative z-10",
            !isLiveMode ? "border-b border-slate-100" : "border-b border-white/5"
          )}>
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500",
                status !== 'idle' ? "bg-indigo-600 scale-110 rotate-12" : "bg-slate-900"
              )}>
                <Sparkles className={cn(
                  "w-8 h-8 text-white transition-all",
                  status !== 'idle' && "animate-pulse"
                )} />
              </div>
              <div>
                <h3 className={cn(
                  "font-black uppercase tracking-[0.2em]",
                  isLiveMode ? "text-white text-3xl" : "text-slate-900 text-xl"
                )}>Medics AI</h3>
                <div className="flex items-center gap-3 mt-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    status === 'listening' ? "bg-rose-500 animate-ping" : status === 'speaking' ? "bg-indigo-400 animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    isLiveMode ? "text-white/40" : "text-slate-400"
                  )}>
                    {status === 'listening' ? 'Listening...' : status === 'speaking' ? 'Speaking...' : status === 'processing' ? 'Thinking...' : 'Active System'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setIsOpen(false); speechEngine.stop(); speechEngine.cancelSpeech(); }}
              className={cn(
                "p-5 rounded-3xl transition-all border",
                isLiveMode 
                  ? "bg-white/5 text-white/30 hover:text-white hover:bg-white/10 border-white/10" 
                  : "bg-slate-50 text-slate-300 hover:text-slate-600 border-slate-100"
              )}
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex flex-col md:flex-row relative z-10 min-h-0">
            {/* Visualizer Focus Area (Live Mode Only) */}
            <div className={cn(
              "flex items-center justify-center transition-all duration-700 overflow-hidden",
              isLiveMode ? "flex-1 min-h-[400px]" : "w-0 h-0 opacity-0"
            )}>
              <div className="w-80 h-80 relative">
                <AudioVisualizer isActive={status === 'listening' || status === 'speaking'} />
              </div>
            </div>

            {/* Conversation/Feed Area */}
            <div className={cn(
              "flex flex-col transition-all duration-700 h-full",
              isLiveMode ? "w-full md:w-[45%] p-10 md:border-l border-white/5" : "flex-1"
            )}>
              {/* Messages Container */}
              <div 
                ref={scrollRef}
                className="flex-1 no-scrollbar space-y-10 p-4 overflow-y-auto"
              >
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 rounded-[3rem] bg-indigo-500/10 flex items-center justify-center shadow-inner">
                      <Mic className="w-12 h-12 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className={cn("font-black uppercase tracking-widest text-lg", isLiveMode ? "text-white" : "text-slate-900")}>Conversation Mode</h4>
                      <p className={cn("text-[11px] uppercase font-bold tracking-[0.2em] mt-3 mx-auto max-w-[200px] leading-relaxed", isLiveMode ? "text-white/30" : "text-slate-400")}>
                        Speak naturally to manage your hospital workspace
                      </p>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col space-y-4",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "max-w-[90%] p-7 rounded-[2.5rem] text-sm font-semibold leading-relaxed shadow-lg transition-all transform hover:scale-[1.02]",
                      msg.role === 'user' 
                        ? "bg-slate-900 text-white rounded-tr-none border border-white/5" 
                        : isLiveMode
                          ? "bg-white/5 text-white rounded-tl-none border border-white/10 backdrop-blur-md"
                          : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-7 rounded-[2.5rem] rounded-tl-none animate-pulse flex items-center gap-3",
                      isLiveMode ? "bg-white/5 border border-white/10" : "bg-indigo-50/50 border border-indigo-100"
                    )}>
                       <div className="flex gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                         <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                         <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feed & Primary Controls */}
              <div className={cn(
                "mt-8 p-8 rounded-[3rem] border transition-all duration-500",
                isLiveMode 
                  ? "bg-white/5 border-white/10 shadow-2xl" 
                  : "bg-slate-50 border-slate-100 m-4"
              )}>
                <div className="flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-3", isLiveMode ? "text-white/20" : "text-slate-400")}>
                      {status === 'listening' ? 'Transcribing Live' : 'Voice Command Feed'}
                    </div>
                    <div className={cn(
                      "text-base font-bold truncate transition-all",
                      isLiveMode ? "text-white" : "text-slate-900"
                    )}>
                      {prompt || "I'm listening..."}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={toggleListening}
                      className={cn(
                        "p-5 rounded-2xl transition-all duration-300 shadow-xl",
                        status === 'listening' ? "bg-rose-500 text-white scale-110 shadow-rose-500/30" : "bg-slate-900 text-white hover:bg-slate-800"
                      )}
                    >
                      {status === 'listening' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    {!isLiveMode && (
                      <button 
                        onClick={() => handleSubmit()}
                        disabled={!prompt.trim() || status === 'processing'}
                        className="p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    )}
                    <button 
                      onClick={() => setIsLiveMode(!isLiveMode)}
                      title={isLiveMode ? "Close Live Session" : "Enter Live Session"}
                      className={cn(
                        "p-5 rounded-2xl transition-all border shadow-lg",
                        isLiveMode 
                          ? "bg-white/10 text-white border-white/10 hover:bg-white/20" 
                          : "bg-white text-slate-400 border-slate-200 hover:text-indigo-600"
                      )}
                    >
                      <Bot className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
