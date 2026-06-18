import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CreditCard, 
  DollarSign, 
  Search, 
  Trash2, 
  X, 
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Hash,
  Edit2
} from "lucide-react";
import { useData } from "../contexts/DataContext";
import { Payment, savePayment, deletePayment } from "../lib/db";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../components/ConfirmModal";

const StatusBadge = ({ status }: { status: Payment['status'] }) => {
  const styles = {
    Completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    Refunded: "bg-slate-500/10 text-slate-500 border-slate-500/20"
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  );
};

export function PaymentsView() {
  const { payments, leads, invoices } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {}, isDestructive: true });

  // New Payment State
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    customerId: "",
    customerName: "",
    invoiceId: "",
    amount: 0,
    method: "Bank Transfer",
    status: "Completed",
    referenceNumber: "",
    date: new Date().toISOString().split('T')[0]
  });

  const filteredPayments = useMemo(() => {
    return payments.filter(pay => 
      pay.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payments, searchQuery]);

  const stats = useMemo(() => {
    const totalCollected = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    return { totalCollected, pendingAmount };
  }, [payments]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Payment",
      message: "Are you sure you want to delete this payment record?",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deletePayment(id);
          setSelectedIds(prev => {
             const next = new Set(prev);
             next.delete(id);
             return next;
          });
          toast.success("Deleted payment");
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
      title: `Delete ${selectedIds.size} Payments`,
      message: "Are you sure you want to delete all selected payments?",
      isDestructive: true,
      onConfirm: async () => {
        const promises = Array.from(selectedIds).map(id => deletePayment(id));
        try {
          await Promise.all(promises);
          toast.success(`Deleted ${selectedIds.size} payments`);
          setSelectedIds(new Set());
        } catch (e: any) {
          toast.error("Failed to delete some: " + e.message);
        }
      }
    });
  };

  const openEdit = (pay: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewPayment(pay);
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.customerId || !newPayment.amount) {
      toast.error("Please select a customer and enter an amount.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedLead = leads.find(l => l.id === newPayment.customerId);
      await savePayment({
        ...newPayment,
        customerName: selectedLead?.name || "Unknown Customer"
      });
      setIsAddModalOpen(false);
      setNewPayment({
        customerId: "",
        invoiceId: "",
        amount: 0,
        method: "Bank Transfer",
        status: "Completed",
        referenceNumber: "",
        date: new Date().toISOString().split('T')[0]
      });
      toast.success("Payment saved successfully");
    } catch (error) {
      toast.error("Failed to save payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 h-full font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3">
            <div className="p-2 bg-emerald-400/10 rounded-xl">
              <CreditCard className="w-8 h-8 text-emerald-400" />
            </div>
            Payments
          </h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 ml-13">Revenue Collection {"&"} Ledger</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
             <input 
               type="text" 
               placeholder="Search payments..." 
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
              setNewPayment({
                customerId: "",
                invoiceId: "",
                amount: 0,
                method: "Bank Transfer",
                status: "Completed",
                referenceNumber: "",
                date: new Date().toISOString().split('T')[0]
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            <DollarSign className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Collected</p>
             <h4 className="text-3xl font-black text-emerald-400">₹{stats.totalCollected.toLocaleString()}</h4>
           </div>
           <div className="p-4 bg-emerald-400/10 rounded-2xl">
             <CheckCircle2 className="w-6 h-6 text-emerald-400" />
           </div>
        </div>
        <div className="p-6 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Processing / Pending</p>
             <h4 className="text-3xl font-black text-amber-500">₹{stats.pendingAmount.toLocaleString()}</h4>
           </div>
           <div className="p-4 bg-amber-500/10 rounded-2xl">
             <AlertCircle className="w-6 h-6 text-amber-500" />
           </div>
        </div>
      </div>

      {filteredPayments.length > 0 ? (
        <div className="flex-1 overflow-auto bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredPayments.length && filteredPayments.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredPayments.map(p => p.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payment ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Customer / Invoice</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Method / Ref</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay) => (
                <motion.tr 
                  key={pay.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => openEdit(pay as Payment, { stopPropagation: () => {} } as any)}
                  className={`border-b border-black/5 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors group cursor-pointer ${selectedIds.has(pay.id) ? 'bg-[var(--accent)]/5' : ''}`}
                >
                  <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(pay.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(pay.id);
                        else next.delete(pay.id);
                        setSelectedIds(next);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[var(--accent)] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-[var(--text-main)]">{pay.id}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{pay.customerName}</span>
                      {pay.invoiceId && <span className="text-[10px] font-bold text-[var(--accent)] uppercase truncate">INV: {pay.invoiceId}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-[var(--text-muted)]">{new Date(pay.date).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[var(--text-main)]">{pay.method}</span>
                      {pay.referenceNumber && <span className="text-[10px] font-bold text-[var(--text-muted)]">REF: {pay.referenceNumber}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-emerald-500">₹{pay.amount.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <StatusBadge status={pay.status} />
                  </td>
                  <td className="px-6 py-5 text-right flex justify-end gap-2">
                    <button onClick={(e) => openEdit(pay as Payment, e)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button onClick={(e) => handleDelete(pay.id, e)} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
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
            <CreditCard className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">No Payments Received</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] max-w-sm mb-8">
            Collect and record payments against your invoices here.
          </p>
          <button 
            onClick={() => {
              setNewPayment({
                customerId: "",
                invoiceId: "",
                amount: 0,
                method: "Bank Transfer",
                status: "Completed",
                referenceNumber: "",
                date: new Date().toISOString().split('T')[0]
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <DollarSign className="w-4 h-4" />
            Record First Payment
          </button>
        </div>
      )}

      {/* Record Payment Modal */}
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
                   <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">{newPayment.id ? 'Edit Payment' : 'Record a Payment'}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">General Ledger Entry</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                   <X className="w-5 h-5 text-[var(--text-muted)]" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <form onSubmit={handleSave} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Customer Account
                      </label>
                      <select 
                        required
                        value={newPayment.customerId}
                        onChange={(e) => setNewPayment({ ...newPayment, customerId: e.target.value })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none"
                      >
                        <option value="">Choose a customer...</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={lead.id}>{lead.name} ({lead.mobileNumber})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Apply To Invoice (Optional)
                      </label>
                      <select 
                        value={newPayment.invoiceId}
                        onChange={(e) => setNewPayment({ ...newPayment, invoiceId: e.target.value })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none disabled:opacity-50"
                        disabled={!newPayment.customerId}
                      >
                        <option value="">None / Advance Payment</option>
                        {invoices
                          .filter(inv => inv.customerId === newPayment.customerId && inv.status !== 'Paid')
                          .map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.id} - ₹{inv.total.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/[0.02] dark:bg-white/[0.02] p-6 rounded-3xl border border-black/5 dark:border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Amount Received</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input 
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={newPayment.amount || ''}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border border-black/10 dark:border-white/10 text-xl font-black"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payment Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input 
                          type="date"
                          required
                          value={newPayment.date}
                          onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border border-black/10 dark:border-white/10 text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payment Method</label>
                      <select 
                        required
                        value={newPayment.method}
                        onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold appearance-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                         <Hash className="w-3 h-3" /> Transaction Reference
                      </label>
                      <input 
                        type="text"
                        value={newPayment.referenceNumber}
                        onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent)] border-none text-sm font-bold"
                        placeholder="Chk #, Txn ID..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payment Status</label>
                    <div className="flex gap-4">
                      {['Completed', 'Pending'].map((status) => (
                        <label key={status} className="flex-1 cursor-pointer">
                          <input 
                            type="radio" 
                            name="status" 
                            className="peer sr-only"
                            checked={newPayment.status === status}
                            onChange={() => setNewPayment({ ...newPayment, status: status as Payment['status'] })}
                          />
                          <div className="text-center py-3 rounded-xl text-sm font-bold border-2 border-transparent bg-black/5 dark:bg-white/5 peer-checked:border-[var(--accent)] peer-checked:text-[var(--accent)] peer-checked:bg-[var(--accent)]/10 transition-all">
                            {status}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--accent)]/30 hover:opacity-95 transition-all text-sm disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : (newPayment.id ? "Save Changes" : "Record Payment")}
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

