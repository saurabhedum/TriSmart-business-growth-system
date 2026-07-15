import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HeadphonesIcon, 
  Plus, 
  Search, 
  MoreVertical, 
  X,
  User,
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  CheckSquare,
  ListFilter
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { SupportTicket, saveTicket, deleteTicket } from "../lib/db";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";

const PriorityBadge = ({ priority }: { priority: SupportTicket['priority'] }) => {
  const styles = {
    Low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    High: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Urgent: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }: { status: SupportTicket['status'] }) => {
  const styles = {
    Open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "In Progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Closed: "bg-neutral-500/10 text-neutral-400 border-neutral-500/10"
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  );
};

export function TicketsView() {
  const { tickets, leads } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, isDestructive: true });

  // New Ticket State
  const [newTicket, setNewTicket] = useState<Partial<SupportTicket>>({
    customerId: "",
    customerName: "",
    subject: "",
    description: "",
    priority: "Medium",
    status: "Open"
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tickets, searchQuery]);

  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    return { open, resolved };
  }, [tickets]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Ticket",
      message: "Are you sure you want to delete this ticket? This cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTicket(id);
          setSelectedIds(prev => {
             const next = new Set(prev);
             next.delete(id);
             return next;
          });
          toast.success("Deleted ticket");
        } catch (e: any) {
          toast.error("Failed to delete: " + e.message);
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: `Delete ${selectedIds.size} Tickets`,
      message: "Are you sure you want to delete all selected tickets?",
      isDestructive: true,
      onConfirm: async () => {
        const promises = Array.from(selectedIds).map(id => deleteTicket(id));
        try {
          await Promise.all(promises);
          toast.success(`Deleted ${selectedIds.size} tickets`);
          setSelectedIds(new Set());
        } catch (e: any) {
          toast.error("Failed to delete some: " + e.message);
        }
      }
    });
  };

  const openEdit = (ticket: SupportTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTicket(ticket);
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) {
      toast.error("Please enter a subject and description.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedLead = leads.find(l => l.id === newTicket.customerId);
      const isStatusChangedToSolved = newTicket.id && newTicket.status === 'Closed' && tickets.find(t => t.id === newTicket.id)?.status !== 'Closed';

      await saveTicket({
        ...newTicket,
        customerName: selectedLead?.name || "General Inquiry"
      });
      
      if (isStatusChangedToSolved && selectedLead) {
         toast.success(`Message sent to ${selectedLead.name} on WhatsApp via Template "COMPLAINT_SOLVED"`);
      }
      
      setIsAddModalOpen(false);
      setNewTicket({
        customerId: "",
        subject: "",
        description: "",
        priority: "Medium",
        status: "Open"
      });
      toast.success("Ticket created successfully");
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 h-full font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <HeadphonesIcon className="w-8 h-8 text-amber-500" />
            </div>
            Support Tickets
          </h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 ml-13">Customer Issues {"&"} Resolution</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
             <input 
               type="text" 
               placeholder="Search tickets..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 pr-4 py-2.5 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-colors min-w-[280px]"
             />
          </div>
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.size})
            </button>
          )}
          <button 
            onClick={() => {
              setNewTicket({ customerId: "", customerName: "", subject: "", description: "", priority: "Medium", status: "Open" });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Open Issues</p>
             <h4 className="text-3xl font-black text-amber-500">{stats.open}</h4>
           </div>
           <div className="p-4 bg-amber-500/10 rounded-2xl">
             <AlertCircle className="w-6 h-6 text-amber-500" />
           </div>
        </div>
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Resolved Tickets</p>
             <h4 className="text-3xl font-black text-emerald-500">{stats.resolved}</h4>
           </div>
           <div className="p-4 bg-emerald-500/10 rounded-2xl">
             <CheckCircle2 className="w-6 h-6 text-emerald-500" />
           </div>
        </div>
      </div>

      {filteredTickets.length > 0 ? (
        <div className="flex-1 overflow-auto bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredTickets.length && filteredTickets.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredTickets.map(t => t.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] w-24">Ticket ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Updated</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <ListFilter className="w-8 h-8 text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-main)]">No tickets found</h4>
                        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                          Create a new ticket or adjust your filters. 
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <motion.tr 
                    key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => openEdit(ticket, { stopPropagation: () => {} } as any)}
                  className={`border-b border-black/5 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group cursor-pointer ${selectedIds.has(ticket.id) ? 'bg-[var(--accent)]/5' : ''}`}
                >
                  <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(ticket.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(ticket.id);
                        else next.delete(ticket.id);
                        setSelectedIds(next);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-[var(--text-main)] truncate max-w-[100px]">{ticket.id}</td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-[var(--text-main)] truncate max-w-[200px] inline-block">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[var(--text-main)]">{ticket.customerName || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-5 text-right text-xs font-bold text-[var(--text-muted)]">
                    {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end gap-2">
                    <button onClick={(e) => openEdit(ticket, e)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button onClick={(e) => handleDelete(ticket.id, e)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </td>
                </motion.tr>
              )))
            }
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-8 text-center">
          <div className="p-6 bg-black/5 dark:bg-white/5 rounded-full mb-4">
            <HeadphonesIcon className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No Active Tickets</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm mb-8">
            Keep your customers happy by tracking support requests here.
          </p>
          <button 
            onClick={() => {
              setNewTicket({ customerId: "", customerName: "", subject: "", description: "", priority: "Medium", status: "Open" });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Create First Ticket
          </button>
        </div>
      )}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[var(--bg-color)] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
                 <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">{newTicket.id ? 'Edit Support Request' : 'Open Support Request'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Customer Service Center</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                   <X className="w-5 h-5 text-[var(--text-muted)]" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <form onSubmit={handleSave} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Associated Customer (Optional)
                    </label>
                    <select 
                      value={newTicket.customerId || ""}
                      onChange={(e) => setNewTicket({ ...newTicket, customerId: e.target.value })}
                      className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none"
                    >
                      <option value="">General / Unknown Customer</option>
                      {leads.map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name} ({lead.mobileNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Subject / Title
                    </label>
                    <input 
                      type="text"
                      required
                      value={newTicket.subject || ""}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold"
                      placeholder="e.g. Printer not turning on..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Issue Description</label>
                    <textarea 
                      required
                      value={newTicket.description || ""}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      className="w-full p-4 bg-black/5 dark:bg-white/5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--accent)] border-none resize-none h-32"
                      placeholder="Provide details about the issue..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/[0.02] dark:bg-white/[0.02] p-6 rounded-3xl border border-black/5 dark:border-white/5">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Priority Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Low', 'Medium', 'High', 'Urgent'].map((level) => (
                          <label key={level} className="cursor-pointer">
                            <input 
                              type="radio" 
                              name="priority" 
                              className="peer sr-only"
                              checked={newTicket.priority === level}
                              onChange={() => setNewTicket({ ...newTicket, priority: level as SupportTicket['priority'] })}
                            />
                            <div className={`text-center py-2.5 rounded-xl text-xs font-bold border-2 border-transparent bg-white dark:bg-black transition-all ${
                              newTicket.priority === level ? (
                                level === 'Urgent' ? 'border-rose-500 text-rose-500' :
                                level === 'High' ? 'border-amber-500 text-amber-500' :
                                level === 'Medium' ? 'border-blue-500 text-blue-500' :
                                'border-[var(--accent)] text-[var(--accent)]'
                              ) : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                            }`}>
                              {level}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Initial Status</label>
                       <select 
                        required
                        value={newTicket.status || "Open"}
                        onChange={(e) => setNewTicket({ ...newTicket, status: e.target.value as SupportTicket['status'] })}
                        className="w-full px-4 py-3 bg-white dark:bg-black rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border border-black/10 dark:border-white/10 text-sm font-bold appearance-none"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {newTicket.id && (
                    <p className="text-xs font-medium text-[var(--text-muted)] p-4 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      If marking this as Resolved, the system will automatically dispatch the Complaint Solved Meta template to the customer (if available).
                    </p>
                  )}

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/30 hover:opacity-95 transition-all text-sm disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : (newTicket.id ? "Save Changes" : "Create Ticket")}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-8 py-4 bg-black/5 dark:bg-white/5 text-[var(--text-main)] rounded-2xl font-black uppercase tracking-widest hover:bg-black/10 transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal {...confirmConfig} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} />
    </div>
  );
}

