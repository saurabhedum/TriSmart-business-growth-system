import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { addExpense, deleteExpense } from '../lib/db';
import { Wallet, Plus, Trash2, Search, TrendingDown, IndianRupee } from 'lucide-react';

export function ExpensesView() {
  const { expenses } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Operations');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['All', 'Operations', 'Rent', 'Salaries', 'Marketing', 'Inventory', 'Other'];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = String(e.description).toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, search, categoryFilter]);

  const totalFiltered = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!amount || !description) return;
    try {
      await addExpense({
        amount: Number(amount),
        description,
        category,
        date
      });
      setIsAdding(false);
      setAmount('');
      setDescription('');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col gap-8 pb-12 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase flex items-center gap-3 text-[var(--text-main)] mb-2">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
               <TrendingDown className="w-8 h-8" />
            </div>
            Expenses & Tracking
          </h1>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest pl-14">
            Track outbound cashflow
          </p>
        </div>
        
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-[var(--text-main)] text-[var(--bg-color)] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:scale-[1.02] transition-transform">
          {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add This Expense</>}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="flex flex-col gap-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">Amount</label>
                  <IndianRupee className="w-4 h-4 absolute left-4 bottom-4 text-[var(--text-muted)] pointer-events-none" />
                  <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-rose-500 text-sm font-bold disabled:opacity-50" placeholder="0.00" />
               </div>
               
               <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">Description</label>
                  <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-rose-500 text-sm font-bold disabled:opacity-50" placeholder="Electricity Bill..." />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">Category</label>
                  <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-rose-500 text-sm font-bold">
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               
               <div className="flex flex-col gap-2 relative md:col-span-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-rose-500 text-sm font-bold disabled:opacity-50 uppercase tracking-widest" />
               </div>

               <div className="flex items-end">
                  <button type="submit" className="w-full h-12 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
                    Save Expense
                  </button>
               </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar hide-scrollbar">
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === c ? 'bg-[var(--text-main)] text-[var(--bg-color)]' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                 {c}
              </button>
            ))}
         </div>
         
         <div className="w-full md:w-64 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border-none text-xs font-bold uppercase tracking-wide focus:ring-2 focus:ring-[var(--text-main)]" />
         </div>
      </div>

      <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">
         <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Expense Records</h2>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-2">Total</span>
              <span className="text-lg font-black text-rose-500">₹{totalFiltered.toFixed(2)}</span>
            </div>
         </div>
         
         <div className="divide-y divide-black/5 dark:divide-white/5 overflow-y-auto max-h-[600px] custom-scrollbar">
            {filteredExpenses.length === 0 ? (
              <div className="py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">No expenses found</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                      Add a new expense record to get started. 
                    </p>
                  </div>
                </div>
              </div>
            ) : filteredExpenses.map(expense => (
              <div key={expense.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                       <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase text-[var(--text-main)]">{expense.description}</h3>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[var(--text-muted)] uppercase tracking-wide">{expense.category}</span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">{expense.date}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-lg font-black text-[var(--text-main)]">₹{expense.amount.toFixed(2)}</span>
                    <button onClick={() => deleteExpense(expense.id)} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-muted)] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </motion.div>
  );
}
