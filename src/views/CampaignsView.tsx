import { useState, useMemo } from "react";
import { Card, CardContent } from "../components/ui/card";
import { 
  Megaphone, Plus, Search, Trash2, Play, Pause, Smartphone, Instagram, 
  MessageCircle, X, AlertTriangle, TrendingUp, IndianRupee, Target, Users, 
  CheckCircle2, UserPlus, ArrowUpRight, Sparkles, Send, Copy, ArrowRight, CornerDownRight, Percent
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../contexts/DataContext";
import { auth } from "../firebase";
import { 
  saveCampaign, deleteCampaign, updateCampaignStatus, addLead, updateLead, Lead, MarketingCampaign 
} from "../lib/db";
import { toast } from "react-hot-toast";

export function CampaignsView() {
  const { campaigns, settings, leads, templates } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  
  // Campaign create state
  const [newCampaign, setNewCampaign] = useState<Partial<MarketingCampaign>>({
    title: "",
    channel: "WhatsApp",
    status: "Active",
    messageTemplate: "",
    budget: 5000,
    targetSegment: "All",
    sentCount: 0
  });

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}
  });

  // Currency helper
  const getCurrencySymbol = (curr?: string) => {
    const c = curr?.toUpperCase() || 'INR';
    if (c === 'INR') return '₹';
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    return '₹';
  };
  const curSym = getCurrencySymbol(settings?.defaultCurrency);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- GLOBAL CAMPAIGN ROI AGGREGATES ---
  const globalBudget = useMemo(() => {
    return campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  }, [campaigns]);

  const campaignLeadsCount = useMemo(() => {
    return leads.filter(l => !!l.campaignId).length;
  }, [leads]);

  const globalCampaignConverted = useMemo(() => {
    return leads.filter(l => !!l.campaignId && l.status === 'Converted');
  }, [leads]);

  const globalCampaignRevenue = useMemo(() => {
    return globalCampaignConverted.reduce((acc, l) => {
      return acc + (l.customerValueScore || l.estimatedBudget || 15000);
    }, 0);
  }, [globalCampaignConverted]);

  const globalCPL = useMemo(() => {
    if (campaignLeadsCount === 0) return 0;
    return globalBudget / campaignLeadsCount;
  }, [globalBudget, campaignLeadsCount]);

  const globalROI = useMemo(() => {
    if (globalBudget === 0) return globalCampaignRevenue > 0 ? 100 : 0;
    return ((globalCampaignRevenue - globalBudget) / globalBudget) * 100;
  }, [globalCampaignRevenue, globalBudget]);

  const overallConversionRate = useMemo(() => {
    if (campaignLeadsCount === 0) return 0;
    return (globalCampaignConverted.length / campaignLeadsCount) * 100;
  }, [campaignLeadsCount, globalCampaignConverted.length]);

  // --- ACTION HANDLERS ---
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.messageTemplate) {
      toast.error("Please fill out Name and Message Template");
      return;
    }
    try {
      await saveCampaign({
        ...newCampaign,
        sentCount: 0,
        status: "Active"
      });
      setIsCreateModalOpen(false);
      setNewCampaign({
        title: "",
        channel: "WhatsApp",
        status: "Active",
        messageTemplate: "",
        budget: 5000,
        targetSegment: "All",
        sentCount: 0
      });
      toast.success("Campaign created with ROI tracking!");
    } catch (err: any) {
      toast.error('Failed to save campaign. ' + (err.message || ''));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    try {
      await updateCampaignStatus(id, newStatus as any);
      toast.success(`Campaign status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error('Failed to update campaign status. ' + (err.message || ''));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Campaign',
      message: 'Are you sure you want to delete this campaign? This action cannot be undone and will detach associated leads.',
      onConfirm: async () => {
        try {
          await deleteCampaign(id);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          if (expandedCampaignId === id) setExpandedCampaignId(null);
          toast.success("Campaign deleted");
        } catch (err: any) {
          toast.error('Failed to delete campaign. ' + (err.message || ''));
        }
      }
    });
  };

  // Broadcast campaign to selected segment
  const handleTriggerBroadcast = async (camp: MarketingCampaign) => {
    const targetSegment = camp.targetSegment || "All";
    
    // Filter existing leads who fit the target criteria
    const targetLeads = leads.filter(l => {
      if (l.status === 'Converted') return false; // ignore already closed
      if (targetSegment === 'All') return true;
      if (targetSegment === 'Hot') return l.interestLevel === 'High' || l.leadScore ? l.leadScore >= 80 : false;
      if (targetSegment === 'Warm') return l.interestLevel === 'Medium' || (l.leadScore && l.leadScore >= 60 && l.leadScore < 80);
      if (targetSegment === 'Cold') return l.interestLevel === 'Low' || (l.leadScore && l.leadScore < 60);
      return true;
    });

    if (targetLeads.length === 0) {
      toast.error(`No prospective leads found in the "${targetSegment}" segment to message!`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Deploy Smart Broadcast',
      message: `You are about to send REAL messages directly to ${targetLeads.length} leads in the "${targetSegment}" segment via ${camp.channel}. Continue?`,
      onConfirm: async () => {
        try {
          // Close dialog early to avoid stale state freeze
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          const toastId = toast.loading(`Targeting ${targetLeads.length} leads via Secure Backend Engine...`);

          const res = await fetch("/api/wa/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               ownerId: auth.currentUser?.uid,
               message: camp.messageTemplate,
               apiKey: settings?.whatsappApiToken,
               phoneId: settings?.whatsappPhoneId,
               customTemplateName: camp.whatsappTemplateName,
               recipients: targetLeads.map(l => ({ 
                  id: l.id, 
                  name: l.name, 
                  mobileNumber: l.mobileNumber,
                  instagramId: l.instagramId
               })),
               method: camp.channel === "Instagram" ? "instagram" : "whatsapp"
            })
          });

          if (!res.ok) {
             const data = await res.json().catch(() => ({}));
             throw new Error(data.error || "Broadcast Engine rejected the request");
          }

          const responseData = await res.json();
          toast.dismiss(toastId);
          
          toast.success(`🚀 Broadcast Campaign Queued! Processing in background.`);
          const newSentCount = (camp.sentCount || 0) + targetLeads.length;
          await saveCampaign({
            ...camp,
            sentCount: newSentCount
          });
        } catch (err: any) {
          toast.error("Fail to sequence broadcast: " + err.message);
        }
      }
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Campaign Performance Hub</h1>
           <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
             Stage 1: Launch Campaigns, Attribute Social Leads, and Measure Marketing ROI
           </p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create High-Impact Campaign
        </button>
      </div>

      {/* GLOBAL ROI METRICS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 neu-flat rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Ad Invested Budget</span>
            <IndianRupee className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{curSym}{globalBudget.toLocaleString()}</h4>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Direct marketing spend</p>
          </div>
        </div>

        <div className="p-6 neu-flat rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Total Campaign Leads</span>
            <Users className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black">{campaignLeadsCount}</h4>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">
              CPL: {curSym}{(campaignLeadsCount > 0 ? (globalBudget / campaignLeadsCount).toFixed(0) : '0')}
            </p>
          </div>
        </div>

        <div className="p-6 neu-flat rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Attributed Revenue</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-600">{curSym}{globalCampaignRevenue.toLocaleString()}</h4>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">
              Sales closed: {globalCampaignConverted.length} ({(overallConversionRate).toFixed(1)}%)
            </p>
          </div>
        </div>

        <div className={`p-6 neu-flat rounded-3xl flex flex-col justify-between border ${globalROI >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Projected Marketing ROI</span>
            <Percent className={`w-5 h-5 ${globalROI >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div>
            <h4 className={`text-2xl font-black ${globalROI >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {globalROI >= 0 ? '+' : ''}{globalROI.toFixed(1)}%
            </h4>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Net profit multiplier</p>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="relative w-full">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
         <input 
           type="text" 
           placeholder="Filter your active marketing campaigns..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full pl-12 pr-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none font-bold text-sm"
         />
      </div>

      {/* CAMPAIGN LIST */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredCampaigns.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="py-12 text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Megaphone className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">No campaigns launched</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                    Launch your first Meta Approved WhatsApp or Instagram campaign to record ROI.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            filteredCampaigns.map((camp, i) => {
              // Dynamic calculated stats for this specific campaign
              const activeLeads = leads.filter(l => l.campaignId === camp.id);
              const activeConverted = activeLeads.filter(l => l.status === 'Converted');
              const activeRevenue = activeConverted.reduce((acc, l) => {
                return acc + (l.customerValueScore || l.estimatedBudget || 15000);
              }, 0);
              const activeCPL = activeLeads.length > 0 ? (camp.budget || 0) / activeLeads.length : 0;
              const activeROI = (camp.budget || 0) > 0 ? ((activeRevenue - (camp.budget || 0)) / (camp.budget || 0)) * 100 : (activeRevenue > 0 ? 100 : 0);
              const isExpanded = expandedCampaignId === camp.id;

              return (
                <motion.div 
                  key={camp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="neu-flat rounded-[2rem] overflow-hidden border border-black/[0.03]"
                >
                  {/* CARD HEADER / MAIN ROW */}
                  <div 
                    onClick={() => setExpandedCampaignId(isExpanded ? null : camp.id)}
                    className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 cursor-pointer hover:bg-black/[0.01] transition-colors"
                  >
                     <div className="flex items-center gap-4 flex-1">
                        <div className={`p-4 rounded-2xl neu-pressed flex-shrink-0 ${camp.channel === 'WhatsApp' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {camp.channel === 'WhatsApp' ? <MessageCircle className="w-6 h-6" /> : <Instagram className="w-6 h-6" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2 flex-wrap">
                             <h3 className="text-lg font-black tracking-tight">{camp.title}</h3>
                             <span className="text-[9px] font-black px-2 py-0.5 rounded bg-black/5 uppercase tracking-wider text-neutral-600">
                               {camp.triggerType || "Manual"}
                             </span>
                           </div>
                           <p className="text-xs font-bold text-neutral-500 line-clamp-1 max-w-sm mt-0.5">{camp.messageTemplate}</p>
                        </div>
                     </div>

                     {/* SUMMARY METRICS IN CARD ROW */}
                     <div className="grid grid-cols-3 gap-6 text-center w-full lg:w-auto pr-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                       <div>
                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Ad Budget</span>
                         <span className="text-xs font-black">{curSym}{(camp.budget || 0).toLocaleString()}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Leads</span>
                         <span className="text-xs font-black text-emerald-600">{activeLeads.length}</span>
                       </div>
                       <div>
                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">ROI</span>
                         <span className={`text-xs font-black ${activeROI >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {activeROI >= 0 ? '+' : ''}{activeROI.toFixed(0)}%
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between w-full lg:w-auto gap-4" onClick={e => e.stopPropagation()}>
                        <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${
                          camp.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 
                          camp.status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {camp.status}
                        </div>

                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleToggleStatus(camp.id, camp.status)} 
                             className={`p-2.5 rounded-xl transition-colors ${camp.status === 'Active' ? 'neu-pressed text-amber-500' : 'neu-flat hover:text-emerald-500'}`}
                             title={camp.status === 'Active' ? "Pause campaign" : "Activate campaign"}
                           >
                             {camp.status === 'Active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                           </button>
                           <button 
                             onClick={(e) => handleDelete(camp.id, e)} 
                             className="p-2.5 neu-flat rounded-xl hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                             title="Delete Campaign"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* EXPANDED CAMPAIGN SANDBOX & DETAILED ROI SECTION */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="border-t border-black/5 bg-black/[0.015] overflow-hidden"
                      >
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* PANEL 1: CAMPAIGN ROI INSIGHTS */}
                          <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-500" /> Campaign ROI Matrix
                            </h4>

                            <div className="p-5 bg-white dark:bg-neutral-900 rounded-3xl border border-black/[0.04] shadow-sm space-y-4">
                              <div className="flex justify-between items-center pb-3 border-b border-black/5">
                                <span className="text-[11px] font-bold text-neutral-500">Audience Segment</span>
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">{camp.targetSegment || "All Prospected"}</span>
                              </div>
                              <div className="flex justify-between items-center pb-3 border-b border-black/5">
                                <span className="text-[11px] font-bold text-neutral-500">WhatsApp Broadcasts Sent</span>
                                <span className="text-xs font-black">{camp.sentCount || 0} msgs</span>
                              </div>
                              <div className="flex justify-between items-center pb-3 border-b border-black/5">
                                <span className="text-[11px] font-bold text-neutral-500">Cost-Per-Lead (CPL)</span>
                                <span className="text-xs font-black text-neutral-800">{curSym}{activeCPL.toFixed(0)}</span>
                              </div>
                              <div className="flex justify-between items-center pb-3 border-b border-black/5">
                                <span className="text-[11px] font-bold text-neutral-500">Sales Conversion Rate</span>
                                <span className="text-xs font-black text-emerald-600">{((activeLeads.length > 0 ? activeConverted.length / activeLeads.length : 0)*100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-neutral-500">Campaign Revenue</span>
                                <span className="text-xs font-black text-emerald-600">{curSym}{activeRevenue.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-900 dark:to-neutral-950 rounded-3xl border border-emerald-500/10 space-y-3">
                              <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Targeted Campaign Actions</h5>
                              <button 
                                onClick={() => handleTriggerBroadcast(camp)}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" /> Deploy Segment-based Broadcast
                              </button>
                            </div>
                          </div>

                          {/* PANEL 2: ATTRIBUTED LEADS ROSTER */}
                          <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                              <Target className="w-4 h-4 text-emerald-500" /> Campaign Roster
                            </h4>

                            <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-black/[0.04] shadow-sm max-h-[300px] overflow-y-auto space-y-4">
                              {activeLeads.length === 0 ? (
                                <div className="py-12 text-center">
                                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">No leads attributed yet!</p>
                                  <p className="text-[9px] text-neutral-500 leading-normal mt-1">Leads acquired from this campaign will appear here.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {activeLeads.map(l => (
                                    <div key={l.id} className="p-3 bg-black/[0.015] rounded-2xl flex flex-col justify-between border border-black/[0.03] space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-[11px] font-black uppercase text-neutral-800">{l.name}</p>
                                          <p className="text-[9px] font-bold text-neutral-400 mt-0.5">{l.mobileNumber}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                          l.status === 'Converted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                          {l.status}
                                        </span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-black/5">
                                        <span className="font-bold text-neutral-500">
                                          Value: {curSym}{(l.customerValueScore || l.estimatedBudget || 0).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 10 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 10 }}
               onClick={e => e.stopPropagation()}
               className="neu-bg w-full max-w-md rounded-[2rem] p-8 shadow-2xl"
            >
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight">New High-Impact Campaign</h3>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-2 neu-flat rounded-full hover:text-rose-500 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <form onSubmit={handleSaveCampaign} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Campaign Name</label>
                     <input 
                       required 
                       value={newCampaign.title || ""} 
                       onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} 
                       type="text" 
                       className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm" 
                       placeholder="e.g. Smart Home Appliance Drive" 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Ad Budget ({curSym})</label>
                         <input 
                           required 
                           value={newCampaign.budget || ""} 
                           onChange={e => setNewCampaign({...newCampaign, budget: parseFloat(e.target.value) || 0})} 
                           type="number" 
                           className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm" 
                           placeholder="e.g. 5000" 
                         />
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Audience Segment</label>
                         <select 
                           value={newCampaign.targetSegment || "All"} 
                           onChange={e => setNewCampaign({...newCampaign, targetSegment: e.target.value as any})} 
                           className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm cursor-pointer"
                         >
                            <option value="All">All prospective leads</option>
                            <option value="Hot">Hot Leads (Score 80+)</option>
                            <option value="Warm">Warm Leads (Score 60-79)</option>
                            <option value="Cold">Cold Leads (Score &lt; 60)</option>
                         </select>
                     </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Trigger Sequence</label>
                      <select 
                        value={newCampaign.triggerType || "Manual"} 
                        onChange={e => setNewCampaign({...newCampaign, triggerType: e.target.value as any})} 
                        className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm cursor-pointer"
                      >
                         <option value="Manual">Manual Broadcast Burst</option>
                         <option value="Service">Predictive Servicing Schedule Reminder</option>
                         <option value="Warranty">Warranty Expiration Alert System</option>
                         <option value="Replacement">Replacement Radar (Upgrade Offer)</option>
                         <option value="Birthday">Birthday Offer Greetings</option>
                         <option value="Festival">Festival Warm Marketing Greetings</option>
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Ad Channel Source</label>
                      <select 
                        value={newCampaign.channel || "WhatsApp"} 
                        onChange={e => setNewCampaign({...newCampaign, channel: e.target.value as any})} 
                        className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm cursor-pointer"
                      >
                         <option value="WhatsApp">WhatsApp</option>
                         <option value="Instagram">Instagram</option>
                      </select>
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Select Internal Template</label>
                      <select 
                        value="" 
                        onChange={e => setNewCampaign({...newCampaign, messageTemplate: e.target.value})} 
                        className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm cursor-pointer border border-indigo-500/20"
                      >
                         <option value="">Start from scratch or pick Meta template</option>
                         {(templates || []).map(t => (
                           <option key={t.id} value={t.content}>{t.name} ({t.category.replace('_', ' ')})</option>
                         ))}
                      </select>
                  </div>

                  {newCampaign.channel === 'WhatsApp' && settings?.whatsappTemplates && settings.whatsappTemplates.length > 0 && (
                     <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Meta Template (Meta Approved)</label>
                         <select 
                           value={newCampaign.metaTemplateId || ""} 
                           onChange={e => {
                             const selectedTplId = e.target.value;
                             const matchedTpl = settings.whatsappTemplates?.find(t => t.id === selectedTplId);
                             setNewCampaign({
                               ...newCampaign, 
                               metaTemplateId: selectedTplId,
                               messageTemplate: matchedTpl ? `[Meta template "${matchedTpl.name}"]: Hello!` : newCampaign.messageTemplate
                             });
                           }} 
                           className="w-full p-4 neu-pressed rounded-2xl border-none outline-none font-bold text-sm cursor-pointer text-emerald-600"
                         >
                            <option value="">No Template (Freeform Message)</option>
                            {settings.whatsappTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} {t.purpose ? `(${t.purpose})` : ''}</option>
                            ))}
                         </select>
                     </div>
                  )}

                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Broadcast Content {newCampaign.metaTemplateId ? '(Fallback/Preview)' : ''}</label>
                     <textarea 
                       required={!newCampaign.metaTemplateId} 
                       value={newCampaign.messageTemplate || ""} 
                       onChange={e => setNewCampaign({...newCampaign, messageTemplate: e.target.value})} 
                       className="w-full h-24 p-4 neu-pressed rounded-2xl border-none outline-none font-medium text-xs resize-none" 
                       placeholder="Hi, you are cordially invited to check out our product catalog which saves you up to 30%..." 
                     />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-4 bg-[var(--accent)] hover:opacity-90 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-[var(--accent)]/30 transition-all mt-4 flex items-center justify-center gap-2 text-xs"
                  >
                     <Plus className="w-4 h-4" /> Deploy Marketing Campaign
                  </button>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          >
             <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="neu-bg w-full max-w-sm rounded-3xl p-6 shadow-2xl"
             >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-rose-500 uppercase tracking-tight flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 p-1 bg-rose-100 rounded-lg" />
                    {confirmDialog.title}
                  </h3>
                  <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="p-2 neu-flat rounded-full hover:text-rose-500 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-medium text-neutral-600 mb-6 leading-relaxed">{confirmDialog.message}</p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 font-bold text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-700 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDialog.onConfirm}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/30 transition"
                  >
                    Initiate Action
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
