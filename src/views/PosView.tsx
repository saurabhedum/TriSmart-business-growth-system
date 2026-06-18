import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { addInventoryOrder } from '../lib/db';
import { ShoppingCart, Plus, Minus, Search, Package, CheckCircle2, Wallet } from 'lucide-react';

export function PosView() {
  const { inventoryItems } = useData();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{ id: string, name: string, price: number, cost: number, qty: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => 
      String(item.name).toLowerCase().includes(search.toLowerCase()) && item.stock && item.stock > 0
    );
  }, [inventoryItems, search]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if(existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: String(item.name || 'Unnamed'), price: item.price || 0, cost: item.costPrice || 0, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    const existing = cart.find(c => c.id === id);
    if(existing && existing.qty > 1) {
      setCart(cart.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c));
    } else {
      setCart(cart.filter(c => c.id !== id));
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if(cart.length === 0) return;
    setIsProcessing(true);
    try {
      for (const item of cart) {
        await addInventoryOrder({
          itemId: item.id,
          itemName: item.name,
          quantity: item.qty,
          totalPrice: item.price * item.qty,
          totalCost: item.cost * item.qty,
          status: 'completed',
          source: 'POS'
        });
      }
      setSuccess(true);
      setCart([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch(err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 pb-6">
      
      {/* Product List */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
         <h1 className="text-3xl font-black uppercase flex items-center gap-3 text-[var(--text-main)] mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
               <ShoppingCart className="w-8 h-8" />
            </div>
            Quick POS
         </h1>
         <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[var(--bg-color)] border border-black/5 dark:border-white/5 text-sm font-bold uppercase tracking-wide focus:border-indigo-500 outline-none transition-all shadow-sm focus:shadow-md"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-4 content-start pr-2 custom-scrollbar">
            {filteredItems.map(item => (
              <div key={item.id} onClick={() => addToCart(item)} className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 p-6 rounded-3xl cursor-pointer hover:border-black/20 dark:hover:border-white/20 hover:shadow-lg transition-all flex flex-col items-center justify-center text-center gap-3 group">
                 <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-main)] group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                   <Package className="w-6 h-6" />
                 </div>
                 <h3 className="text-xs font-black uppercase text-[var(--text-main)] line-clamp-2">{String(item.name || 'Unnamed')}</h3>
                 <p className="text-sm font-bold text-emerald-500">₹{item.price || 0}</p>
                 <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Stock: {item.stock}</p>
              </div>
            ))}
         </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full xl:w-[400px] flex flex-col bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl relative h-full">
        <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">Current Sale</h2>
            <span className="text-xs font-black px-3 py-1 bg-black/10 dark:bg-white/10 rounded-xl text-[var(--text-main)]">{cart.length} items</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
           <AnimatePresence>
             {cart.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-between items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5">
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase text-[var(--text-main)] truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-emerald-500 mt-1">₹{item.price} each</p>
                   </div>
                   <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl p-1">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-color)] rounded-lg transition-colors shadow-sm">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black w-6 text-center">{item.qty}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-color)] rounded-lg transition-colors shadow-sm text-indigo-500">
                        <Plus className="w-4 h-4" />
                      </button>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
           {cart.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-12">
                <ShoppingCart className="w-16 h-16 mb-4 text-[var(--text-muted)]" />
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Cart is empty</p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2">Select items to begin</p>
             </div>
           )}
        </div>

        <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5">
           <div className="flex justify-between items-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Subtotal</span>
              <span className="text-2xl font-black text-[var(--text-main)]">₹{total.toFixed(2)}</span>
           </div>
           
           {success ? (
             <div className="w-full h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" /> Payment Complete
             </div>
           ) : (
             <button disabled={cart.length === 0 || isProcessing} onClick={handleCheckout} className="w-full h-14 rounded-2xl bg-[var(--text-main)] text-[var(--bg-color)] flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm disabled:opacity-50 hover:scale-[1.02] transition-transform shadow-xl">
                {isProcessing ? <span className="animate-pulse">Processing...</span> : <><Wallet className="w-5 h-5" /> Charge ₹{total.toFixed(2)}</>}
             </button>
           )}
        </div>
      </div>
    </motion.div>
  );
}
