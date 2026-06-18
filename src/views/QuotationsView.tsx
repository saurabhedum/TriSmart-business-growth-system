import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  X, 
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit2
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { Quotation, saveQuotation, deleteQuotation, InvoiceItem } from "../lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";

const StatusBadge = ({ status }: { status: Quotation['status'] }) => {
  const styles = {
    Draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    Expired: "bg-neutral-500/10 text-neutral-400 border-neutral-500/10"
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  );
};

export function QuotationsView() {
  const { quotations, leads } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, isDestructive: true });

  // New Quotation State
  const [newQuotation, setNewQuotation] = useState<Partial<Quotation>>({
    customerId: "",
    customerName: "",
    items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
    status: "Draft",
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  });

  const filteredQuotations = useMemo(() => {
    return quotations.filter(quo => 
      quo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quo.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quotations, searchQuery]);

  const stats = useMemo(() => {
    const acceptedTotal = quotations.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + q.total, 0);
    const openQuotes = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
    return { acceptedTotal, openQuotes };
  }, [quotations]);

  const calculateTotals = (items: InvoiceItem[], discount = 0, taxRate = 0.18) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const handleAddItem = () => {
    const items = [...(newQuotation.items || []), { id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }];
    setNewQuotation({ ...newQuotation, items, ...calculateTotals(items, newQuotation.discount) });
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const items = (newQuotation.items || []).map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    });
    setNewQuotation({ ...newQuotation, items, ...calculateTotals(items, newQuotation.discount) });
  };

  const handleRemoveItem = (id: string) => {
    const items = (newQuotation.items || []).filter(item => item.id !== id);
    setNewQuotation({ ...newQuotation, items, ...calculateTotals(items, newQuotation.discount) });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Quotation",
      message: "Are you sure you want to delete this quotation?",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteQuotation(id);
          setSelectedIds(prev => {
             const next = new Set(prev);
             next.delete(id);
             return next;
          });
          toast.success("Deleted quotation");
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
      title: `Delete ${selectedIds.size} Quotations`,
      message: "Are you sure you want to delete all selected quotations?",
      isDestructive: true,
      onConfirm: async () => {
        const promises = Array.from(selectedIds).map(id => deleteQuotation(id));
        try {
          await Promise.all(promises);
          toast.success(`Deleted ${selectedIds.size} quotations`);
          setSelectedIds(new Set());
        } catch (e: any) {
          toast.error("Failed to delete some: " + e.message);
        }
      }
    });
  };

  const openEdit = (quo: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewQuotation(quo);
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuotation.customerId || (newQuotation.items?.length || 0) === 0) {
      toast.error("Please select a customer and add at least one item.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedLead = leads.find(l => l.id === newQuotation.customerId);
      await saveQuotation({
        ...newQuotation,
        customerName: selectedLead?.name || "Unknown Customer",
        issuedAt: newQuotation.id ? newQuotation.issuedAt : new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setNewQuotation({
        customerId: "",
        items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
        status: "Draft",
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      toast.success("Quotation saved successfully");
    } catch (error) {
      toast.error("Failed to save quotation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 h-full font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <ClipboardList className="w-8 h-8 text-blue-500" />
            </div>
            Quotations
          </h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 ml-13">Sales Proposals {"&"} Estimates</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
             <input 
               type="text" 
               placeholder="Search quotations..." 
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
              setNewQuotation({
                customerId: "",
                items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
                status: "Draft",
                validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Accepted Pipeline</p>
             <h4 className="text-3xl font-black text-blue-500">₹{stats.acceptedTotal.toLocaleString()}</h4>
           </div>
           <div className="p-4 bg-blue-500/10 rounded-2xl">
             <CheckCircle2 className="w-6 h-6 text-blue-500" />
           </div>
        </div>
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Open Proposals</p>
             <h4 className="text-3xl font-black text-slate-400">{stats.openQuotes} Drafts/Sent</h4>
           </div>
           <div className="p-4 bg-slate-500/10 rounded-2xl">
             <Clock className="w-6 h-6 text-slate-400" />
           </div>
        </div>
      </div>

      {filteredQuotations.length > 0 ? (
        <div className="flex-1 overflow-auto bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredQuotations.length && filteredQuotations.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredQuotations.map(q => q.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Quotation ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Issued</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Valid Until</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((quo) => (
                <motion.tr 
                  key={quo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => openEdit(quo as Quotation, { stopPropagation: () => {} } as any)}
                  className={`border-b border-black/5 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group cursor-pointer ${selectedIds.has(quo.id) ? 'bg-[var(--accent)]/5' : ''}`}
                >
                  <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(quo.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(quo.id);
                        else next.delete(quo.id);
                        setSelectedIds(next);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-[var(--text-main)]">{quo.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{quo.customerName}</span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase truncate max-w-[150px]">ID: {quo.customerId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-[var(--text-muted)]">{new Date(quo.issuedAt || 0).toLocaleDateString()}</td>
                  <td className="px-6 py-5 text-xs font-bold text-[var(--text-muted)]">{quo.validUntil ? new Date(quo.validUntil).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-5 text-sm font-black text-[var(--text-main)]">₹{quo.total.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={quo.status} />
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end gap-2">
                    <button onClick={(e) => openEdit(quo as Quotation, e)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button onClick={(e) => handleDelete(quo.id, e)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-8 text-center">
          <div className="p-6 bg-black/5 dark:bg-white/5 rounded-full mb-4">
            <ClipboardList className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No Quotations Yet</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm mb-8">
            Start by creating a professional proposal to win more business and track your estimates.
          </p>
          <button 
            onClick={() => {
              setNewQuotation({
                customerId: "",
                items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
                status: "Draft",
                validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Create First Quotation
          </button>
        </div>
      )}

      {/* Create Quotation Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-3xl bg-[var(--bg-color)] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
                 <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">{newQuotation.id ? 'Edit Quotation' : 'New Sales Quotation'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Drafting Customer Proposal</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                   <X className="w-5 h-5 text-[var(--text-muted)]" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <form onSubmit={handleSave} className="space-y-8">
                  {/* Select Customer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Select Prospect
                      </label>
                      <select 
                        required
                        value={newQuotation.customerId || ""}
                        onChange={(e) => setNewQuotation({ ...newQuotation, customerId: e.target.value })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none"
                      >
                        <option value="">Choose a lead...</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={lead.id}>{lead.name} ({lead.mobileNumber})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Valid Until
                      </label>
                      <input 
                        type="date"
                        required
                        value={newQuotation.validUntil}
                        onChange={(e) => setNewQuotation({ ...newQuotation, validUntil: e.target.value })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Line Items Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black uppercase tracking-widest">Proposed Items</h4>
                      <button 
                        type="button" 
                        onClick={handleAddItem}
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newQuotation.items?.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                           <div className="col-span-6 space-y-1">
                             <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Description</label>
                             <input 
                               required
                               placeholder="Product or service..."
                               value={item.description || ""}
                               onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                               className="w-full px-3 py-2.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-bold outline-none border-none"
                             />
                           </div>
                           <div className="col-span-2 space-y-1">
                             <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Qty</label>
                             <input 
                               type="number"
                               required
                               min="1"
                               value={item.quantity}
                               onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                               className="w-full px-3 py-2.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-bold outline-none border-none"
                             />
                           </div>
                           <div className="col-span-3 space-y-1">
                             <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Price</label>
                             <input 
                               type="number"
                               required
                               min="0"
                               value={item.unitPrice}
                               onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                               className="w-full px-3 py-2.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-bold outline-none border-none"
                             />
                           </div>
                           <div className="col-span-1 flex justify-center pb-2">
                             <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-600 transition-colors">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Section */}
                  <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Quotation Notes</label>
                          <textarea 
                            className="w-full p-4 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-medium outline-none resize-none h-24"
                            placeholder="Add payment terms, validity notes..."
                          />
                        </div>
                     </div>
                     <div className="space-y-3 bg-black/[0.03] dark:bg-white/[0.03] p-6 rounded-2xl">
                        <div className="flex justify-between items-center text-xs font-bold">
                           <span className="text-[var(--text-muted)] font-black uppercase tracking-widest">Subtotal</span>
                           <span>₹{newQuotation.subtotal?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                           <span className="text-[var(--text-muted)] font-black uppercase tracking-widest text-blue-500/80">Est. Tax (18%)</span>
                           <span>₹{newQuotation.tax?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5">
                           <span className="text-sm font-black uppercase tracking-widest">Estimated Total</span>
                           <span className="text-lg font-black text-blue-500">₹{newQuotation.total?.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/30 hover:opacity-95 transition-all text-sm disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : (newQuotation.id ? "Save Changes" : "Create Quotation")}
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
