import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  ChevronRight, 
  X, 
  Download,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { Invoice, saveInvoice, deleteInvoice, InvoiceItem } from "../lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";

const StatusBadge = ({ status }: { status: Invoice['status'] }) => {
  const styles = {
    Draft: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Overdue: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    Cancelled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/10"
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  );
};

export function InvoicesView() {
  const { invoices, leads } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, isDestructive: true });

  // New Invoice State
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customerId: "",
    customerName: "",
    items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
    status: "Draft",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  const stats = useMemo(() => {
    const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = invoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);
    return { totalRevenue, pendingAmount };
  }, [invoices]);

  const calculateTotals = (items: InvoiceItem[], discount = 0, taxRate = 0.18) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const handleAddItem = () => {
    const items = [...(newInvoice.items || []), { id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }];
    setNewInvoice({ ...newInvoice, items, ...calculateTotals(items, newInvoice.discount) });
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const items = (newInvoice.items || []).map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    });
    setNewInvoice({ ...newInvoice, items, ...calculateTotals(items, newInvoice.discount) });
  };

  const handleRemoveItem = (id: string) => {
    const items = (newInvoice.items || []).filter(item => item.id !== id);
    setNewInvoice({ ...newInvoice, items, ...calculateTotals(items, newInvoice.discount) });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Invoice",
      message: "Are you sure you want to delete this invoice?",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteInvoice(id);
          setSelectedIds(prev => {
             const next = new Set(prev);
             next.delete(id);
             return next;
          });
          toast.success("Deleted invoice");
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
      title: `Delete ${selectedIds.size} Invoices`,
      message: "Are you sure you want to delete all selected invoices?",
      isDestructive: true,
      onConfirm: async () => {
        const promises = Array.from(selectedIds).map(id => deleteInvoice(id));
        try {
          await Promise.all(promises);
          toast.success(`Deleted ${selectedIds.size} invoices`);
          setSelectedIds(new Set());
        } catch (e: any) {
          toast.error("Failed to delete some: " + e.message);
        }
      }
    });
  };

  const openEdit = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewInvoice(invoice);
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.customerId || (newInvoice.items?.length || 0) === 0) {
      toast.error("Please select a customer and add at least one item.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedLead = leads.find(l => l.id === newInvoice.customerId);
      await saveInvoice({
        ...newInvoice,
        customerName: selectedLead?.name || "Unknown Customer",
        issuedAt: newInvoice.id ? newInvoice.issuedAt : new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setNewInvoice({
        customerId: "",
        items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
        status: "Draft",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      toast.success("Invoice saved successfully");
    } catch (error) {
      toast.error("Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 h-full font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <FileText className="w-8 h-8 text-emerald-500" />
            </div>
            Invoices
          </h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 ml-13">Revenue Architecture {"&"} Billing</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
             <input 
               type="text" 
               placeholder="Search by ID or customer..." 
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
              setNewInvoice({
                customerId: "",
                items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
                status: "Draft",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Collections</p>
             <h4 className="text-3xl font-black text-emerald-500">₹{stats.totalRevenue.toLocaleString()}</h4>
           </div>
           <div className="p-4 bg-emerald-500/10 rounded-2xl">
             <CheckCircle2 className="w-6 h-6 text-emerald-500" />
           </div>
        </div>
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Outstanding Pipeline</p>
             <h4 className="text-3xl font-black text-amber-500">₹{stats.pendingAmount.toLocaleString()}</h4>
           </div>
           <div className="p-4 bg-amber-500/10 rounded-2xl">
             <Clock className="w-6 h-6 text-amber-500" />
           </div>
        </div>
      </div>

      {filteredInvoices.length > 0 ? (
        <div className="flex-1 overflow-auto bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Invoice ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Issued</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Due</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <motion.tr 
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => openEdit(inv as Invoice, { stopPropagation: () => {} } as any)}
                  className={`border-b border-black/5 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group cursor-pointer ${selectedIds.has(inv.id) ? 'bg-[var(--accent)]/5' : ''}`}
                >
                  <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(inv.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(inv.id);
                        else next.delete(inv.id);
                        setSelectedIds(next);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-[var(--text-main)]">{inv.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{inv.customerName}</span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase truncate max-w-[150px]">ID: {inv.customerId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-[var(--text-muted)]">{new Date(inv.issuedAt || 0).toLocaleDateString()}</td>
                  <td className="px-6 py-5 text-xs font-bold text-[var(--text-muted)]">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-5 text-sm font-black text-[var(--text-main)]">₹{inv.total.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end gap-2">
                    <button onClick={(e) => openEdit(inv as Invoice, e)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button onClick={(e) => handleDelete(inv.id, e)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
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
            <FileText className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No Invoices Found</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm mb-8">
            Start by creating a new invoice to track revenue and bill your customers.
          </p>
          <button 
            onClick={() => {
              setNewInvoice({
                customerId: "",
                items: [{ id: uuidv4(), description: "", quantity: 1, unitPrice: 0, total: 0 }],
                status: "Draft",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Create First Invoice
          </button>
        </div>
      )}

      {/* Create Invoice Modal */}
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
                   <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">{newInvoice.id ? 'Edit Invoice' : 'Generate New Invoice'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Drafting Financial Documents</p>
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
                        <User className="w-3.5 h-3.5" /> Select Customer
                      </label>
                      <select 
                        required
                        value={newInvoice.customerId || ""}
                        onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
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
                        <Calendar className="w-3.5 h-3.5" /> Due Date
                      </label>
                      <input 
                        type="date"
                        required
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Line Items Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black uppercase tracking-widest">Line Items</h4>
                      <button 
                        type="button" 
                        onClick={handleAddItem}
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newInvoice.items?.map((item, idx) => (
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
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Internal Notes</label>
                          <textarea 
                            className="w-full p-4 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-medium outline-none resize-none h-24"
                            placeholder="Add notes for your records..."
                          />
                        </div>
                     </div>
                     <div className="space-y-3 bg-black/[0.03] dark:bg-white/[0.03] p-6 rounded-2xl">
                        <div className="flex justify-between items-center text-xs font-bold">
                           <span className="text-[var(--text-muted)] font-black uppercase tracking-widest">Subtotal</span>
                           <span>₹{newInvoice.subtotal?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                           <span className="text-[var(--text-muted)] font-black uppercase tracking-widest text-emerald-500/80">Tax (18%)</span>
                           <span>₹{newInvoice.tax?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5">
                           <span className="text-sm font-black uppercase tracking-widest">Total Amount</span>
                           <span className="text-lg font-black text-[var(--accent)]">₹{newInvoice.total?.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/30 hover:opacity-95 transition-all text-sm disabled:opacity-50"
                    >
                      {isSaving ? "Processing..." : (newInvoice.id ? "Save Changes" : "Generate Invoice")}
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
