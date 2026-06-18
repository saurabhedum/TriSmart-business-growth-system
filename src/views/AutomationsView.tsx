import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../contexts/DataContext";
import { 
  Bot, Clock, RefreshCw, ShieldAlert, Sparkles, Send, Anchor, Pause, Play, ShoppingCart, Info, TrendingUp, AlertCircle
} from "lucide-react";
import { ChatbotSettings, getChatbotSettings, saveChatbotSettings, Lead } from "../lib/db";
import { toast } from "react-hot-toast";
import { runAutomationHeartbeat } from "../lib/automation";
import { CommandManagerWrapper } from "../components/CommandManager";

import { FormsManager } from "../components/FormsManager";

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  attachment?: { type: string; name: string };
}

function testChatbotCommandClient(msgBody: string, triggerWord: string, btnBase?: string): boolean {
  const msgLower = (msgBody || "").toLowerCase().trim();
  if (!triggerWord && !btnBase) return false;

  if (btnBase) {
    const btnLower = btnBase.toLowerCase().trim();
    if (msgLower === btnLower) return true;

    // Strip emojis
    const btnNoEmoji = btnBase
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}]/gu, "")
      .trim()
      .toLowerCase();
    if (msgLower === btnNoEmoji && btnNoEmoji.length > 3) return true;
  }
  if (!triggerWord) return false;

  if (triggerWord.startsWith("/") && triggerWord.endsWith("/")) {
    try {
      const regex = new RegExp(triggerWord.slice(1, -1), "i");
      return regex.test(msgBody);
    } catch (e) {
      console.warn("Invalid regex in chatbot trigger:", triggerWord);
    }
  }

  const triggers = triggerWord
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t);
  for (const t of triggers) {
    if (msgLower.includes(t)) return true;
  }

  return false;
}

function processDynamicResponseClient(response: string, userCustData: any): string {
  let r = response || "";
  r = r.replace(/{{name}}/gi, userCustData.name || "Customer");
  r = r.replace(/{{balance}}/gi, (userCustData.balance || 0).toString());
  r = r.replace(/{{mobileNumber}}/gi, userCustData.mobileNumber || "N/A");
  r = r.replace(/{{status}}/gi, userCustData.status || "Active");
  r = r.replace(/{{dueDate}}/gi, userCustData.dueDate || "N/A");
  r = r.replace(/{customer_id}/gi, userCustData.id || userCustData.mobileNumber || "CUST-SIM");
  r = r.replace(/{{customer_id}}/gi, userCustData.id || userCustData.mobileNumber || "CUST-SIM");
  return r;
}

export function AutomationsView() {
  const { leads, settings: globalSettings, templates } = useData();
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Simulated WhatsApp Sandbox States
  const [selectedLeadId, setSelectedLeadId] = useState<string>("mock-guest");
  const [simMessage, setSimMessage] = useState("");
  const [isSimTyping, setIsSimTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId === "mock-guest") {
      return {
        id: "CUST-GUEST",
        name: "Guest (New Lead)",
        balance: 500,
        mobileNumber: "9876543210",
        status: "Active",
        dueDate: "24-Jun-2026"
      };
    }
    const realLead = (leads || []).find(l => l.id === selectedLeadId);
    return realLead ? {
      id: realLead.id,
      name: realLead.name,
      balance: realLead.estimatedBudget || 250,
      mobileNumber: realLead.mobileNumber || "N/A",
      status: realLead.status || "Active",
      dueDate: "24-Jun-2026"
    } : {
      id: "CUST-GUEST",
      name: "Guest (New Lead)",
      balance: 1500,
      mobileNumber: "9876543210",
      status: "Active",
      dueDate: "24-Jun-2026"
    };
  }, [selectedLeadId, leads]);

  const handleSimulateSend = (userMsg: string) => {
    if (!userMsg.trim()) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setSimMessage("");
    setIsSimTyping(true);

    setTimeout(() => {
      const msgLower = userMsg.toLowerCase().trim();
      let replyText = settings?.unknownQueryMessage ? processDynamicResponseClient(settings.unknownQueryMessage, selectedLead) : "I'm sorry, I don't understand that command. Type *hi* or *menu* to see all available commands.";
      let matchedAttachment = undefined;
      let handled = false;

      // 1. Check commands
      const userCommands = settings?.commands || [];
      const activeFiltered = userCommands.filter((c: any) => c.isActive);

      // Check custom commands
      for (const cmd of activeFiltered) {
        if (testChatbotCommandClient(userMsg, cmd.triggerWord, cmd.buttonLabel)) {
          replyText = processDynamicResponseClient(cmd.response || "", selectedLead);
          if (cmd.mediaUrl) {
            matchedAttachment = { type: cmd.mediaUrl.endsWith(".png") || cmd.mediaUrl.endsWith(".jpg") ? "image" : "file", name: cmd.mediaName || "Attachment" };
          }
          handled = true;
          break;
        }
      }

      // 2. Check System fallback commands if not handled
      if (!handled) {
        if (
          msgLower === "hi" ||
          msgLower === "hello" ||
          msgLower === "menu" ||
          msgLower === "help"
        ) {
          const cmdListText = activeFiltered
            .map((cmd: any, idx: number) => {
              let emoji = "🔹";
              switch (idx % 6) {
                case 0: emoji = "1️⃣"; break;
                case 1: emoji = "2️⃣"; break;
                case 2: emoji = "3️⃣"; break;
                case 3: emoji = "4️⃣"; break;
                case 4: emoji = "5️⃣"; break;
                case 5: emoji = "6️⃣"; break;
              }
              return `${emoji} *${cmd.triggerWord}* - ${cmd.buttonLabel}`;
            })
            .join("\n");

          replyText = `Hello ${selectedLead.name}! I am your Smart Assistant. How can I help you today?\n\n*Available Commands:*\n${cmdListText || "_No active commands configured._"}`;
          handled = true;
        } else if (
          msgLower === "download bill" ||
          msgLower === "download my bill" ||
          msgLower === "sysdlbill" ||
          msgLower === "system_dl_bill" ||
          msgLower.includes("invoice")
        ) {
          const amt = selectedLead.balance || 0;
          replyText = `Here is your requested Invoice/Bill. Your pending balance is Rs. ${amt}.`;
          matchedAttachment = { type: "file", name: "Invoice.pdf" };
          handled = true;
        } else if (
          msgLower === "pay bill" ||
          msgLower === "system_qr_pay" ||
          msgLower.includes("qr for pay") ||
          msgLower.includes("upi")
        ) {
          replyText = `Scan the QR code to proceed with pay-bill payment of Rs. ${selectedLead.balance || 0}.`;
          matchedAttachment = { type: "image", name: "UP_QR_Code.png" };
          handled = true;
        } else if (
          msgLower === "my bill" ||
          msgLower === "system_bill" ||
          msgLower.includes("see my bill") ||
          msgLower === "bill"
        ) {
          const amt = selectedLead.balance || 0;
          replyText = `Your current bill status is: ${amt > 0 ? "Pending (Rs. ' + amt + ')" : "Paid"}.`;
          handled = true;
        } else if (
          msgLower === "check balance" ||
          msgLower === "system_balance" ||
          msgLower.includes("view balance") ||
          msgLower.includes("balance")
        ) {
          replyText = `You have a total remaining balance of Rs. ${selectedLead.balance || 0}.`;
          handled = true;
        } else if (
          msgLower === "complaint" ||
          msgLower === "complaints" ||
          msgLower === "syscomplaint" ||
          msgLower === "system_complaint" ||
          msgLower.includes("register complaint") ||
          msgLower === "issue"
        ) {
          replyText = `Please describe your complaint or issue. I am logging a service ticket for you.`;
          handled = true;
        }
      }

      const botReply: ChatMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachment: matchedAttachment
      };

      setChatHistory(prev => [...prev, botReply]);
      setIsSimTyping(false);
    }, 700);
  };

  useEffect(() => {
    getChatbotSettings().then(data => {
      const initialSettings = data || {
        autoResponderActive: false,
        welcomeMessage: "",
        handoffMessage: "",
        unknownQueryMessage: "",
        businessHoursOnly: false,
        commands: [],
        aiSalesCopilotEnabled: true,
        salesTone: 'Consultative',
        abandonedInquiryRecovery: true,
        abandonedInquiryDelayMinutes: 60,
        followUpSequenceEnabled: true,
      };
      setSettings(initialSettings);

      const commands = initialSettings.commands || [];
      const activeCmds = commands.filter((c: any) => c.isActive);
      const cmdTriggers = activeCmds.map((c: any) => `*${c.triggerWord}* ("${c.buttonLabel}")`).join(", ");

      setChatHistory([
        {
          id: "welcome-init",
          sender: "bot",
          text: `Hello! Quick Chatbot Assistant Simulator online 🟢.\n\nYour active commands:\n${cmdTriggers ? cmdTriggers : "_No customized command triggers configured yet. Try adding some below!_"}\n\nType any trigger word above (or click buttons if configured) to test live replies in real-time!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await saveChatbotSettings(settings);
    toast.success("Automation definitions saved. System will enforce new rules.");
    setIsSaving(false);
  };

  const handleRunHeartbeat = async () => {
    setIsRunning(true);
    toast.loading("Executing Deep Automation Heartbeat...", { id: "heartbeat" });
    try {
      if(globalSettings) {
         await runAutomationHeartbeat(leads, globalSettings);
      }
      toast.success("CRM Automations Executed.", { id: "heartbeat" });
    } catch(err: any) {
      toast.error(`Heartbeat failed: ${err.message}`, { id: "heartbeat" });
    } finally {
      setIsRunning(false);
    }
  };

  // Metrics
  const activeAbandonedCarts = useMemo(() => {
     if(!settings?.abandonedInquiryRecovery) return 0;
     const cutoff = new Date(Date.now() - (settings.abandonedInquiryDelayMinutes || 60) * 60000);
     return leads.filter(l => 
        (l.status === 'New' || l.status === 'FollowedUp' || l.status === 'Qualified' || l.status === 'Contacted') && 
        l.interestLevel === 'High' && 
        (!l.lastInteractedAt || new Date(l.lastInteractedAt) < cutoff) &&
        !l.inquiryAbandonedDelayTriggered
     ).length;
  }, [leads, settings]);

  const deadLeads = useMemo(() => {
     if(!settings?.followUpSequenceEnabled) return 0;
     const cutoff = new Date(Date.now() - (7 * 24 * 60 * 60000)); // 7 days
     return leads.filter(l => 
       l.status !== 'Converted' && l.status !== 'Blacklisted' && l.status !== 'Archived' &&
       (!l.lastInteractedAt || new Date(l.lastInteractedAt) < cutoff) && 
       !l.reEngagementTriggered
     ).length;
  }, [leads, settings]);

  if (loading || !settings) {
    return <div className="flex-1 flex justify-center items-center h-full"><RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 pt-4">
         <div>
            <h1 className="text-3xl font-black tracking-tight uppercase mb-2 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                <Bot className="w-8 h-8" />
              </div>
              Bot & Automations
            </h1>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest pl-14">
              Real-time responses and automatic follow-ups
            </p>
         </div>

         <div className="flex gap-4">
           <button 
              onClick={handleRunHeartbeat}
              disabled={isRunning || !globalSettings?.whatsappApiToken}
              className="px-6 py-3 neu-flat bg-white dark:bg-black/50 border border-indigo-500/10 text-indigo-500 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors disabled:opacity-50"
           >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? "Running Sequence..." : "Execute Heartbeat"}
           </button>
           <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[var(--accent)]/30 hover:opacity-90 disabled:opacity-50"
           >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              Commit Rules
           </button>
         </div>
      </div>

      {!globalSettings?.whatsappApiToken && (
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-start gap-4">
           <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
           <div>
             <h4 className="text-sm font-black uppercase tracking-wider mb-1">WhatsApp API Not Configured</h4>
             <p className="text-[11px] font-bold opacity-80 leading-relaxed uppercase tracking-wide">Automations require a live Meta WhatsApp Token to push sequences. Configure in Settings (Stage 2) first.</p>
           </div>
        </div>
      )}

      {/* PRIMARY CHATBOT MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
         {/* LEFT COMPONENT: CONFIG AND COMMANDS */}
         <div className="lg:col-span-2 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-[2rem] p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                  <div>
                     <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-[var(--accent)]">
                       Real-Time Chatbot Settings
                     </h2>
                     <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                       Manage instant replies, trigger words, and media links for WhatsApp & Instagram.
                     </p>
                  </div>
                  <label className="relative inline-block w-14 h-7 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10"
                        checked={settings.autoResponderActive || false}
                        onChange={async (e) => {
                          const updated = { ...settings, autoResponderActive: !settings.autoResponderActive };
                          setSettings(updated);
                          await saveChatbotSettings(updated);
                          toast.success(`Chatbot auto-responder is now ${!settings.autoResponderActive ? 'ENABLED' : 'DISABLED'}`);
                        }}
                      />
                      <div className="w-full h-full rounded-full bg-[var(--shadow-dark)] peer-checked:bg-indigo-500 transition-colors shadow-inner" />
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${settings.autoResponderActive ? "translate-x-7" : "translate-x-0"}`} />
                  </label>
               </div>

               <div className={!settings.autoResponderActive ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
  <div className="mb-6">
    <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2">Fallback Message (Unknown Commands)</label>
    <input
      type="text"
      value={settings.unknownQueryMessage || ""}
      placeholder="I'm sorry, I don't understand that command."
      onChange={(e) => {
        const val = e.target.value;
        setSettings({...settings, unknownQueryMessage: val});
      }}
      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 rounded-2xl px-4 py-3 text-xs font-bold outline-none"
    />
    <p className="mt-2 text-[10px] text-[var(--text-muted)]">Available variables: {'{{name}}'}, {'{{balance}}'}, {'{{mobileNumber}}'}, {'{{status}}'}, {'{{dueDate}}'}, {'{{customer_id}}'}, {'{{last_purchase}}'}, {'{{next_service_date}}'}, {'{{loyalty_points}}'}, {'{{referral_link}}'}, {'{{store_name}}'}</p>
  </div>
  <CommandManagerWrapper 
    settings={settings} 
    onUpdate={async (s) => {
      setSettings(s);
      try {
        await saveChatbotSettings(s);
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }} 
    fallbackUI={<div className="font-mono text-xs">Failed to load Command Manager.</div>} 
  />
</div>
            </div>
         </div>

         {/* RIGHT COMPONENT: INTERACTIVE WHATSAPP SIMULATOR */}
         <div className="lg:col-span-1 bg-neutral-950 text-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col border border-white/10" style={{ height: '620px' }}>
            {/* Header / Config selector */}
            <div className="mb-4 space-y-3 pb-3 border-b border-white/10">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sandbox Simulator</span>
                  <div className="flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="font-mono text-[9px] uppercase text-neutral-400">active</span>
                  </div>
               </div>
               
               <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">
                     Simulate Customer Context
                  </label>
                  <select 
                     value={selectedLeadId}
                     onChange={(e) => {
                        const targetId = e.target.value;
                        setSelectedLeadId(targetId);
                        
                        const commands = settings?.commands || [];
                        const activeCmds = commands.filter((c: any) => c.isActive);
                        const cmdListList = activeCmds.map((c: any) => `*${c.triggerWord}*`).join(", ");

                        setChatHistory([
                           {
                              id: "welcome-reset-" + Math.random().toString(),
                              sender: "bot",
                              text: `Switched context to customer! Type any of your configured trigger words: ${cmdListList ? cmdListList : "(no custom trigger words)"} to verify variable replacement in replies.`,
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                           }
                        ]);
                     }}
                     className="w-full bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50"
                  >
                     <option value="mock-guest">🆕 New Visitor (Guest)</option>
                     {(leads || []).map(l => (
                        <option key={l.id} value={l.id}>
                           👤 {l.name} {l.estimatedBudget ? `(Balance: Rs. ${l.estimatedBudget})` : '(No Balance)'}
                        </option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Simulated Smartphone Screen */}
            <div className="flex-1 rounded-2xl bg-neutral-900 overflow-hidden flex flex-col relative border border-white/5">
               {/* Phone header */}
               <div className="bg-neutral-800/80 px-3 py-2.5 border-b border-white/5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[10px] text-white">
                     WA
                  </div>
                  <div className="min-w-0 flex-1">
                     <h4 className="text-[10px] font-bold leading-tight truncate text-neutral-200">
                        {selectedLead.name}
                     </h4>
                     <p className="text-[8px] font-medium text-emerald-400 leading-none">
                        WhatsApp Business Bot
                     </p>
                  </div>
               </div>

               {/* Messages Area */}
               <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-[11px] leading-relaxed" style={{ backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 0)', backgroundSize: '12px 12px' }}>
                  {chatHistory.map((msg) => (
                     <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs relative ${
                           msg.sender === 'user' 
                             ? 'bg-emerald-600 text-white rounded-tr-none' 
                             : 'bg-neutral-800 text-neutral-200 rounded-tl-none'
                        }`}>
                           <div className="whitespace-pre-line font-medium leading-relaxed font-sans">
                              {msg.text}
                           </div>

                           {msg.attachment && (
                              <div className="mt-2 p-1.5 bg-black/20 rounded-lg border border-white/10 flex items-center gap-2">
                                 <div className="p-1 rounded-md bg-rose-500/20 text-rose-400 font-mono text-[9px] font-black uppercase">
                                    {msg.attachment.type === 'file' ? 'PDF' : 'IMG'}
                                 </div>
                                 <span className="text-[9px] font-bold truncate text-neutral-300">
                                    {msg.attachment.name}
                                 </span>
                              </div>
                           )}

                           <div className="text-[7px] text-neutral-400 text-right mt-1 font-mono">
                              {msg.timestamp} {msg.sender === 'user' && '✓✓'}
                           </div>
                        </div>
                     </div>
                  ))}

                  {isSimTyping && (
                     <div className="flex items-center gap-1 bg-neutral-800 text-neutral-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full w-min shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                     </div>
                  )}
               </div>

               <form 
                  onSubmit={(e) => {
                     e.preventDefault();
                     handleSimulateSend(simMessage);
                  }}
                  className="p-2 border-t border-white/5 bg-neutral-800/50 flex gap-2"
               >
                  <input
                     type="text"
                     value={simMessage}
                     onChange={(e) => setSimMessage(e.target.value)}
                     placeholder="Type a whatsapp command..."
                     className="flex-1 bg-neutral-900 border border-white/10 text-xs px-3 py-2 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 min-w-0"
                  />
                  <button
                     type="submit"
                     disabled={!simMessage.trim() || isSimTyping}
                     className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors shrink-0"
                  >
                     <Send className="w-4 h-4" />
                  </button>
               </form>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8">
         <FormsManager />
      </div>

      <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 opacity-90">
         <h2 className="text-lg font-black uppercase tracking-widest text-[var(--text-muted)] mb-8">Secondary Advanced Workflows</h2>

      {/* RECOVERY MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Cart / Inquiry Abandonment */}
         <div className={`p-8 rounded-[2rem] border transition-all relative overflow-hidden ${settings.abandonedInquiryRecovery ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-black/5 dark:border-white/5 bg-[var(--bg-color)]'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-2xl border ${settings.abandonedInquiryRecovery ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}`}>
                   <ShoppingCart className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">Abandoned Chat Recovery</h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${settings.abandonedInquiryRecovery ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                     {settings.abandonedInquiryRecovery ? "Active" : "Off"}
                   </span>
                 </div>
              </div>
              <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10"
                  checked={settings.abandonedInquiryRecovery || false}
                  onChange={(e) => setSettings({ ...settings, abandonedInquiryRecovery: !settings.abandonedInquiryRecovery })}
                />
                <div className="w-full h-full rounded-full bg-[var(--shadow-dark)] peer-checked:bg-amber-500 transition-colors shadow-inner" />
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${settings.abandonedInquiryRecovery ? "translate-x-6" : "translate-x-0"}`} />
              </label>
            </div>

            <p className="text-xs font-bold text-[var(--text-muted)] leading-relaxed mb-6">
              Automatically send WhatsApp follow-up messages when people stop responding in the middle of a chat. 
            </p>

            <div className={`p-5 rounded-2xl border ${settings.abandonedInquiryRecovery ? 'border-amber-500/10 bg-white dark:bg-black' : 'border-transparent bg-black/5 dark:bg-white/5'} space-y-4`}>
               <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5" /> Wait time before follow-up
                 </label>
                 <span className="text-xs font-black text-amber-500">{settings.abandonedInquiryDelayMinutes} mins</span>
               </div>
               <input
                  type="range"
                  min="15" max="1440" step="15"
                  disabled={!settings.abandonedInquiryRecovery}
                  value={settings.abandonedInquiryDelayMinutes || 60}
                  onChange={(e) => setSettings({ ...settings, abandonedInquiryDelayMinutes: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
               />
               <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Pending Follow-up Chats</span>
                 <span className="text-lg font-black text-[var(--text-main)]">{activeAbandonedCarts} Leads</span>
               </div>
            </div>
         </div>

         {/* AI Re-engagement Loops (Dead Leads) */}
         <div className={`p-8 rounded-[2rem] border transition-all relative overflow-hidden ${settings.followUpSequenceEnabled ? 'border-indigo-500/20 bg-indigo-500/[0.02]' : 'border-black/5 dark:border-white/5 bg-[var(--bg-color)]'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-2xl border ${settings.followUpSequenceEnabled ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-500' : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}`}>
                   <WavesIcon className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">AI Re-Engagement</h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${settings.followUpSequenceEnabled ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                     {settings.followUpSequenceEnabled ? "Active" : "Off"}
                   </span>
                 </div>
              </div>
              <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10"
                  checked={settings.followUpSequenceEnabled || false}
                  onChange={(e) => setSettings({ ...settings, followUpSequenceEnabled: !settings.followUpSequenceEnabled })}
                />
                <div className="w-full h-full rounded-full bg-[var(--shadow-dark)] peer-checked:bg-indigo-500 transition-colors shadow-inner" />
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${settings.followUpSequenceEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </label>
            </div>

            <p className="text-xs font-bold text-[var(--text-muted)] leading-relaxed mb-6">
               Use AI to understand old inactive chats (older than 7 days) and automatically craft highly personalized check-in messages.
            </p>

             <div className={`p-5 rounded-2xl border ${settings.followUpSequenceEnabled ? 'border-indigo-500/10 bg-white dark:bg-black' : 'border-transparent bg-black/5 dark:bg-white/5'} space-y-4`}>
               <div className="flex justify-between items-center opacity-80">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5" /> Generative Trigger Threshold
                 </label>
                 <span className="text-xs font-black text-indigo-500">7 Days Silence</span>
               </div>
               
               <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Leads Pending Re-engagement</span>
                 <span className="text-lg font-black text-[var(--text-main)]">{deadLeads} Leads</span>
               </div>
            </div>
         </div>

         {/* Referral Engine */}
         <div className={`p-8 rounded-[2rem] border transition-all relative overflow-hidden ${settings.referralEngineEnabled ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-black/5 dark:border-white/5 bg-[var(--bg-color)]'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-2xl border ${settings.referralEngineEnabled ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'}`}>
                   <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">Referral Program</h3>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${settings.referralEngineEnabled ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                     {settings.referralEngineEnabled ? "Active" : "Off"}
                   </span>
                 </div>
              </div>
              <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10"
                  checked={settings.referralEngineEnabled || false}
                  onChange={(e) => setSettings({ ...settings, referralEngineEnabled: !settings.referralEngineEnabled })}
                />
                <div className="w-full h-full rounded-full bg-[var(--shadow-dark)] peer-checked:bg-emerald-500 transition-colors shadow-inner" />
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${settings.referralEngineEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </label>
            </div>

            <p className="text-xs font-bold text-[var(--text-muted)] leading-relaxed mb-6">
               Automatically ask customers to refer friends after they buy something.
            </p>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block pl-1">Referral Request Template</label>
              <select 
                value={settings.referralTemplateId || ''}
                onChange={(e) => setSettings({...settings, referralTemplateId: e.target.value})}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 rounded-2xl px-4 py-3 text-xs font-bold outline-none"
              >
                <option value="">Default AI Request</option>
                {(templates || []).filter(t => t.category === 'REFERRAL').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
         </div>
      </div>

       {/* AI Sales Copilot Tone */}
       <div className="p-8 bg-[var(--bg-color)] rounded-[2rem] border border-black/5 dark:border-white/5 relative overflow-hidden">
         <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0">
                <Sparkles className="w-8 h-8" />
              </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">AI Sales Assistant Tone</h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">How the AI assistant sounds when chatting with customers.</p>
               </div>
            </div>
            
            <label className="relative inline-block w-14 h-7 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10"
                  checked={settings.aiSalesCopilotEnabled || false}
                  onChange={(e) => setSettings({ ...settings, aiSalesCopilotEnabled: !settings.aiSalesCopilotEnabled })}
                />
                <div className="w-full h-full rounded-full bg-[var(--shadow-dark)] peer-checked:bg-emerald-500 transition-colors shadow-inner" />
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${settings.aiSalesCopilotEnabled ? "translate-x-7" : "translate-x-0"}`} />
            </label>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {['Consultative', 'Aggressive', 'Professional'].map((tone) => (
                <div 
                   key={tone}
                   onClick={() => setSettings({...settings, salesTone: tone as any})}
                   className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${settings.salesTone === tone ? 'border-emerald-500 bg-emerald-500/5' : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10'}`}
                >
                   <h4 className="text-sm font-black uppercase tracking-wider mb-2">{tone === 'Consultative' ? 'Helpful' : tone === 'Aggressive' ? 'Sales Driven' : tone}</h4>
                   <p className="text-[10px] font-bold leading-normal text-[var(--text-muted)]">
                     {tone === 'Consultative' && "Helpful tone. Focuses on helping the customer solve problems, asking helpful questions before recommending products."}
                     {tone === 'Aggressive' && "Sales-driven tone. Creates high urgency, highlights discounts, pushes to close the sale today."}
                     {tone === 'Professional' && "Professional tone. Direct and strictly business. Ideal for B2B wholesale buyers."}
                   </p>
                </div>
             ))}
         </div>
       </div>
       </div>

    </div>
  );
}

function WavesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6c.6 0 1.2-.2 1.6-.6C4.4 5 5.2 5 6 5.4 6.8 5 7.6 5 8 5.4c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6C12 5 12.8 5 13.6 5.4c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6C17.6 5 18.4 5 19.2 5.4c.4.4 1 .6 1.6.6" />
      <path d="M2 12c.6 0 1.2-.2 1.6-.6C4.4 11 5.2 11 6 11.4c.8-.4 1.6-.4 2 .4.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6C12 11 12.8 11 13.6 11.4c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6C17.6 11 18.4 11 19.2 11.4c.4.4 1 .6 1.6.6" />
      <path d="M2 18c.6 0 1.2-.2 1.6-.6C4.4 17 5.2 17 6 17.4c.8-.4 1.6-.4 2 .4.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6C12 17 12.8 17 13.6 17.4c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6C17.6 17 18.4 17 19.2 17.4c.4.4 1 .6 1.6.6" />
    </svg>
  )
}
