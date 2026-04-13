'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, Zap, Clock, TrendingDown, 
  MessageSquare, ChevronRight, Activity, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QueueAssistant({ queueData }: { queueData: any[] }) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate AI Processing of Queue Data
    const generateInsights = () => {
      setLoading(true);
      setTimeout(() => {
        const totalPatients = queueData.length;
        const triagedCount = queueData.filter(p => p.appointmentStatus === 'Triaged').length;
        const urgentCount = queueData.filter(p => p.priority === 'Urgent' || p.priority === 'Stat').length;
        
        let avgWait = 0;
        if (totalPatients > 0) {
           avgWait = Math.round(queueData.reduce((sum, p) => {
             const wait = (new Date().getTime() - new Date(p.arrived_at || p.triaged_at).getTime()) / 60000;
             return sum + wait;
           }, 0) / totalPatients);
        }

        const recommendations = [];
        if (urgentCount > 0) {
           recommendations.push({
             type: 'priority',
             text: `Priority override recommended for ${urgentCount} patient(s) in the queue.`,
             icon: Zap
           });
        }
        
        if (avgWait > 30) {
           recommendations.push({
             type: 'warning',
             text: 'Queue length is exceeding standards. Consider expedited triage for routine cases.',
             icon: Clock
           });
        }

        if (triagedCount / totalPatients < 0.3 && totalPatients > 5) {
           recommendations.push({
             type: 'bottleneck',
             text: 'Primary bottleneck detected at Triage. Nurse assistance may be required.',
             icon: Activity
           });
        }

        setInsight({
          sentiment: avgWait < 20 ? 'Efficient' : 'Congested',
          prediction: `Next intake estimated in ${Math.max(2, 10 - triagedCount)} mins`,
          recommendations: recommendations.length > 0 ? recommendations : [{ type: 'info', text: 'Queue is flowing optimally. Maintain current consultation pace.', icon: TrendingDown }]
        });
        setLoading(false);
      }, 1500);
    };

    generateInsights();
  }, [queueData]);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] -mr-20 -mt-20 opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500 rounded-full blur-[60px] -ml-16 -mb-16 opacity-10 group-hover:opacity-20 transition-opacity duration-1000" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Clinical AI Assistant</h3>
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Queue Intelligence Active</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
           <div className={cn("w-1.5 h-1.5 rounded-full", loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
           <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">{loading ? 'Analyzing' : 'Ready'}</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Flow Status</p>
              <p className="text-lg font-black text-white">{loading ? '...' : insight?.sentiment}</p>
           </div>
           <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Next Slot Est.</p>
              <p className="text-lg font-black text-emerald-400">{loading ? '...' : insight?.prediction}</p>
           </div>
        </div>

        <div className="space-y-3">
           <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] px-2 flex items-center gap-2 text-center after:content-[''] after:h-[1px] after:flex-1 after:bg-white/10">
              Insights & Intelligence
           </p>
           
           <div className="space-y-2">
              {loading ? (
                 <div className="py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Sparkles className="w-5 h-5 text-indigo-400 mx-auto animate-pulse" />
                 </div>
              ) : (
                insight?.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group/rec">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <rec.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-[10px] font-medium text-white/80 leading-relaxed uppercase tracking-tight max-w-[180px]">
                        {rec.text}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover/rec:translate-x-1 group-hover/rec:text-white transition-all" />
                  </div>
                ))
              )}
           </div>
        </div>

        <button className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2">
           <MessageSquare className="w-4 h-4" />
           Discuss Protocol
        </button>
      </div>
    </div>
  );
}
