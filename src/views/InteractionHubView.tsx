import { useState, useEffect } from "react";
import {
  Interaction,
  resolveInteraction,
  deleteInteraction,
  updateInteraction,
  getChatbotSettings,
  ChatbotSettings,
} from "../lib/db";
import { useData } from "../contexts/DataContext";
import { whatsappService } from "../services/whatsappService";
import { calculateLeadScore } from "../lib/utils";
import { motion } from "motion/react";
import {
  CheckCircle,
  Clock,
  MessageCircle,
  Info,
  Trash2,
  Search,
  Instagram,
  Zap,
  Ghost,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { toast } from "react-hot-toast";
import { AnimatePresence } from "motion/react";

export function InteractionHubView() {
  const { interactions, leads, templates } = useData();
  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings | null>(null);
  const [filter, setFilter] = useState<
    "All" | "Pending" | "Resolved" | "Potential Buyer" | "Complaint"
  >("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  useEffect(() => {
    getChatbotSettings().then(setChatbotSettings);
  }, []);

  const handleLaunchRecoveryDrip = async (inter: Interaction) => {
    toast.loading("Launching Recovery Drip sequence...", { id: "drip" });
    
    // We send the first message and mark as acknowledged
    const res = await whatsappService.sendMessage({
      to: inter.leadId,
      message: `Hi ${inter.leadName}, still interested in our products? We're here to help!`,
      platform: inter.platform.includes('Instagram') ? 'instagram' : 'whatsapp'
    });

    if (res.success) {
      await resolveInteraction(inter.id, false);
      toast.success("Recovery drip initiated. Conversation moved to 'Acknowledged'.", { id: "drip" });
    } else {
      toast.error("Failed to launch drip: " + res.error, { id: "drip" });
    }
  };

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: true,
  });

  const handleDelete = async (i: Interaction) => {
    if (i.status !== "Resolved") {
      toast.error("Only resolved interactions can be deleted.");
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: "Delete Interaction",
      message:
        "Are you sure you want to permanently delete this resolved interaction?",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteInteraction(i.id);
        } catch (e) {
          // ignore or handle
        }
      },
    });
  };

  const isComplaintMsg = (msg: string) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes("complaint") || lower.includes("issue") || lower.includes("problem") || lower.includes("not working") || lower.includes("broken") || lower.includes("bad") || lower.includes("angry") || lower.includes("frustrat") || lower.includes("terrible") || lower.includes("worst") || lower.includes("sad");
  };

  const filteredInteractions = (interactions || []).filter((i) => {
    const searchTerms = searchQuery
      .toLowerCase()
      .split(" ")
      .filter((term) => term.trim() !== "");
    const searchStr =
      `${typeof i.leadName === "object" ? (i.leadName as any)?.name : i.leadName || ""} ${i.leadId || ""} ${i.message || ""} ${i.platform || ""}`.toLowerCase();
    const matchesSearch =
      searchTerms.length === 0 ||
      searchTerms.every((term) => searchStr.includes(term));

    if (filter === "Potential Buyer") {
      return i.isPotentialBuyer && matchesSearch;
    }
    if (filter === "Complaint") {
      return isComplaintMsg(i.message || i.content) && matchesSearch;
    }
    return (filter === "All" || i.status === filter) && matchesSearch;
  });

  const interactionsByLead = filteredInteractions.reduce((acc, i) => {
    const leadId = String(i.leadId || "unknown");
    const isComp = isComplaintMsg(i.message || i.content);
    if (!acc[leadId]) {
      acc[leadId] = {
        leadId: i.leadId,
        leadName: i.leadName,
        platform: i.platform || i.type,
        isPotentialBuyer: i.isPotentialBuyer,
        isComplaint: isComp,
        interactions: [],
        latestTimestamp: new Date(i.createdAt || i.timestamp).getTime(),
        hasPending: false,
      };
    }
    acc[leadId].interactions.push(i);
    const ts = new Date(i.createdAt || i.timestamp).getTime();
    if (ts > acc[leadId].latestTimestamp) {
      acc[leadId].latestTimestamp = ts;
      // keep the latest name and platform
      acc[leadId].leadName = i.leadName;
      acc[leadId].platform = i.platform || i.type;
      acc[leadId].isPotentialBuyer = i.isPotentialBuyer || acc[leadId].isPotentialBuyer;
    }
    acc[leadId].isComplaint = acc[leadId].isComplaint || isComp;
    if (i.status !== "Resolved") {
      acc[leadId].hasPending = true;
    }
    return acc;
  }, {} as Record<string, {
    leadId: string, 
    leadName: any, 
    platform: string, 
    isPotentialBuyer: boolean, 
    isComplaint: boolean,
    interactions: Interaction[],
    latestTimestamp: number,
    hasPending: boolean
  }>);

  const conversationGroups = Object.values(interactionsByLead).sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  
  const totalPages = Math.ceil(conversationGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = conversationGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteConversation = async (group: any) => {
    if (group.hasPending) {
      toast.error("Please resolve all interactions in this conversation before deleting.");
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: "Delete Conversation",
      message: "Are you sure you want to permanently delete all messages in this conversation?",
      isDestructive: true,
      onConfirm: async () => {
        try {
          for (const i of group.interactions) {
            await deleteInteraction(i.id);
          }
          toast.success("Conversation deleted successfully");
        } catch (e) {
          toast.error("Failed to delete conversation");
        }
      },
    });
  };

  const isExpanded = (leadId: string) => {
    return expandedGroups[leadId] !== false; // defaults to true
  };

  const toggleGroup = (leadId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [leadId]: prev[leadId] === undefined ? false : !prev[leadId]
    }));
  };

  // Calculate real-time stats
  const pendingInteractionsCount = (interactions || []).filter(
    (i) =>
      i.status !== "Resolved",
  ).length;
  const totalLeads = leads?.length || 0;
  const recoveredLeads =
    leads?.filter((l) => l.status === "Converted").length || 0;
  const recoveryRate =
    totalLeads > 0 ? Math.round((recoveredLeads / totalLeads) * 100) : 0;

  const now = Date.now();
  const abandonedInquiries = (interactions || []).filter(
    (i) =>
      i.status !== "Resolved" &&
      now - new Date(i.timestamp || i.createdAt).getTime() >
        24 * 60 * 60 * 1000,
  ).length;

  const revenueSaved =
    leads
      ?.filter((l) => l.status === "Converted")
      .reduce((acc, l) => acc + (l.estimatedBudget || 0), 0) || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">
            Lead Recovery Engine
          </h1>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            Abandoned Inquiry Automation & Lead Intelligence
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-3 neu-pressed rounded-2xl w-full sm:w-64">
            <Search className="w-4 h-4 neu-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full neu-text min-w-0"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Lead Conversion
            </span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-600">
              {recoveryRate}%
            </h4>
            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-wider mt-1">
              Conversion rate
            </p>
          </div>
        </div>

        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Abandoned Inquiries
            </span>
            <Ghost className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-amber-600">
              {abandonedInquiries}
            </h4>
            <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-wider mt-1">
              Inactive {`> 24h`}
            </p>
          </div>
        </div>

        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              Revenue Generated
            </span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-indigo-600">
              ₹
              {revenueSaved >= 1000
                ? (revenueSaved / 1000).toFixed(1) + "k"
                : revenueSaved}
            </h4>
            <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-wider mt-1">
              From automated follow-ups
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 neu-pressed rounded-2xl w-fit">
        {(["All", "Pending", "Resolved", "Potential Buyer", "Complaint"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                filter === f
                  ? "neu-flat text-accent shadow-md shadow-accent/10"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f === "Resolved"
                ? "Converted"
                : f === "Potential Buyer"
                  ? "Potential Buyers"
                  : f === "Complaint"
                    ? "Complaints"
                    : f}
            </button>
          ),
        )}
      </div>      <div className="space-y-4">
        {paginatedGroups.length === 0 ? (
          <div className="text-center py-20 neu-text-muted font-bold uppercase tracking-widest text-xs">
            No active {filter !== "All" ? filter.toLowerCase() : ""}{" "}
            conversations found.
          </div>
        ) : (
          paginatedGroups.map((group) => (
            <motion.div
              key={group.leadId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neu-flat p-6 rounded-3xl flex flex-col gap-4 border-none"
            >
              <div 
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer select-none" 
                onClick={() => toggleGroup(group.leadId)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      group.platform.includes("Instagram")
                        ? "bg-pink-500/10 text-pink-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {group.platform.includes("Instagram") ? (
                      <Instagram className="w-6 h-6" />
                    ) : (
                      <MessageCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-lg tracking-tight uppercase">
                        {typeof group.leadName === "object"
                          ? String((group.leadName as any)?.name || "Visitor")
                          : String(group.leadName || "Visitor")}
                      </h4>
                      <span className="text-[10px] px-3 py-1 rounded-lg bg-black/5 font-black uppercase tracking-widest text-slate-500">
                        {group.platform}
                      </span>
                      {group.isPotentialBuyer && (
                        <span className="text-[10px] px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Potential Buyer
                        </span>
                      )}
                      {group.isComplaint && (
                        <span className="text-[10px] px-3 py-1 rounded-lg bg-red-500/10 text-red-600 font-black uppercase tracking-widest flex items-center gap-1">
                          Complaint
                        </span>
                      )}
                      <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 ${
                        calculateLeadScore(interactions, leads.find(l => l.id === group.leadId) || { id: group.leadId, name: group.leadName }) > 70 
                        ? 'bg-indigo-500/10 text-indigo-600' 
                        : 'bg-black/5 text-slate-500'
                      }`}>
                        Score: {calculateLeadScore(interactions, leads.find(l => l.id === group.leadId) || { id: group.leadId, name: group.leadName })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${!group.hasPending ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
                  >
                    {!group.hasPending ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {!group.hasPending ? "Converted" : "Pending Replies"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(group);
                    }}
                    className="p-2.5 neu-flat-sm text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2.5 neu-flat-sm text-slate-500 rounded-xl hover:bg-slate-50 transition-colors ml-1">
                    {isExpanded(group.leadId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded(group.leadId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="overflow-hidden space-y-4"
                  >
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-200/50">
                      {group.interactions.map((i: Interaction) => (
                        <div key={i.id} className="relative group">
                          <div className="absolute -left-[21px] top-4 w-2 h-2 rounded-full bg-slate-300" />
                          <div className="bg-white/50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 relative group-hover:bg-white/80 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                              <p className="text-sm font-medium leading-relaxed pr-8">
                                {i.message || i.content}
                              </p>
                              <div className="flex flex-col items-end shrink-0 gap-1 opacity-60">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                                   {new Date(i.createdAt || i.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                 </span>
                                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                   {new Date(i.createdAt || i.timestamp).toLocaleDateString()}
                                 </span>
                              </div>
                            </div>
                            
                            {/* Interaction Controls */}
                            <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${i.status === "Resolved" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                 {i.status}
                              </span>
                              
                              {i.status !== "Resolved" && (
                                <div className="flex gap-2">
                                   <button
                                     onClick={async () => {
                                       try {
                                         await resolveInteraction(i.id, false);
                                         toast.success("Interaction acknowledged");
                                       } catch (e: any) {
                                         toast.error("Failed.");
                                       }
                                     }}
                                     className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
                                   >
                                     Acknowledge
                                   </button>
                                </div>
                              )}
                            </div>
                            
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                      {group.platform.includes("WhatsApp") && (
                        <a
                          href={`https://wa.me/${group.leadId?.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" /> Reply on WhatsApp
                        </a>
                      )}
                      {group.platform.includes("Instagram") && (
                        <a
                          href={`https://www.instagram.com/direct/inbox/`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
                        >
                          <Instagram className="w-4 h-4" /> Reply on Instagram
                        </a>
                      )}
                      
                      {group.hasPending && (
                        <button
                          onClick={async () => {
                            try {
                              for (const i of group.interactions) {
                                if (i.status !== "Resolved") {
                                  await resolveInteraction(i.id, false);
                                }
                              }
                              toast.success("All interactions in conversation acknowledged");
                            } catch (e: any) {
                              toast.error("Failed to acknowledge all.");
                            }
                          }}
                          className="px-6 py-3 neu-flat text-slate-600 hover:text-slate-800 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          Acknowledge All
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-3 neu-flat-sm rounded-xl disabled:opacity-50 text-slate-500 hover:text-slate-800 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-3 neu-flat-sm rounded-xl disabled:opacity-50 text-slate-500 hover:text-slate-800 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
      />
    </div>
  );
}
