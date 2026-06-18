import React, { useEffect, useState } from "react";
import { motion, useAnimation, useMotionValue } from "motion/react";
import { useData } from "../contexts/DataContext";
import { 
  Users, 
  MessageSquare, 
  Box,
  TrendingUp,
  Activity,
  Flame,
  ArrowRight,
  Sparkles,
  BarChart4
} from "lucide-react";
import { cn } from "../lib/utils";

const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { delay: custom * 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }
  })
};

const STAT_CARDS = [
  { id: "leads", title: "Customer Leads", icon: Users, valuePrefix: "", trend: "Growth" },
  { id: "interactions", title: "Total Interactions", icon: MessageSquare, valuePrefix: "", trend: "Rising" },
  { id: "inventory", title: "Active Products", icon: Box, valuePrefix: "", trend: "Optimal" },
];

const MindMapBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0a0a]">
      {/* Dynamic colorful glowing orbs to represent ideas/nodes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-purple-500/20 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }} 
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-emerald-500/20 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ 
          scale: [0.8, 1.1, 0.8],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 30, 0],
          y: [0, 40, 0]
        }} 
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] bg-blue-500/20 rounded-full blur-[100px]"
      />

      {/* Mind map connecting lines and nodes SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 600">
        <defs>
           <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
           </linearGradient>
           <linearGradient id="lineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
           </linearGradient>
        </defs>
        
        {/* Animated Paths */}
        <motion.path d="M200,150 Q400,200 500,350 T700,450" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5"
           initial={{ pathLength: 0, opacity: 0 }}
           animate={{ pathLength: 1, opacity: 1 }}
           transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.path d="M500,350 Q600,100 800,150" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5"
           initial={{ pathLength: 0, opacity: 0 }}
           animate={{ pathLength: 1, opacity: 1 }}
           transition={{ duration: 4, ease: "easeInOut", delay: 1 }}
        />
        <motion.path d="M300,500 Q400,400 500,350 T800,250" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5"
           initial={{ pathLength: 0, opacity: 0 }}
           animate={{ pathLength: 1, opacity: 1 }}
           transition={{ duration: 4, ease: "easeInOut", delay: 1.5 }}
        />
        
        {/* Nodes */}
        {[
          { cx: 200, cy: 150, r: 4, color: "#8b5cf6", delay: 2 },
          { cx: 500, cy: 350, r: 6, color: "#fff", delay: 2.2 },
          { cx: 700, cy: 450, r: 4, color: "#10b981", delay: 2.4 },
          { cx: 800, cy: 150, r: 5, color: "#3b82f6", delay: 2.6 },
          { cx: 300, cy: 500, r: 4, color: "#8b5cf6", delay: 2.8 },
          { cx: 800, cy: 250, r: 4, color: "#10b981", delay: 3.0 },
        ].map((node, i) => (
           <motion.circle 
             key={i} cx={node.cx} cy={node.cy} r={node.r} fill={node.color}
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
             transition={{ duration: 1.5, delay: node.delay, ease: "easeOut" }}
           />
        ))}

        {/* Floating dust particles */}
        {Array.from({ length: 20 }).map((_, i) => (
           <motion.circle 
             key={`dust-${i}`} 
             cx={Math.random() * 1000} 
             cy={Math.random() * 600} 
             r={Math.random() * 1.5 + 0.5} 
             fill="#ffffff"
             initial={{ opacity: 0 }}
             animate={{ 
               opacity: [0, 0.5, 0],
               y: [0, -20, -40] 
             }}
             transition={{ 
               duration: 3 + Math.random() * 4, 
               repeat: Infinity, 
               delay: Math.random() * 5 
             }}
           />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-0" />
    </div>
  );
};

export function HomeView({ setActiveLayer }: { setActiveLayer: (id: string) => void }) {
  const { leads, interactions, inventoryItems } = useData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = {
    leads: leads?.length || 0,
    interactions: interactions?.length || 0,
    inventory: inventoryItems?.length || 0,
  };

  const pendingInteractions = interactions?.filter(i => i.status === "Pending") || [];
  const hotLeads = leads?.filter(l => l.interestLevel === "High" || l.purchaseProbability === "High") || [];

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-[#0a0a0a] font-sans border border-white/5 shadow-2xl">
      <MindMapBackground />

      <div className="relative z-10 flex flex-col w-full h-full overflow-y-auto custom-scrollbar p-4 md:p-14">
        <div className="flex flex-col flex-1 max-w-6xl mx-auto w-full min-h-max">
          
          {/* Daily Priorities Actionable Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
             <motion.button 
                custom={0} initial="hidden" animate="visible" variants={ANIMATION_VARIANTS}
                onClick={() => setActiveLayer("interactions")} /* Assumes navigation */
                className="group p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all text-left"
             >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Pending Interactions ({pendingInteractions.length})
                  </h3>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </div>
                {pendingInteractions.slice(0, 3).map(inter => (
                  <div key={inter.id} className="text-sm text-white/50 mb-2 truncate group-hover:text-white/80 transition-colors">
                    • {inter.leadName}: {inter.message?.slice(0, 30)}...
                  </div>
                ))}
             </motion.button>
             
             <motion.button 
                custom={0} initial="hidden" animate="visible" variants={ANIMATION_VARIANTS}
                onClick={() => setActiveLayer("leads")}
                className="group p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:bg-white/[0.06] hover:border-orange-500/30 transition-all text-left"
             >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Hot Leads ({hotLeads.length})
                  </h3>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-orange-400 transition-colors" />
                </div>
                {hotLeads.slice(0, 3).map(lead => (
                  <div key={lead.id} className="text-sm text-white/50 mb-2 truncate group-hover:text-white/80 transition-colors">
                    • {lead.name} • {lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString()}` : 'Budget TBD'}
                  </div>
                ))}
             </motion.button>
          </section>

          {/* Header */}
          <header className="mb-16">
             <motion.div 
               custom={0} initial="hidden" animate="visible" variants={ANIMATION_VARIANTS}
             >
               <h1 className="text-5xl md:text-6xl font-sans font-semibold tracking-tighter text-white mb-4">
                 Your Retail <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-blue-400">Hub.</span>
               </h1>
               <p className="text-lg text-white/60 max-w-xl font-light">
                 Insights, actions, and growth metrics optimized for high-velocity local retail.
               </p>
             </motion.div>
          </header>

          {/* Elite Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
            {STAT_CARDS.map((stat, idx) => {
              const Icon = stat.icon;
              const value = mounted ? stats[stat.id as keyof typeof stats] : 0;
              return (
                <motion.div
                  key={stat.id}
                  custom={2 + idx} initial="hidden" animate="visible" variants={ANIMATION_VARIANTS}
                  className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 cursor-default"
                >
                  <div className="flex justify-between items-start mb-8 transition-transform duration-500 group-hover:-translate-y-1">
                    <div className="p-3 bg-white/5 rounded-2xl text-white/70 group-hover:text-white group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                       <TrendingUp className="w-3 h-3" /> {stat.trend}
                    </div>
                  </div>
                  <div className="transition-transform duration-500 group-hover:translate-x-1">
                    <h4 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-2 flex items-baseline">
                      <span className="text-white/40 text-2xl mr-1 font-sans">{stat.valuePrefix}</span>
                      {value.toLocaleString()}
                    </h4>
                    <p className="text-sm font-medium text-white/40 tracking-wide">{stat.title}</p>
                  </div>
                  
                  {/* Subtle bottom gradient on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-b-3xl transition-opacity duration-500 pointer-events-none" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


