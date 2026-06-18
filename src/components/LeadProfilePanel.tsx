import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lead, updateLead } from '../lib/db';
import { X, UserCheck, Heart, ArrowUpRight, Wrench, Settings2, Users2, Activity, CalendarDays, Bot, Lightbulb, Package, CreditCard, ShieldAlert, Sparkles, Send, Trash2, Plus, BrainCircuit, ToggleLeft, ToggleRight, CheckSquare, Square, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useData } from '../contexts/DataContext';

export function LeadProfilePanel({ lead, onClose }: { lead: Lead, onClose: () => void }) {
  const { leads, campaigns } = useData();
  const currentLead = leads.find(l => l.id === lead.id) || lead;
  const leadCampaign = campaigns.find(c => c.id === currentLead.campaignId);
  const [activeTab, setActiveTab] = useState<'overview' | 'forms' | 'services' | 'memory'>('overview');

  const [newNeedName, setNewNeedName] = useState("");
  const [newNeedDate, setNewNeedDate] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<Set<string>>(new Set());

  const [newMemoryText, setNewMemoryText] = useState("");
  const [newMemoryType, setNewMemoryType] = useState("Purchase");
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
  
  const [copilotAnalysis, setCopilotAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/copilot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadData: currentLead })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotAnalysis(data);
      } else {
        toast.error("Failed to fetch Copilot analysis");
      }
    } catch (err) {
      toast.error("Error connecting to Copilot AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'memory' && currentLead.copilotEnabled && !copilotAnalysis) {
      fetchAnalysis();
    }
  }, [activeTab, currentLead.copilotEnabled]);

  const handleUpdate = async (updates: Partial<Lead>) => {
    try {
      await updateLead({ ...currentLead, ...updates } as Lead);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
  };

  const scoreColor = (score = 0) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10';
    return 'text-rose-500 bg-rose-500/10';
  };

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 sm:left-auto sm:w-[500px] bg-[var(--bg-color)] z-[100] border-l border-[var(--shadow-dark)] shadow-2xl flex flex-col h-full right-0"
    >
      {/* Header */}
      <div className="p-6 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 rounded-full transition-colors z-50 cursor-pointer">
          <X className="w-4 h-4 pointer-events-none" />
        </button>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent)] text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-[var(--accent)]/30 shrink-0">
            {(currentLead.name || 'L').charAt(0).toUpperCase()}
          </div>
          <div>
            <input 
              type="text"
              value={typeof currentLead.name === 'object' ? String((currentLead.name as any)?.name || 'Lead') : String(currentLead.name)}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              className="text-xl font-black uppercase tracking-tight bg-transparent border-b border-transparent hover:border-black/10 dark:hover:border-white/10 focus:border-black/20 dark:focus:border-white/20 outline-none w-full max-w-[250px]"
            />
            <div className="flex items-center gap-2 mt-1">
              <div className={`flex items-center rounded-md px-1 ${scoreColor(currentLead.leadScore)}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest pl-1">Score:</span>
                <input 
                  type="number"
                  value={currentLead.leadScore || 50}
                  onChange={(e) => handleUpdate({ leadScore: parseInt(e.target.value) || 0 })}
                  className="w-12 bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none px-1 py-0.5 text-center"
                />
              </div>
              <select
                value={currentLead.status}
                onChange={(e) => handleUpdate({ status: e.target.value as any })}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-black/10 dark:bg-white/10 outline-none hover:bg-black/20 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Engaged">Engaged</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
          Intelligence
        </button>
        <button onClick={() => setActiveTab('forms')} className={`flex-1 py-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'forms' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
          Form Data
        </button>
        <button onClick={() => setActiveTab('services')} className={`flex-1 py-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'services' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
          Future Needs
        </button>
        <button onClick={() => setActiveTab('memory')} className={`flex-1 py-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === 'memory' ? 'border-amber-500 text-amber-500' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
          <BrainCircuit className="w-4 h-4" /> Memory
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Buy Probability</span>
                  </div>
                </div>
                <select 
                  value={currentLead.purchaseProbability || 'Medium'} 
                  onChange={(e) => handleUpdate({ purchaseProbability: e.target.value as any })}
                  className="w-full bg-transparent text-lg font-black uppercase border-b border-black/10 dark:border-white/10 outline-none pb-1"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Est. Budget</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-black">₹</span>
                  <input 
                    type="number"
                    value={currentLead.estimatedBudget || 0}
                    onChange={(e) => handleUpdate({ estimatedBudget: parseInt(e.target.value) || 0 })}
                    className="w-full bg-transparent text-lg font-black uppercase border-b border-black/10 dark:border-white/10 outline-none pb-1 ml-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
               <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                 <Settings2 className="w-4 h-4" /> CRM Directives
               </h4>
               <div className="space-y-3">
                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-widest px-1">Engagement Level</label>
                   <select 
                     value={currentLead.interestLevel} 
                     onChange={(e) => handleUpdate({ interestLevel: e.target.value as any })}
                     className="w-full mt-1 bg-white dark:bg-black p-3 rounded-xl text-sm font-bold border border-black/10 dark:border-white/10 outline-none"
                   >
                     <option value="Low">Low - Passive</option>
                     <option value="Medium">Medium - Assessing</option>
                     <option value="High">High - Ready to Buy</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-widest px-1 flex items-center justify-between">
                     <span>Attributed Campaign</span>
                     <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded">Social ROI</span>
                   </label>
                   <div className="w-full mt-1 mb-3 bg-black/[0.03] dark:bg-white/[0.03] p-3 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 border border-black/5 dark:border-white/5">
                     {leadCampaign ? leadCampaign.title : "None (Organic / Direct)"}
                   </div>
                   <label className="text-[10px] font-bold uppercase tracking-widest px-1">Customer Value Score (LTV)</label>
                   <input 
                     type="number"
                     value={currentLead.customerValueScore || 0}
                     onChange={(e) => handleUpdate({ customerValueScore: parseInt(e.target.value) })}
                     className="w-full mt-1 bg-white dark:bg-black p-3 rounded-xl text-sm font-bold border border-black/10 dark:border-white/10 outline-none"
                   />
                 </div>
               </div>
            </div>
            
          </div>
        )}

        {activeTab === 'forms' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 border border-black/10 dark:border-white/10 rounded-3xl text-center space-y-4 bg-black/5 dark:bg-white/5">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-lg text-indigo-500">Collected Form Data</h3>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Data submitted by the customer via public form links.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Form Submissions</h4>
              {(!currentLead.householdMembers || currentLead.householdMembers.length === 0) ? (
                 <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl text-center">
                   <p className="text-xs font-medium text-neutral-500">No form responses collected yet.</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {currentLead.householdMembers.map((member) => (
                       <div key={member.id} className="p-4 border border-black/10 dark:border-white/10 rounded-2xl bg-white dark:bg-black/40 shadow-sm relative group">
                          <button 
                             onClick={() => {
                               const updated = currentLead.householdMembers!.filter(m => m.id !== member.id);
                               handleUpdate({ householdMembers: updated });
                             }}
                             className="absolute top-2 right-2 p-1.5 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="flex justify-between items-start">
                            <div>
                               <h5 className="font-bold text-sm text-[var(--accent)]">{member.name}</h5>
                               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1 block">Context: {member.relation}</span>
                            </div>
                          </div>
                          {member.notes && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl whitespace-pre-wrap">{member.notes}</p>
                          )}
                       </div>
                    ))}
                 </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="grid grid-cols-1 gap-4">
              <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-rose-500 text-white rounded-lg">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">Predicted Replacement</div>
                    <div className="font-bold text-sm">When will they upgrade?</div>
                  </div>
                </div>
                <input 
                  type="date"
                  value={currentLead.predictedReplacementDate || ""}
                  onChange={(e) => handleUpdate({ predictedReplacementDate: e.target.value })}
                  className="w-full bg-white dark:bg-black/50 border border-rose-500/20 p-3 rounded-xl text-sm font-bold outline-none text-rose-600 focus:border-rose-500"
                />
              </div>

              <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Service Scheduler</div>
                    <div className="font-bold text-sm">Next maintenance visit</div>
                  </div>
                </div>
                 <input 
                  type="date"
                  value={currentLead.nextServiceDate || ""}
                  onChange={(e) => handleUpdate({ nextServiceDate: e.target.value })}
                  className="w-full bg-white dark:bg-black/50 border border-emerald-500/20 p-3 rounded-xl text-sm font-bold outline-none text-emerald-600 focus:border-emerald-500"
                />
              </div>

              {/* Dynamic Future Needs */}
              <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> Other Future Needs
                  </h4>
                  {selectedNeeds.size > 0 && (
                    <button 
                      onClick={() => {
                        const remaining = (currentLead.futureNeeds || []).filter(n => !selectedNeeds.has(n.id));
                        handleUpdate({ futureNeeds: remaining });
                        setSelectedNeeds(new Set());
                      }}
                      className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3"/> Delete Selected
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {(currentLead.futureNeeds || []).map(need => (
                    <div key={need.id} className="flex gap-3 items-center bg-white dark:bg-black p-3 rounded-xl border border-black/5">
                      <button onClick={() => {
                        const newSet = new Set(selectedNeeds);
                        if (newSet.has(need.id)) newSet.delete(need.id);
                        else newSet.add(need.id);
                        setSelectedNeeds(newSet);
                      }} className="text-neutral-400 hover:text-indigo-500">
                        {selectedNeeds.has(need.id) ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{need.name}</div>
                        {need.date && need.date.trim() !== "" && <div className="text-xs text-neutral-500 mt-0.5">{new Date(need.date).toLocaleDateString()}</div>}
                      </div>
                    </div>
                  ))}
                  {(!currentLead.futureNeeds || currentLead.futureNeeds.length === 0) && (
                    <div className="text-xs font-medium text-neutral-500 p-3 text-center border border-dashed border-black/10 rounded-xl">
                      No additional future needs tracked.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr,auto,auto] gap-2">
                  <input 
                    type="text" 
                    placeholder="E.g., Daughter's Wedding" 
                    value={newNeedName}
                    onChange={(e) => setNewNeedName(e.target.value)}
                    className="p-3 bg-white dark:bg-black rounded-xl text-sm font-bold border border-black/10 outline-none"
                  />
                  <input 
                    type="date" 
                    value={newNeedDate}
                    onChange={(e) => setNewNeedDate(e.target.value)}
                    className="p-3 bg-white dark:bg-black rounded-xl text-sm font-bold border border-black/10 outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (!newNeedName) return;
                      const newNeed = { id: Date.now().toString(), name: newNeedName, date: newNeedDate };
                      handleUpdate({ futureNeeds: [...(currentLead.futureNeeds || []), newNeed] });
                      setNewNeedName("");
                      setNewNeedDate("");
                    }}
                    className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <div>
                <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" /> AI Copilot Status
                </h3>
                <p className="text-[10px] uppercase font-bold text-amber-600/70 mt-1">Enable auto-recommendations and personalized tracking</p>
              </div>
              <button 
                onClick={() => {
                   handleUpdate({ copilotEnabled: !currentLead.copilotEnabled });
                   if (!currentLead.copilotEnabled && !copilotAnalysis) fetchAnalysis();
                }}
                className={`transition-colors ${currentLead.copilotEnabled ? 'text-amber-500 hover:text-amber-600' : 'text-neutral-400 hover:text-neutral-500'}`}
              >
                {currentLead.copilotEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
              </button>
            </div>

            {currentLead.copilotEnabled && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-900 border border-amber-500/20 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-amber-600 uppercase tracking-tight text-sm">Actionable AI Insights</h3>
                        <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mt-0.5">Real-time strategies based on live data</p>
                      </div>
                    </div>
                    {isAnalyzing && <div className="text-xs font-bold text-amber-500 animate-pulse uppercase tracking-widest">Analyzing...</div>}
                  </div>

                  {copilotAnalysis && !isAnalyzing ? (
                    <div className="grid gap-3 pt-2">
                      {copilotAnalysis.recommendedUpsell && (
                        <div className="p-3 bg-white dark:bg-black/50 rounded-2xl border border-black/5 flex gap-3">
                          <Package className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111] dark:text-[#eee]">Recommended Upsell</h4>
                            <p className="text-xs font-medium text-neutral-500 mt-1">{copilotAnalysis.recommendedUpsell}</p>
                          </div>
                        </div>
                      )}
                      
                      {copilotAnalysis.crossSellBundle && (
                        <div className="p-3 bg-white dark:bg-black/50 rounded-2xl border border-black/5 flex gap-3">
                          <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111] dark:text-[#eee]">Cross-Sell Bundle</h4>
                            <p className="text-xs font-medium text-neutral-500 mt-1">{copilotAnalysis.crossSellBundle}</p>
                          </div>
                        </div>
                      )}
      
                      {copilotAnalysis.objectionHandling && (
                        <div className="p-3 bg-white dark:bg-black/50 rounded-2xl border border-black/5 flex gap-3">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111] dark:text-[#eee]">Objection Handling Strategy</h4>
                            <p className="text-xs font-medium text-neutral-500 mt-1">{copilotAnalysis.objectionHandling}</p>
                          </div>
                        </div>
                      )}

                      {copilotAnalysis.draftMessage && (
                        <div className="p-3 bg-white dark:bg-black/50 rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 flex gap-3">
                          <Send className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Suggested Action</h4>
                            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-1">{copilotAnalysis.draftMessage}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : !isAnalyzing && (
                    <div className="text-xs text-amber-600/80 p-3 italic">Waiting for analysis...</div>
                  )}
                </div>
            )}

            <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Customer Memory
                </h4>
                {selectedMemories.size > 0 && (
                  <button 
                    onClick={() => {
                      const remaining = (currentLead.customerMemory || []).filter(m => !selectedMemories.has(m.id));
                      handleUpdate({ customerMemory: remaining });
                      setSelectedMemories(new Set());
                    }}
                    className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3"/> Delete Selected
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {(currentLead.customerMemory || []).map(memory => (
                  <div key={memory.id} className="flex gap-3 items-center bg-white dark:bg-black p-3 rounded-xl border border-black/5">
                    <button onClick={() => {
                      const newSet = new Set(selectedMemories);
                      if (newSet.has(memory.id)) newSet.delete(memory.id);
                      else newSet.add(memory.id);
                      setSelectedMemories(newSet);
                    }} className="text-neutral-400 hover:text-indigo-500 shrink-0">
                      {selectedMemories.has(memory.id) ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 uppercase tracking-widest mr-2">{memory.type}</span>
                        <span className="text-[var(--text-main)] truncate">{memory.text}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!currentLead.customerMemory || currentLead.customerMemory.length === 0) && (
                  <div className="text-xs font-medium text-neutral-500 p-3 text-center border border-dashed border-black/10 rounded-xl">
                    No contextual memories tracked yet.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[1fr,2fr,auto] gap-2 pt-2">
                <select 
                  value={newMemoryType}
                  onChange={(e) => setNewMemoryType(e.target.value)}
                  className="p-3 bg-white dark:bg-black rounded-xl text-[10px] uppercase tracking-widest font-bold border border-black/10 outline-none"
                >
                  <option value="Purchase">Purchase</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Interest">Interest</option>
                  <option value="Fact">Fact</option>
                </select>
                <input 
                  type="text" 
                  placeholder="E.g., Bought AC in 2021" 
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="p-3 bg-white dark:bg-black rounded-xl text-sm font-bold border border-black/10 outline-none"
                />
                <button 
                  onClick={() => {
                    if (!newMemoryText) return;
                    const newMem = { id: Date.now().toString(), type: newMemoryType, text: newMemoryText };
                    handleUpdate({ customerMemory: [...(currentLead.customerMemory || []), newMem] });
                    setNewMemoryText("");
                  }}
                  className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {currentLead.status !== 'Converted' && currentLead.copilotEnabled ? (
              <div className="p-5 border border-rose-500/20 bg-rose-500/5 rounded-3xl space-y-3">
                 <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> Abandoned Inquiry Recovery
                 </h4>
                 <p className="text-[11px] font-medium text-rose-500/80">Has the lead stopped responding? Trigger a specialized recovery flow.</p>
                 <button 
                   onClick={() => {
                     toast("Smart follow-up sequence triggered!", { icon: "🚀" });
                   }}
                   className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                 >
                   <Send className="w-4 h-4" /> Trigger Recovery Campaign
                 </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
        <a 
          href={`https://wa.me/${(currentLead.mobileNumber || "").replace(/[^\d]/g, '')}`} 
          target="_blank" 
          rel="noreferrer"
          className="w-full flex justify-center items-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
        >
          Message on WhatsApp
        </a>
      </div>
    </motion.div>
  );
}
