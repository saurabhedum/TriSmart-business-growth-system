import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, Folder, Plus, X, Tag, IndianRupee, Image as ImageIcon, Box, Link2, Search, TrendingUp, TrendingDown, PackageX, Brain, Sparkles, AlertTriangle, ChevronRight, ChevronDown, ListTree, LayoutGrid, Plane, Users, Send } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { 
   InventoryCategory, 
   InventoryItem, 
   subscribeToInventoryCategories, 
   subscribeToInventoryItems,
   saveInventoryCategory,
   saveInventoryItem,
   deleteInventoryCategory,
   deleteInventoryItem,
   Lead,
   subscribeToLeads,
   subscribeToSettings,
   AppSettings
} from "../lib/db";
import { toast } from "react-hot-toast";

const InventoryFlipCard = ({ item, isSelected, onToggleSelect, onEdit, onDelete, onShare, onCopyLink }: any) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="group relative w-full h-[480px] [perspective:1000px] cursor-pointer" onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}>
      <div className={cn(
        "relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]",
        flipped ? "[transform:rotateY(180deg)]" : ""
      )}>
        {/* Front Face */}
        <div className="absolute inset-0 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-xl overflow-hidden flex flex-col pt-0 pb-4 px-0 border border-neutral-100 dark:border-neutral-800 [backface-visibility:hidden]">
          <div className="relative w-full h-[200px] shrink-0 rounded-b-[2rem] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
             {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <ImageIcon className="w-8 h-8 text-neutral-300" />
                </div>
             )}
             <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id, e); }}
                className={cn(
                  "absolute top-4 left-4 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 border border-white/40 backdrop-blur-md shadow-sm",
                  isSelected ? "bg-accent border-accent text-white" : "bg-black/20 text-white opacity-0 group-hover:opacity-100"
                )}
              >
               {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>
          </div>
          
          <div className="px-5 pt-5 flex-1 flex flex-col">
            <h4 className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white truncate mb-1">{item.name}</h4>
            <div className="flex flex-col mb-2">
              <div className="flex items-center text-xs font-semibold text-neutral-500 truncate">
                <Tag className="w-3 h-3 mr-1 opacity-70" /> {item.specifications || 'Standard'}
              </div>
            </div>
            
            <p className="text-xs text-neutral-500 line-clamp-3 mb-4 leading-relaxed font-medium">
              {item.description || "Description not available."}
            </p>
            
            <div className="mt-auto grid grid-cols-3 gap-2 py-3 border-t border-b border-black/5 dark:border-white/5">
              <div className="flex flex-col items-center">
                 <span className="text-[9px] text-accent font-bold tracking-widest uppercase mb-1">Stock</span>
                 <span className="text-[13px] font-black text-blue-500/90">{item.stock || 0}</span>
              </div>
              <div className="flex flex-col items-center border-l border-r border-black/5 dark:border-white/5">
                 <span className="text-[9px] text-accent font-bold tracking-widest uppercase mb-1">Status</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center h-[20px]">{item.status || 'Active'}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[9px] text-accent font-bold tracking-widest uppercase mb-1">Velocity</span>
                 <span className="text-[13px] font-black text-rose-500">{item.turnoverVelocity || (item.stock > 10 ? 'Fast' : 'Slow')}</span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-row items-end justify-between px-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col">
                 <span className="text-[9px] text-neutral-400 font-bold tracking-widest uppercase mb-1">Total Price</span>
                 <span className="text-xl font-black tracking-tighter text-neutral-900 dark:text-white flex items-center">
                    <IndianRupee className="w-4 h-4 mr-0.5 text-neutral-400" />{item.price?.toLocaleString() || '0'}
                 </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onShare(item, e); }}
                className="w-11 h-11 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:scale-105 active:scale-95 transition-transform shadow-lg z-20"
              >
                 <Plane className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Back Face */}
        <div className="absolute inset-0 bg-neutral-900 text-white rounded-[2rem] shadow-2xl p-6 border border-neutral-800 flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]" onClick={(e) => e.stopPropagation()}>
           <div className="flex items-center justify-between mb-8">
             <h4 className="font-bold text-xl tracking-tight text-white/90">Details</h4>
             <button onClick={(e) => { e.stopPropagation(); setFlipped(false); }} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors z-20">
               <X className="w-4 h-4 text-white" />
             </button>
           </div>
           
           <div className="space-y-5 flex-1 p-2">
             <div className="flex justify-between items-center pb-3 border-b border-white/10">
               <span className="text-sm text-white/60 font-medium">Reorder Level</span>
               <span className="font-bold text-base">{item.reorderLevel || 5} units</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-white/10">
               <span className="text-sm text-white/60 font-medium">Cost Price</span>
               <span className="font-bold text-base flex items-center"><IndianRupee className="w-3 h-3 mr-0.5" />{item.costPrice?.toLocaleString() || '0'}</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-white/10">
               <span className="text-sm text-white/60 font-medium">Revenue</span>
               <span className="font-bold text-base flex items-center text-emerald-400"><IndianRupee className="w-3 h-3 mr-0.5" />{item.revenueGenerated?.toLocaleString() || '0'}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-white/60 font-medium">Added On</span>
               <span className="font-bold text-sm tracking-tight">{new Date(item.createdAt).toLocaleDateString()}</span>
             </div>
           </div>
           
           <div className="flex flex-col gap-3 mt-auto">
             <button
               onClick={(e) => { e.stopPropagation(); onCopyLink(item, e); }}
               className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors text-white flex items-center justify-center gap-2"
             >
               <Link2 className="w-4 h-4" /> Copy Ordering Link
             </button>
             <div className="flex gap-3">
                 <button
                   onClick={(e) => { e.stopPropagation(); onEdit(item, e); }}
                   className="flex-1 py-3 bg-accent/90 hover:bg-accent rounded-xl font-bold text-sm transition-colors text-white"
                 >
                   Edit
                 </button>
                 <button
                   onClick={(e) => { e.stopPropagation(); onDelete(item.id, e); }}
                   className="flex-1 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold text-sm transition-colors"
                 >
                   Delete
                 </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryView() {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'intelligence' | 'profitability'>('catalog');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    imageUrl: '',
    status: 'active'
  });

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

  const [shareItemModalOpen, setShareItemModalOpen] = useState(false);
  const [itemToShare, setItemToShare] = useState<InventoryItem | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [shareRecipients, setShareRecipients] = useState('');
  const [shareMethod, setShareMethod] = useState<'whatsapp'|'instagram'>('whatsapp');
  const [shareMode, setShareMode] = useState<'manual'|'api'>('api');

  useEffect(() => {
    const unsub1 = subscribeToInventoryCategories(setCategories);
    const unsub2 = subscribeToLeads(setLeads);
    const unsub3 = subscribeToSettings((s) => s && setSettings(s));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  useEffect(() => {
    // Gather items that belong to the selected category or its nested sub-categories.
    const unsub = subscribeToInventoryItems(activeCategoryId, setItems);
    return () => unsub();
  }, [activeCategoryId]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await saveInventoryCategory({ 
      name: newCategoryName, 
      parentId: newCategoryParentId || undefined 
    });
    setIsCategoryModalOpen(false);
    setNewCategoryName("");
    setNewCategoryParentId(null);
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category and all its items? This action cannot be undone.',
      onConfirm: async () => {
        await deleteInventoryCategory(id);
        if (activeCategoryId === id) setActiveCategoryId(null);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !activeCategoryId) {
      toast.error("Please select a category first.");
      return;
    }
    await saveInventoryItem({ ...newItem, categoryId: activeCategoryId });
    setIsItemModalOpen(false);
    setNewItem({ name: '', price: 0, stock: 0, description: '', imageUrl: '', status: 'active', specifications: '' });
  };

  const handleEditItem = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        await deleteInventoryItem(id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!selectedItems.length) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Products',
      message: `Are you sure you want to delete ${selectedItems.length} selected products? This action cannot be undone.`,
      onConfirm: async () => {
        await Promise.all(selectedItems.map(id => deleteInventoryItem(id)));
        setSelectedItems([]);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkImport = async () => {
    if (!importText.trim() || !activeCategoryId) return;
    try {
      const rows = importText.split('\n').filter(r => r.trim());
      const newItemsPromises = rows.map(row => {
        const [name, priceStr, stockStr, status] = row.split(',').map(s => s.trim());
        if (!name) return null;
        return saveInventoryItem({
          categoryId: activeCategoryId,
          name,
          price: parseFloat(priceStr) || 0,
          stock: parseInt(stockStr, 10) || 0,
          status: (status as any) || 'active',
        });
      }).filter(Boolean);
      await Promise.all(newItemsPromises);
      setIsImportModalOpen(false);
      setImportText("");
      toast.success(`Successfully imported ${newItemsPromises.length} items`);
    } catch (err) {
      toast.error("Failed to parse import data. Make sure it's comma separated: Name, Price, Stock, Status");
    }
  };

  const handleShareProductSend = async () => {
    if (!itemToShare || !shareRecipients) {
      toast.error("Please select recipients.");
      return;
    }
    const link = `${window.location.origin}/product/${itemToShare.id}?owner=${auth.currentUser?.uid}`;
    const msgText = `Check out this product from our catalog:\n*${itemToShare.name}*\n${itemToShare.specifications ? `Spec: ${itemToShare.specifications}\n` : ''}${itemToShare.description ? `${itemToShare.description}\n` : ''}\nPrice: ₹${itemToShare.price?.toLocaleString()}\n\nOrder here: ${link}`;

    if (shareMode === 'manual') {
      if (shareMethod === 'whatsapp') {
        window.open(`https://wa.me/${shareRecipients.replace(/\D/g, '')}?text=${encodeURIComponent(msgText)}`, '_blank');
      } else {
        window.open(`https://ig.me/m/${shareRecipients}?text=${encodeURIComponent(msgText)}`, '_blank');
      }
      setShareItemModalOpen(false);
      return;
    }

    // API Mode
    const toastId = toast.loading(`Sending via ${shareMethod === 'whatsapp' ? 'WhatsApp API' : 'Instagram API'}...`);
    try {
      const token = shareMethod === 'whatsapp' ? settings.whatsappApiToken : settings.instaApiToken;
      if (!token) {
         toast.error(`Missing API token for ${shareMethod} in settings.`, { id: toastId });
         return;
      }
      
      const numbersToMessage = shareRecipients.split(',').map(s => s.trim()).filter(Boolean);
      
      let sent = 0;
      for (const recipient of numbersToMessage) {
        let payload;
        let endpoint;
        
        if (shareMethod === 'whatsapp') {
            if (!settings.whatsappPhoneId) {
                toast.error("Missing WhatsApp Phone Number ID in settings.", { id: toastId });
                return;
            }
            endpoint = `https://graph.facebook.com/v18.0/${settings.whatsappPhoneId}/messages`;
            payload = {
                messaging_product: "whatsapp",
                to: recipient,
                type: "text",
                text: { body: msgText }
            };
        } else {
            endpoint = `https://graph.facebook.com/v18.0/${settings.instaAccountId || 'me'}/messages?access_token=${encodeURIComponent(token)}`;
            payload = {
                recipient: { id: recipient },
                message: { text: msgText }
            };
        }

        const res = await fetch(endpoint, {
           method: 'POST',
           headers: {
             ...(shareMethod === 'whatsapp' ? { 'Authorization': `Bearer ${token}` } : {}),
             'Content-Type': 'application/json'
           },
           body: JSON.stringify(payload)
        });
        if (res.ok) sent++;
      }
      
      toast.success(`Successfully sent via API to ${sent} recipient(s)!`, { id: toastId });
      setShareItemModalOpen(false);
    } catch (e: any) {
      toast.error(`Failed to send: ${e.message}`, { id: toastId });
    }
  };

  const toggleCategoryExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build category tree
  const categoryTree = useMemo(() => {
    const rootCats = categories.filter(c => !c.parentId);
    const getChildren = (parentId: string) => categories.filter(c => c.parentId === parentId);
    
    const renderTree = (cats: InventoryCategory[], level: number = 0) => {
      return cats.map(cat => {
        const children = getChildren(cat.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedCategories.has(cat.id);
        const isActive = activeCategoryId === cat.id;

        return (
          <div key={cat.id} className="w-full">
            <div 
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer mb-1",
                isActive ? "bg-accent/10 text-accent" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              )}
              style={{ paddingLeft: `${(level * 1.5) + 0.75}rem` }}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {hasChildren ? (
                  <button 
                    onClick={(e) => toggleCategoryExpand(cat.id, e)} 
                    className="p-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className="w-5 shrink-0" />
                )}
                <Folder className="w-4 h-4 opacity-70 shrink-0" /> 
                <span className="truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewCategoryParentId(cat.id);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-accent rounded-md hover:bg-accent/10"
                  title="Add Subcategory"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => handleDeleteCategory(cat.id, e)}
                  className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-md hover:bg-rose-500/10"
                  title="Delete Category"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <div className="flex flex-col">
                {renderTree(children, level + 1)}
              </div>
            )}
          </div>
        );
      });
    };

    return renderTree(rootCats);
  }, [categories, activeCategoryId, expandedCategories]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || (item.specifications && item.specifications.toLowerCase().includes(q));
    });
  }, [items, searchQuery]);

  const insights = useMemo(() => {
    if (items.length === 0) {
      return [
        {
          id: 'no_data',
          type: 'neutral',
          icon: <Brain className="w-5 h-5" />,
          title: "Awaiting Input Data",
          description: "Add some products to your inventory so our real-time analyst can start tracking capital efficiency and identifying sales trajectories.",
          actionText: "Add First Product",
          onAction: () => setActiveTab('catalog'),
          bgClass: "bg-neutral-50 dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-600",
          iconClass: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
        }
      ];
    }

    const generated = [];

    const deadStockItems = items.filter(i => i.turnoverVelocity === 'Dead' || (i.status === 'inactive' && i.stock && i.stock > 0));
    if (deadStockItems.length > 0) {
      const deadCapital = deadStockItems.reduce((acc, item) => acc + ((item.costPrice || item.price || 0) * (item.stock || 0)), 0);
      generated.push({
        id: 'dead_stock',
        type: 'negative',
        icon: <TrendingDown className="w-5 h-5" />,
        title: "Capital Locked in Dead Stock",
        description: `You have ${deadStockItems.length} items categorized as Dead Stock tying up approximately ₹${deadCapital.toLocaleString()} in capital. To optimize margins, consider creating a broadcast campaign.`,
        actionText: "Review Dead Stock",
        onAction: () => { setActiveTab('catalog'); setSearchQuery(deadStockItems[0].name); },
        bgClass: "bg-rose-50/50 dark:bg-rose-900/10 hover:border-rose-200 dark:hover:border-rose-800/50",
        iconClass: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
      });
    }

    const lowStockItems = items.filter(i => i.stock !== undefined && i.stock <= (i.reorderLevel !== undefined ? i.reorderLevel : 5) && i.status !== 'inactive' && i.status !== 'archived');
    if (lowStockItems.length > 0) {
      const topLow = lowStockItems.slice(0, 2).map(i => i.name).join(', ');
      generated.push({
        id: 'low_stock',
        type: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: "Critical Low Stock Alerts",
        description: `Stock is critically low for ${lowStockItems.length} active items (e.g. ${topLow}). Restock soon to prevent order delays and missed conversion opportunities.`,
        actionText: "Review Procurement",
        onAction: () => { setActiveTab('catalog'); setSearchQuery(lowStockItems[0].name); },
        bgClass: "bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-200 dark:hover:border-amber-800/50",
        iconClass: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
      });
    }

    const fastItems = items.filter(i => i.turnoverVelocity === 'Fast' || (i.price && i.price > 10000));
    if (fastItems.length > 0) {
      const bestItem = fastItems[0];
      generated.push({
        id: 'fast_moving',
        type: 'positive',
        icon: <TrendingUp className="w-5 h-5" />,
        title: "High Value Flag",
        description: `Your product "${bestItem.name}" is marked as high-priority. Review its stock availability proactively to protect revenue flow.`,
        actionText: "Review Item",
        onAction: () => { setActiveTab('catalog'); setSearchQuery(bestItem.name); },
        bgClass: "bg-indigo-50/50 dark:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800/50",
        iconClass: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
      });
    }

    // Stage 5: Prediction logic
    const stockOutRisk = items.filter(i => (i.stock || 0) < (i.reorderLevel || 5) * 1.5 && i.turnoverVelocity === 'Fast');
    if (stockOutRisk.length > 0) {
       generated.push({
         id: 'stock_out_prediction',
         type: 'warning',
         icon: <Brain className="w-5 h-5" />,
         title: "Stock-Out Prediction",
         description: `Based on sales velocity, ${stockOutRisk.length} fast-moving items are predicted to stock out within 7 days. Replenish now to avoid ₹${stockOutRisk.reduce((a, b) => a + (b.price || 0), 0).toLocaleString()} in potential lost revenue.`,
         actionText: "Replenish Order",
         onAction: () => { setActiveTab('catalog'); },
         bgClass: "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200",
         iconClass: "bg-orange-100 text-orange-600"
       });
    }

    if (generated.length === 0) {
       generated.push({
        id: 'stable',
        type: 'positive',
        icon: <Sparkles className="w-5 h-5" />,
        title: "Inventory Metrics Optimal",
        description: "Your inventory stock levels, dead stock tracking, and reorder margins are all looking completely healthy based on current metrics.",
        actionText: "View Catalog",
        onAction: () => setActiveTab('catalog'),
        bgClass: "bg-emerald-50/50 dark:bg-emerald-900/10 hover:border-emerald-200 dark:hover:border-emerald-800/50",
        iconClass: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      });
    }

    return generated;
  }, [items]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
               <Package className="w-4 h-4" />
             </div>
             <span className="text-xs font-bold uppercase tracking-widest text-accent">Asset Management</span>
           </div>
           <h1 className="text-3xl font-black tracking-tight mb-1">Product Inventory</h1>
           <p className="text-sm text-neutral-500">
             Organize your catalogs, pricing, categorise products and analyze inventory health.
           </p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('catalog')} 
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === 'catalog' ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            Catalog
          </button>
          <button 
            onClick={() => setActiveTab('intelligence')} 
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === 'intelligence' ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('profitability')} 
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === 'profitability' ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            Profitability
          </button>
        </div>
      </div>

      {activeTab === 'catalog' && (
      <div className="flex flex-col md:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-tight">Categories</h3>
                <button 
                  onClick={() => {
                    setNewCategoryParentId(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                   <Plus className="w-4 h-4" />
                </button>
             </div>
             <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2 min-h-[300px]">
                <button 
                  onClick={() => setActiveCategoryId(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all mb-2",
                    !activeCategoryId ? "bg-accent/10 text-accent" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  )}
                >
                   <Box className="w-4 h-4 opacity-80" /> All Products
                </button>
                <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2 mb-2" />
                <div className="space-y-0.5">
                  {categoryTree.length > 0 ? categoryTree : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      No categories yet.<br/>Click + to create one.
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Items Section */}
          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="relative flex-1 w-full max-w-md">
                   <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
                      <Search className="w-4 h-4" />
                   </div>
                   <input
                      type="text"
                      placeholder="Search products by name or spec..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-accent font-medium text-sm transition-all"
                   />
                </div>
                
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 mr-2 shrink-0">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={cn("p-2.5 transition-colors", viewMode === 'grid' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50")}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={cn("p-2.5 transition-colors", viewMode === 'list' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50")}
                    >
                      <ListTree className="w-4 h-4" />
                    </button>
                  </div>

                  {activeCategoryId && (
                    <>
                      {selectedItems.length > 0 && (
                          <button 
                            onClick={handleBulkDelete}
                            className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all"
                          >
                            Delete ({selectedItems.length})
                          </button>
                      )}
                      <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                      >
                          Import CSV
                      </button>
                      <button 
                        onClick={() => {
                            setNewItem({ name: '', price: 0, stock: 0, description: '', imageUrl: '', status: 'active', specifications: '' });
                            setIsItemModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                      >
                          <Plus className="w-4 h-4" /> Add Product
                      </button>
                    </>
                  )}
                </div>
             </div>

             <div className="flex items-center justify-between text-sm text-neutral-500 font-medium">
                <span>
                  {activeCategoryId ? (categories.find(c => c.id === activeCategoryId)?.name || 'Unknown') : 'All Products'}
                  <span className="text-neutral-400 ml-2">({filteredItems.length} items)</span>
                </span>
             </div>

             {filteredItems.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
                   <Box className="w-12 h-12 text-neutral-300 mb-4" />
                   <h4 className="text-sm font-bold text-neutral-600 dark:text-neutral-400">No products found</h4>
                   {searchQuery ? (
                     <p className="text-xs text-neutral-500 mt-1">Try adjusting your search query.</p>
                   ) : activeCategoryId ? (
                     <p className="text-xs text-neutral-500 mt-1">Add a new product or import from CSV to get started.</p>
                   ) : (
                     <p className="text-xs text-neutral-500 mt-1">Select a category on the left to add products.</p>
                   )}
                </div>
             ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                   {filteredItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex w-full"
                    >
                       <InventoryFlipCard 
                          item={item} 
                          isSelected={selectedItems.includes(item.id)} 
                          onToggleSelect={handleToggleSelect} 
                          onEdit={handleEditItem} 
                          onDelete={handleDeleteItem} 
                          onShare={(it: any, e: any) => {
                             setItemToShare(it);
                             setShareItemModalOpen(true);
                          }}
                          onCopyLink={(it: any, e: any) => {
                             if (!auth.currentUser) return;
                             const link = `${window.location.origin}/product/${it.id}?owner=${auth.currentUser.uid}`;
                             navigator.clipboard.writeText(link);
                             toast.success("Order link copied");
                          }}
                       />
                    </motion.div>
                   ))}
                </div>
             ) : (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="px-4 py-3 w-10"></th>
                        <th className="px-4 py-3 min-w-[200px]">Product Name</th>
                        <th className="px-4 py-3 min-w-[100px]">Price</th>
                        <th className="px-4 py-3 min-w-[100px]">Stock</th>
                        <th className="px-4 py-3 min-w-[100px]">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {filteredItems.map(item => (
                        <tr 
                          key={item.id}
                          onClick={(e) => handleEditItem(item, e)}
                          className={cn(
                            "group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors",
                            selectedItems.includes(item.id) && "bg-accent/5 dark:bg-accent/10"
                          )}
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => handleToggleSelect(item.id, e)}
                              className={cn(
                                "w-5 h-5 rounded flex items-center justify-center transition-all border",
                                selectedItems.includes(item.id) 
                                  ? "bg-accent border-accent text-white" 
                                  : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600"
                              )}
                            >
                             {selectedItems.includes(item.id) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.imageUrl ? (
                                   <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                   <ImageIcon className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-neutral-900 dark:text-white truncate">{item.name}</div>
                                {item.specifications && <div className="text-[10px] text-neutral-500 truncate">{item.specifications}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 flex items-center h-[65px]">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5 opacity-50" />{item.price?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold",
                              (item.stock || 0) <= (item.reorderLevel || 5) ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            )}>
                              {item.stock || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                              item.status === 'draft' ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" :
                              item.status === 'archived' ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" :
                              item.status === 'inactive' ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            )}>
                              {item.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   if (!auth.currentUser) return;
                                   const link = `${window.location.origin}/product/${item.id}?owner=${auth.currentUser.uid}`;
                                   navigator.clipboard.writeText(link);
                                   toast.success("Order link copied");
                                }}
                                className="w-8 h-8 rounded-lg text-neutral-500 hover:text-accent hover:bg-accent/10 flex items-center justify-center transition-colors"
                              >
                                 <Link2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="w-8 h-8 rounded-lg text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
      </div>
      )}

      {activeTab === 'intelligence' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
           {/* Metric Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between">
                 <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Box className="w-5 h-5" />
                    </div>
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-neutral-500 mb-1">Total Products</h4>
                   <div className="text-2xl font-bold tracking-tight">{items.length}</div>
                 </div>
              </div>
              
              <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                 <div className="flex items-start justify-between mb-4 relative">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <PackageX className="w-5 h-5" />
                    </div>
                 </div>
                 <div className="relative">
                   <h4 className="text-sm font-medium text-neutral-500 mb-1">Dead Stock</h4>
                   <div className="flex items-baseline gap-2">
                     <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{items.filter(i => i.turnoverVelocity === 'Dead').length}</div>
                     <span className="text-xs text-rose-500 font-medium tracking-wide">items</span>
                   </div>
                 </div>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                 <div className="flex items-start justify-between mb-4 relative">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                 </div>
                 <div className="relative">
                   <h4 className="text-sm font-medium text-neutral-500 mb-1">Low Stock Alerts</h4>
                   <div className="flex items-baseline gap-2">
                     <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{items.filter(i => i.stock !== undefined && i.stock <= (i.reorderLevel !== undefined ? i.reorderLevel : 5)).length}</div>
                     <span className="text-xs text-amber-500 font-medium tracking-wide">items</span>
                   </div>
                 </div>
              </div>

              <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                 <div className="flex items-start justify-between mb-4 relative">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                 </div>
                 <div className="relative">
                   <h4 className="text-sm font-medium text-neutral-500 mb-1">High Profit Range</h4>
                   <div className="flex items-baseline gap-2">
                     <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{items.filter(i => i.costPrice && i.price && i.price > i.costPrice * 1.5).length}</div>
                     <span className="text-xs text-emerald-500 font-medium tracking-wide">items</span>
                   </div>
                 </div>
              </div>
           </div>

           {/* Insights */}
           <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-accent/10 text-accent rounded-xl">
                   <Sparkles className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                    AI Inventory Analyst
                 </h3>
              </div>
                        <div className="space-y-4">
                 {insights.map(insight => (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       key={insight.id} 
                       className={cn("flex items-start gap-4 p-5 rounded-2xl border transition-colors", insight.bgClass || "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800")}
                    >
                       <div className={cn("p-2 rounded-xl shrink-0", insight.iconClass || "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400")}>
                         {insight.icon}
                       </div>
                       <div>
                          <h4 className="font-bold text-[15px] mb-1.5 tracking-tight">{insight.title}</h4>
                          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 mb-4">
                            {insight.description}
                          </p>
                          <button 
                            onClick={insight.onAction}
                            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-sm"
                          >
                            {insight.actionText}
                          </button>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'profitability' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem]">
                 <h3 className="text-xl font-black uppercase tracking-tight text-emerald-600 mb-2">Total Inventory Value</h3>
                 <div className="text-4xl font-black text-emerald-600 mb-1">
                    ₹{items.reduce((acc, i) => acc + ((i.costPrice || 0) * (i.stock || 0)), 0).toLocaleString()}
                 </div>
                 <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Total Capital Investment</p>
              </div>

              <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem]">
                 <h3 className="text-xl font-black uppercase tracking-tight text-indigo-600 mb-2">Potential Margin</h3>
                 <div className="text-4xl font-black text-indigo-600 mb-1">
                    ₹{items.reduce((acc, i) => acc + (((i.price || 0) - (i.costPrice || 0)) * (i.stock || 0)), 0).toLocaleString()}
                 </div>
                 <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest">Expected Profit on Current Stock</p>
              </div>

              <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2rem]">
                 <h3 className="text-xl font-black uppercase tracking-tight text-rose-600 mb-2">Dead Capital</h3>
                 <div className="text-4xl font-black text-rose-600 mb-1">
                    ₹{items.filter(i => i.turnoverVelocity === 'Dead').reduce((acc, i) => acc + ((i.costPrice || 0) * (i.stock || 0)), 0).toLocaleString()}
                 </div>
                 <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest">Capital at Risk in Slow Stock</p>
              </div>
           </div>

           <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8">
              <h3 className="text-lg font-black uppercase tracking-tight mb-8">Margin Intelligence per Item</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black uppercase text-neutral-400 border-b border-black/5">
                          <th className="pb-4">Product</th>
                          <th className="pb-4 text-right">Cost</th>
                          <th className="pb-4 text-right">M.R.P</th>
                          <th className="pb-4 text-right">Margin %</th>
                          <th className="pb-4 text-right">Profit Contribution</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                       {items.sort((a,b) => ((b.price || 0) - (b.costPrice || 0)) - ((a.price || 0) - (a.costPrice || 0))).slice(0, 10).map(item => {
                          const margin = item.costPrice ? (((item.price || 0) - item.costPrice) / item.price!) * 100 : 0;
                          return (
                             <tr key={item.id} className="text-sm font-bold">
                                <td className="py-4">{item.name}</td>
                                <td className="py-4 text-right opacity-60">₹{item.costPrice?.toLocaleString()}</td>
                                <td className="py-4 text-right">₹{item.price?.toLocaleString()}</td>
                                <td className={`py-4 text-right font-black ${margin > 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                   {margin.toFixed(1)}%
                                </td>
                                <td className="py-4 text-right text-emerald-500">₹{((item.price || 0) - (item.costPrice || 0)).toLocaleString()}</td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCategoryModalOpen(false)}
          >
             <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800"
             >
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <h3 className="text-lg font-bold tracking-tight">
                    {newCategoryParentId ? "Add Subcategory" : "Create Category"}
                  </h3>
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveCategory} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Category Name</label>
                    <input
                      autoFocus
                      required
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Speakers, Cables..."
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 font-medium text-sm transition-all"
                    />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold shadow-sm transition-all">
                     Save Category
                  </button>
                </form>
             </motion.div>
          </motion.div>
        )}

        {isImportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsImportModalOpen(false)}
          >
             <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800"
             >
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <h3 className="text-lg font-bold tracking-tight">Bulk Import Products</h3>
                  <button type="button" onClick={() => setIsImportModalOpen(false)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">Paste your CSV data below. Ensure you are importing into the current category.</p>
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">Format: Name, Price, Stock, Status (active/draft/inactive)</p>
                  </div>
                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Wireless Headphones, 2999, 15, active&#10;HDMI Cable, 499, 100, active"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm font-mono tracking-tight resize-none whitespace-pre"
                  />
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold flex-1 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                      onClick={handleBulkImport}
                      disabled={!importText.trim()}
                      className="px-6 py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex-1 shadow-sm transition-all"
                    >
                       Start Import
                    </button>
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}

        {isItemModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsItemModalOpen(false)}
          >
             <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto"
             >
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <h3 className="text-lg font-bold tracking-tight">
                    {newItem.id ? "Edit Product" : "Add Product"}
                  </h3>
                  <button type="button" onClick={() => setIsItemModalOpen(false)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleSaveItem} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Product Name</label>
                        <input required type="text" value={newItem.name || ""} onChange={(e) => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Sony Wireless Headphones" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Short Description / Brand</label>
                        <textarea rows={2} value={newItem.description || ""} onChange={(e) => setNewItem({...newItem, description: e.target.value})} placeholder="Key selling points or brief summary..." className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm resize-none transition-all" />
                    </div>
                  </div>

                  {/* Pricing & Inventory */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Selling Price</label>
                        <input type="number" min="0" value={newItem.price === undefined || Number.isNaN(newItem.price) ? '' : newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value === '' ? undefined : parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Cost Price</label>
                        <input type="number" min="0" value={newItem.costPrice === undefined || Number.isNaN(newItem.costPrice) ? '' : newItem.costPrice} onChange={(e) => setNewItem({...newItem, costPrice: e.target.value === '' ? undefined : parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Available Stock</label>
                        <input type="number" min="0" value={newItem.stock === undefined || Number.isNaN(newItem.stock) ? '' : newItem.stock} onChange={(e) => setNewItem({...newItem, stock: e.target.value === '' ? undefined : parseInt(e.target.value, 10)})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Low Stock Alert Level</label>
                        <input type="number" min="0" value={newItem.reorderLevel === undefined || Number.isNaN(newItem.reorderLevel) ? '' : newItem.reorderLevel} onChange={(e) => setNewItem({...newItem, reorderLevel: e.target.value === '' ? undefined : parseInt(e.target.value, 10)})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                      </div>
                  </div>

                  {/* Classification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Visibility Status</label>
                        <select value={newItem.status || 'active'} onChange={(e) => setNewItem({...newItem, status: e.target.value as any})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm appearance-none transition-all">
                            <option value="active">Active (Visible)</option>
                            <option value="draft">Draft (Hidden)</option>
                            <option value="inactive">Inactive (Out of stock)</option>
                            <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Turnover Velocity</label>
                        <select value={newItem.turnoverVelocity || 'Medium'} onChange={(e) => setNewItem({...newItem, turnoverVelocity: e.target.value as any})} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm appearance-none transition-all">
                            <option value="Fast">Fast Moving (High demand)</option>
                            <option value="Medium">Medium Moving</option>
                            <option value="Slow">Slow Moving</option>
                            <option value="Dead">Dead Stock (Requires clearance)</option>
                        </select>
                      </div>
                  </div>

                  {/* Extra Details */}
                  <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Specifications / Model No (Optional)</label>
                        <input type="text" value={newItem.specifications || ""} onChange={(e) => setNewItem({...newItem, specifications: e.target.value})} placeholder="e.g. WH-1000XM4, Black" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Image URL (Optional)</label>
                        <input type="url" value={newItem.imageUrl || ""} onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})} placeholder="https://..." className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm transition-all" />
                        {newItem.imageUrl && (
                          <div className="mt-3 w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                             <img src={newItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button 
                      type="button"
                      onClick={() => setIsItemModalOpen(false)}
                      className="px-6 py-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold shadow-sm transition-all border border-accent"
                    >
                       Save Product
                    </button>
                  </div>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Product Modal */}
      <AnimatePresence>
        {shareItemModalOpen && itemToShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setShareItemModalOpen(false)}
          >
             <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800"
             >
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Send className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold tracking-tight">
                         Share Product
                       </h3>
                       <p className="text-xs text-neutral-500 font-medium truncate max-w-[200px]">{itemToShare.name}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShareItemModalOpen(false)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:text-rose-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-3">
                      <label className={cn("cursor-pointer border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors", shareMethod === 'whatsapp' ? 'border-accent bg-accent/5' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50')}>
                        <input type="radio" name="shareMethod" value="whatsapp" checked={shareMethod === 'whatsapp'} onChange={() => setShareMethod('whatsapp')} className="hidden" />
                        <div className="w-8 h-8 rounded bg-[#25D366] text-white flex items-center justify-center font-bold text-lg shrink-0">#</div>
                        <span className="font-bold text-sm leading-tight">WhatsApp</span>
                      </label>
                      <label className={cn("cursor-pointer border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors", shareMethod === 'instagram' ? 'border-accent bg-accent/5' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50')}>
                        <input type="radio" name="shareMethod" value="instagram" checked={shareMethod === 'instagram'} onChange={() => setShareMethod('instagram')} className="hidden" />
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4" /></div>
                        <span className="font-bold text-sm leading-tight">Instagram</span>
                      </label>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <label className={cn("cursor-pointer border rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center gap-1 transition-colors", shareMode === 'manual' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50')}>
                        <input type="radio" name="shareMode" value="manual" checked={shareMode === 'manual'} onChange={() => setShareMode('manual')} className="hidden" />
                        <span className="font-bold text-sm">Open App</span>
                        <span className="text-[10px] opacity-70 px-2 leading-tight">Opens default app to send msg</span>
                      </label>
                      <label className={cn("cursor-pointer border rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center gap-1 transition-colors", shareMode === 'api' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50')}>
                        <input type="radio" name="shareMode" value="api" checked={shareMode === 'api'} onChange={() => setShareMode('api')} className="hidden" />
                        <span className="font-bold text-sm">Send silently (API)</span>
                        <span className="text-[10px] opacity-70 px-2 leading-tight">Uses API for bulk/silent sending</span>
                      </label>
                   </div>

                   <div>
                      <div className="flex justify-between items-end mb-2">
                         <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Recipients (Phone numbers or IG Usernames)</label>
                         {leads.length > 0 && (
                            <div className="relative group">
                               <button className="text-xs text-accent font-bold flex items-center gap-1 hover:underline">
                                 <Users className="w-3 h-3" /> Select Leads
                               </button>
                               <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl p-2 hidden group-hover:flex flex-col z-50 max-h-48 overflow-y-auto">
                                  {leads.map(l => (
                                     <button 
                                        key={l.id} 
                                        className="text-left px-3 py-2 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-md"
                                        onClick={() => {
                                           const idValue = shareMethod === 'whatsapp' ? l.mobileNumber : l.instagramId;
                                           if (idValue) {
                                              setShareRecipients(prev => prev ? `${prev}, ${idValue}` : idValue);
                                           } else {
                                              toast.error(`Lead has no ${shareMethod} contact info`);
                                           }
                                        }}
                                     >
                                        {l.name} <span className="text-neutral-500 opacity-70 ml-1">({shareMethod === 'whatsapp' ? l.mobileNumber : l.instagramId || 'No IG'})</span>
                                     </button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                      <textarea
                         className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-accent text-sm resize-none font-mono"
                         rows={3}
                         placeholder={shareMethod === 'whatsapp' ? "+919876543210, +1234567890" : "username1, username2"}
                         value={shareRecipients}
                         onChange={(e) => setShareRecipients(e.target.value)}
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">Comma separated. Make sure numbers have country codes without + or 00.</p>
                   </div>
                   
                   <div className="pt-4">
                      <button
                         onClick={handleShareProductSend}
                         className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                         <Plane className="w-5 h-5 fill-current" />
                         Shoot to {shareRecipients ? shareRecipients.split(',').filter(Boolean).length : 0} Leads
                      </button>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          >
             <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center"
             >
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex justify-center items-center mx-auto mb-4">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-neutral-500 mb-6 px-4">
                  {confirmDialog.message}
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={confirmDialog.onConfirm}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-sm transition-all"
                  >
                    Confirm Action
                  </button>
                  <button 
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
