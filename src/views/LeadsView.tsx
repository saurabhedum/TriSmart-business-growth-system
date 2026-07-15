import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, Search, Plus, MoreVertical, X, Trash2, Bell, Send, Upload, Download, Loader2, AlertTriangle, Paperclip, Link as LinkIcon, Instagram, MessageCircle, Pencil, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useMemo } from "react";
import { Lead, addLead, updateLead, deleteLead, updateLeadsBatchStatus, AppSettings, CustomForm } from "../lib/db";
import { useData } from "../contexts/DataContext";
import { v4 as uuidv4 } from "uuid";
import { FormsManager } from "../components/FormsManager";
import { ConfirmModal } from "../components/ConfirmModal";
import { LeadProfilePanel } from "../components/LeadProfilePanel";
import { toast } from "react-hot-toast";
import { whatsappService } from "../services/whatsappService";

const LeadTableRow = React.memo(({ 
  lead, 
  index,
  selected,
  onSelect,
  onRowClick, 
  onMessage,
  onEdit,
  onSendForm,
  onDelete
}: { 
  lead: Lead; 
  index: number; 
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onRowClick: (l: Lead) => void;
  onMessage: (e: React.MouseEvent, l: Lead) => void;
  onEdit: (e: React.MouseEvent, l: Lead) => void;
  onSendForm: (e: React.MouseEvent, l: Lead) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) => {
  return (
    <motion.tr 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.5) }}
      whileHover={{ backgroundColor: "rgba(var(--accent-rgb), 0.05)" }}
      onClick={() => onRowClick(lead)}
      className="border-b border-[var(--shadow-dark)] last:border-0 transition-colors cursor-pointer group"
    >
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={selected}
          onChange={(e) => onSelect(lead.id!, e.target.checked)}
          className="w-4 h-4 rounded border-[var(--shadow-dark)] text-accent focus:ring-accent bg-[var(--bg-color)] cursor-pointer"
        />
      </td>
      <td className="px-4 py-4 font-mono text-[10px] uppercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">{lead.id?.substring(0, 8)}</td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="font-black uppercase tracking-tight text-sm whitespace-nowrap">{typeof lead.name === 'object' ? Object.values(lead.name).join(' ') : String(lead.name)}</span>
          <span className="text-[10px] neu-text-muted font-bold tracking-widest">{lead.mobileNumber}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
          lead.source === 'Instagram' ? 'bg-pink-500/10 text-pink-600' : 
          lead.source === 'WhatsApp' ? 'bg-emerald-500/10 text-emerald-600' : 
          'bg-accent/80/10 text-accent'
        }`}>
          {lead.source === 'Instagram' ? <Instagram className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
          {lead.source}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
          lead.status === 'New' ? 'bg-accent/80/10 text-accent' :
          lead.status === 'Qualified' ? 'bg-purple-500/10 text-purple-600' :
          lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-600' :
          'bg-slate-500/10 text-slate-600'
        }`}>
          {lead.status}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((star) => (
            <div 
              key={star} 
              className={`w-2 h-2 rounded-full ${
                (lead.interestLevel === 'High' && star <= 3) ||
                (lead.interestLevel === 'Medium' && star <= 2) ||
                (lead.interestLevel === 'Low' && star <= 1)
                ? 'bg-amber-500' : 'bg-slate-200'
              }`} 
            />
          ))}
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="font-mono text-[10px] font-bold text-neutral-500">₹{lead.estimatedBudget || 0}</span>
      </td>
      <td className="px-4 py-4">
        <span className={`text-[10px] font-black uppercase tracking-widest ${
          (lead.leadScore || 50) >= 80 ? 'text-emerald-500' : 
          (lead.leadScore || 50) >= 50 ? 'text-amber-500' : 'text-rose-500'
        }`}>
          {lead.leadScore || 50}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end items-center gap-2">
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            className="p-2 neu-flat-sm text-emerald-600 rounded-xl transition-all"
            onClick={(e) => onMessage(e, lead)}
            title="Message"
          >
            <Send className="w-4 h-4" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            className="p-2 neu-flat-sm text-accent rounded-xl transition-all"
            onClick={(e) => onEdit(e, lead)}
            title="Edit Lead"
          >
            <Pencil className="w-4 h-4" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(236, 72, 153, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            className="p-2 neu-flat-sm text-pink-600 rounded-xl transition-all"
            onClick={(e) => onSendForm(e, lead)}
            title="Send Form"
          >
            <LinkIcon className="w-4 h-4" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            whileTap={{ scale: 0.9 }}
            className="p-2 neu-flat-sm text-red-600 rounded-xl transition-all"
            onClick={(e) => onDelete(e, lead.id!)}
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
});

export function LeadsView() {
  const { leads, settings, forms, templates } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [activeTab, setActiveTab] = useState<'manager' | 'capture'>('manager');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, isDestructive: true });
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isSendFormModalOpen, setIsSendFormModalOpen] = useState(false);
  const [selectedFormToSend, setSelectedFormToSend] = useState('');
  const [sendMethod, setSendMethod] = useState<'manual_wa' | 'api_wa' | 'api_ig'>('manual_wa');
  const [bulkSendMode, setBulkSendMode] = useState(false);
  const [targetLeadForm, setTargetLeadForm] = useState<Lead | null>(null);
  const [selectedLeadForProfile, setSelectedLeadForProfile] = useState<Lead | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: "",
    mobileNumber: "",
    source: "Manual",
    status: "New",
    interestLevel: "Medium",
    dateOfBirth: "",
    notes: ""
  });

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase().trim();
    return leads.filter(l => {
      const nameStr = typeof l.name === 'object' ? Object.values(l.name).join(' ') : String(l.name || '');
      const notesStr = String(l.notes || '');
      const numStr = String(l.mobileNumber || '');
      return nameStr.toLowerCase().includes(query) || numStr.includes(query) || notesStr.toLowerCase().includes(query);
    });
  }, [leads, searchQuery]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.mobileNumber) return;

    setIsSubmitting(true);
    try {
      if (editingLeadId) {
        await updateLead({ id: editingLeadId, ...newLead } as Lead);
      } else {
        await addLead({
          ...newLead,
          id: `LEAD-${uuidv4().substring(0, 8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          lastInteraction: new Date().toISOString(),
          leadScore: Math.floor(Math.random() * 40) + 60, // Simulate 60-100 logic
          purchaseProbability: newLead.interestLevel === 'High' ? 'High' : 'Medium',
          customerValueScore: 0
        } as Lead);
      }
      setIsAddModalOpen(false);
      setEditingLeadId(null);
      setNewLead({ name: "", mobileNumber: "", source: "Manual", status: "New", interestLevel: "Medium", notes: "" });
      toast.success(editingLeadId ? "Lead updated successfully" : "Lead added successfully");
    } catch (err: any) {
      toast.error('Error saving lead: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectLead = (id: string, selected: boolean) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id!)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleDeleteLead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Delete Lead",
      message: "Are you sure you want to delete this lead? This action cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        await deleteLead(id);
        setSelectedLeads(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleEditLead = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setNewLead(lead);
    setEditingLeadId(lead.id!);
    setIsAddModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Bulk Delete Leads",
      message: `Are you sure you want to delete ${selectedLeads.size} leads? This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await Promise.all(Array.from(selectedLeads).map(id => deleteLead(id)));
          setSelectedLeads(new Set());
          toast.success("Leads deleted successfully");
        } catch (err: any) {
          toast.error("Error with bulk delete: " + (err.message || ''));
        }
      }
    });
  };

  const handleBulkStatusChange = async (status: Lead['status']) => {
    setConfirmModal({
      isOpen: true,
      title: "Change Leads Status",
      message: `Are you sure you want to change the status of ${selectedLeads.size} leads to ${status}?`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          await updateLeadsBatchStatus(Array.from(selectedLeads), status);
          setSelectedLeads(new Set());
          toast.success("Leads status updated");
        } catch (err: any) {
          toast.error("Error with bulk status update: " + (err.message || ''));
        }
      }
    });
  };

  const handleExport = () => {
    const leadsToExport = selectedLeads.size > 0 
      ? filteredLeads.filter(l => selectedLeads.has(l.id!)) 
      : filteredLeads;
    
    if (leadsToExport.length === 0) return;
    
    // Simple CSV conversion
    const headers = ['ID', 'Name', 'Mobile', 'Source', 'Status', 'Interest Level', 'Created At', 'Notes'];
    const rows = leadsToExport.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.mobileNumber,
      l.source,
      l.status,
      l.interestLevel,
      l.createdAt?.split('T')[0] || '',
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleMessageLead = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const cleanPhone = lead.mobileNumber.replace(/[^\d+]/g, '');
    let finalPhone = cleanPhone;
    if (!finalPhone.startsWith('+')) {
       // Just prepend 91 for Indian numbers as default, if not explicitly provided
       if (finalPhone.length === 10) {
         finalPhone = '+91' + finalPhone;
       } else if (finalPhone.length > 10 && !finalPhone.startsWith('+')) {
         finalPhone = '+' + finalPhone;
       }
    }
    const message = encodeURIComponent(`Hi ${lead.name}, `);
    window.open(`https://wa.me/${finalPhone.replace('+', '')}?text=${message}`, '_blank');
    
    // Also change status to follow up if it's new
    if (lead.status === 'New' || lead.status === 'Contacted') {
       updateLead({ id: lead.id, status: 'FollowedUp' } as Lead).catch((err: any) => {
         toast.error("Failed to update status: " + (err.message || ''));
       });
    }
  };

  const handleSendFormClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setTargetLeadForm(lead);
    setBulkSendMode(false);
    setIsSendFormModalOpen(true);
  };

  const handleBulkSendForms = () => {
    setBulkSendMode(true);
    setIsSendFormModalOpen(true);
  };

  const executeSendForm = async () => {
    if (!selectedFormToSend) {
      toast.error("Please select a form to send");
      return;
    }
    
    const theForm = forms.find(f => f.id === selectedFormToSend);
    if (!theForm) return;

    const targets = bulkSendMode ? filteredLeads : (targetLeadForm ? [targetLeadForm] : []);
    if (targets.length === 0) return;

    setIsSendingForm(true);
    try {
      if (sendMethod === 'manual_wa') {
        if (bulkSendMode) {
          toast.error("Manual WhatsApp is only available for a single lead.");
          return;
        }
        const lead = targets[0];
        const cleanPhone = lead.mobileNumber.replace(/[^\d+]/g, '');
        let finalPhone = cleanPhone;
        if (!finalPhone.startsWith('+')) {
           if (finalPhone.length === 10) finalPhone = '+91' + finalPhone;
           else if (finalPhone.length > 10 && !finalPhone.startsWith('+')) finalPhone = '+' + finalPhone;
        }
        const formUrl = `${window.location.origin}/form/${theForm.id}?cid=${lead.id}`;
        const message = encodeURIComponent(`Hi ${lead.name},\n\nPlease fill out this form: ${formUrl}`);
        window.open(`https://wa.me/${finalPhone.replace('+', '')}?text=${message}`, '_blank');
      } else {
        const template = templates?.find(t => t.category === 'FORM_DISTRIBUTION');
        if (!template) {
           toast.error("No 'Form Distribution' template found. Navigate to Templates, click 'Seed Defaults', then try again.");
           setIsSendFormModalOpen(false);
           return;
        }

        toast.loading(`Sending form to ${targets.length} leads via ${sendMethod === 'api_wa' ? 'WhatsApp API' : 'Instagram API'}...`, { id: 'bulk-send' });
        
        let successCount = 0;
        for (const lead of targets) {
           const formUrl = `${window.location.origin}/form/${theForm.id}?cid=${lead.id}`;
           const leadName = typeof lead.name === 'object' ? Object.values(lead.name).join(' ') : String(lead.name || 'Customer');
           let finalPhone = lead.mobileNumber;
           if (!finalPhone.startsWith('+') && finalPhone.length === 10) finalPhone = '+91' + finalPhone;

           let finalMessage = template.content;
           if (finalMessage.includes('{{1}}')) finalMessage = finalMessage.replace('{{1}}', leadName);
           if (finalMessage.includes('{{2}}')) finalMessage = finalMessage.replace('{{2}}', formUrl);

           try {
              await whatsappService.sendMessage({
                 to: finalPhone,
                 message: finalMessage,
                 customTemplateName: template.metaTemplateId || undefined,
                 templateCategory: 'custom',
                 templateParams: [leadName, formUrl],
                 platform: sendMethod === 'api_ig' ? 'instagram' : 'whatsapp'
              });
              successCount++;
           } catch(e) {
              console.error(e);
           }
        }
        
        toast.success(`Form sent successfully to ${successCount} out of ${targets.length} leads!`, { id: 'bulk-send' });
      }
    } finally {
      setIsSendingForm(false);
      setIsSendFormModalOpen(false);
      setTargetLeadForm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Lead Manager</h2>
          <p className="neu-text-muted font-bold text-xs uppercase tracking-widest mt-1">Capture & Convert Potential Clients</p>
        </div>
        <div className="flex items-center gap-2 p-1 neu-pressed rounded-xl">
           <button 
             onClick={() => setActiveTab('manager')}
             className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'manager' ? 'neu-flat text-accent' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             Manager
           </button>
           <button 
             onClick={() => setActiveTab('capture')}
             className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'capture' ? 'neu-flat text-accent' : 'text-neutral-500 hover:text-neutral-700'}`}
           >
             Forms
           </button>
        </div>
      </div>

      {activeTab === 'capture' ? (
        <FormsManager />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 neu-text-muted" />
              <input 
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 neu-pressed rounded-2xl outline-none text-sm"
              />
            </div>
            
            {selectedLeads.size > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold neu-text-muted mr-2">{selectedLeads.size} selected</span>
                <select 
                  className="px-4 py-3 neu-flat rounded-2xl outline-none text-xs font-bold tracking-widest uppercase cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value) handleBulkStatusChange(e.target.value as any);
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="" disabled>Set Status</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="FollowedUp">FollowedUp</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
                <button 
                  onClick={handleExport}
                  className="p-3 neu-flat rounded-2xl hover:bg-black/5 font-bold uppercase tracking-widest flex items-center gap-2 text-xs transition-colors"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
                <button 
                  onClick={handleBulkSendForms}
                  className="p-3 neu-flat rounded-2xl hover:bg-black/5 text-pink-600 font-bold uppercase tracking-widest flex items-center gap-2 text-xs transition-colors"
                >
                  <Send className="w-4 h-4" /> Send Forms
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="p-3 bg-red-500/10 text-red-600 rounded-2xl hover:bg-red-500/20 font-bold uppercase tracking-widest flex items-center gap-2 text-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Set
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handleExport}
                  className="p-3 neu-flat rounded-2xl hover:bg-black/5 font-bold uppercase tracking-widest flex items-center gap-2 text-xs transition-colors"
                >
                  <Download className="w-4 h-4" /> Export All
                </button>
                <button 
                  onClick={handleBulkSendForms}
                  className="p-3 neu-flat rounded-2xl hover:bg-black/5 text-pink-600 font-bold uppercase tracking-widest flex items-center gap-2 text-xs transition-colors"
                >
                  <Send className="w-4 h-4" /> Send Forms All
                </button>
                <button 
                  onClick={() => {
                    setEditingLeadId(null);
                    setNewLead({ name: "", mobileNumber: "", source: "Manual", status: "New", interestLevel: "Medium", notes: "" });
                    setIsAddModalOpen(true);
                  }}
                  className="p-3 bg-accent text-white rounded-2xl shadow-lg shadow-accent/30 hover:bg-blue-700 font-bold uppercase tracking-widest flex items-center gap-2 text-xs"
                >
                  <Plus className="w-4 h-4" /> Add Lead
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="neu-flat border-none rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/80/10 text-accent rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold neu-text-muted uppercase tracking-widest">Total Leads</p>
                <p className="text-2xl font-black">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neu-flat border-none rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold neu-text-muted uppercase tracking-widest">Active Chats</p>
                <p className="text-2xl font-black">{leads.filter(l => l.status === 'FollowedUp').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="neu-flat border-none rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold neu-text-muted uppercase tracking-widest">Hot Prospects</p>
                <p className="text-2xl font-black">{leads.filter(l => l.interestLevel === 'High').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="neu-flat rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--shadow-dark)] bg-black/5">
                <th className="px-4 py-4 w-10">
                  <input 
                    type="checkbox"
                    checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--shadow-dark)] text-accent focus:ring-accent bg-[var(--bg-color)] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">ID</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">Contact</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">Source</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">Status</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">Interest</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">Est. Budget</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest neu-text-muted">AI Score</th>
                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-widest neu-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full neu-pressed flex items-center justify-center">
                        <Users className="w-8 h-8 text-neutral-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-600">No leads found</h4>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                          {searchQuery
                            ? "Try adjusting your search query."
                            : "Add a new lead manually or import them from a CSV."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, index) => (
                    <LeadTableRow 
                      key={lead.id} 
                      lead={lead} 
                      index={index} 
                      selected={selectedLeads.has(lead.id!)}
                      onSelect={handleSelectLead}
                      onRowClick={() => setSelectedLeadForProfile(lead)} 
                      onMessage={handleMessageLead} 
                      onEdit={handleEditLead}
                      onSendForm={handleSendFormClick}
                      onDelete={handleDeleteLead}
                    />
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-[var(--shadow-dark)]">
              <span className="text-xs font-bold text-neutral-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2 neu-flat rounded-lg hover:bg-black/5 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-4 py-2 text-xs font-bold flex items-center">{currentPage} / {totalPages}</span>
                <button 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2 neu-flat rounded-lg hover:bg-black/5 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[var(--bg-color)] rounded-3xl p-8 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tight">Add New Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 neu-flat rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddLead} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted">Lead Name</label>
                <input 
                  type="text"
                  value={newLead.name || ""}
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  className="w-full p-4 neu-pressed rounded-xl border-none outline-none"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted">Mobile Number</label>
                <input 
                  type="tel"
                  value={newLead.mobileNumber || ""}
                  onChange={(e) => setNewLead({...newLead, mobileNumber: e.target.value})}
                  className="w-full p-4 neu-pressed rounded-xl border-none outline-none"
                  placeholder="10-digit number"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted">Source</label>
                <select 
                  value={newLead.source || "Manual"}
                  onChange={(e) => setNewLead({...newLead, source: e.target.value as any})}
                  className="w-full p-4 neu-pressed rounded-xl border-none outline-none bg-transparent"
                >
                  <option value="Manual">Manual</option>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Web">Web</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted">Date of Birth</label>
                <input 
                  type="date"
                  value={newLead.dateOfBirth || ""}
                  onChange={(e) => setNewLead({...newLead, dateOfBirth: e.target.value})}
                  className="w-full p-4 neu-pressed rounded-xl border-none outline-none text-sm font-bold text-neutral-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted">Interest Level</label>
                <select 
                  value={newLead.interestLevel || "Medium"}
                  onChange={(e) => setNewLead({...newLead, interestLevel: e.target.value as any})}
                  className="w-full p-4 neu-pressed rounded-xl border-none outline-none bg-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted">Initial Status</label>
                <select 
                  value={newLead.status || "New"}
                  onChange={(e) => setNewLead({...newLead, status: e.target.value as any})}
                  className="w-full p-4 neu-pressed rounded-xl border-none outline-none bg-transparent"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="col-span-2 py-4 bg-accent text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-accent/30 w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {editingLeadId ? (isSubmitting ? "Updating..." : "Update Lead") : (isSubmitting ? "Creating..." : "Create Lead")}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      
      {isSendFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSendFormModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--bg-color)] rounded-3xl p-6 relative border border-[var(--shadow-dark)] shadow-2xl"
          >
            <button onClick={() => setIsSendFormModalOpen(false)} className="absolute top-4 right-4 p-2 neu-flat-sm rounded-xl">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-black mb-4">Send Form</h2>
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase">Select Form</label>
                  <select 
                     className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none mt-1 cursor-pointer"
                     value={selectedFormToSend}
                     onChange={e => setSelectedFormToSend(e.target.value)}
                  >
                     <option value="" disabled>-- Choose a Form --</option>
                     {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase">Send Method</label>
                  <select 
                     className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none mt-1 cursor-pointer"
                     value={sendMethod}
                     onChange={e => setSendMethod(e.target.value as any)}
                  >
                     {!bulkSendMode && <option value="manual_wa">Manual open WhatsApp Web</option>}
                     <option value="api_wa">WhatsApp Bot API (Automated)</option>
                     <option value="api_ig">Instagram Bot API (Automated)</option>
                  </select>
               </div>
               <button 
                  onClick={executeSendForm}
                  disabled={isSendingForm}
                  className="w-full p-4 mt-2 bg-accent text-white font-black uppercase rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70"
               >
                  {isSendingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSendingForm ? "Processing..." : "Execute Send"}
               </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        isDestructive={confirmModal.isDestructive}
      />
      
      <AnimatePresence>
        {selectedLeadForProfile && (
          <LeadProfilePanel lead={selectedLeadForProfile} onClose={() => setSelectedLeadForProfile(null)} />
        )}
      </AnimatePresence>
      </div>)}
    </div>
  );
}

const TrendingUp = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
