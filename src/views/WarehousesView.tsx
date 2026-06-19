import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Building, 
  Plus, 
  Search, 
  MapPin, 
  Store, 
  Warehouse, 
  Package,
  Users,
  MoreVertical,
  X,
  Edit2,
  Trash2
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where, deleteDoc, doc } from "firebase/firestore";
import toast from "react-hot-toast";

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  type: "Warehouse" | "Showroom";
  status: "Active" | "Maintenance";
  ownerId: string;
}

export function WarehousesView() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    location: "",
    type: "Warehouse" as "Warehouse" | "Showroom",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchWarehouses();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchWarehouses = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, "warehouses"), where("ownerId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WarehouseData[];
      setWarehouses(data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "warehouses"), {
        ...newWarehouse,
        status: "Active",
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Location added successfully");
      setIsAddModalOpen(false);
      setNewWarehouse({ name: "", location: "", type: "Warehouse" });
      fetchWarehouses();
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this location?")) return;
    try {
      await deleteDoc(doc(db, "warehouses", id));
      toast.success("Location removed");
      fetchWarehouses();
    } catch (error) {
      toast.error("Failed to remove location");
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Warehouses & Showrooms</h1>
          <p className="text-sm neu-text-muted mt-1">Connect and manage multiple retail and storage points.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search locations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full md:w-64 neu-pressed rounded-xl text-sm outline-none font-medium"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Connect Location
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin"></div>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="neu-flat rounded-2xl p-12 text-center">
          <div className="w-16 h-16 neu-pressed rounded-2xl flex items-center justify-center text-[var(--accent)] mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">No Locations Connected</h3>
          <p className="text-sm neu-text-muted mb-6">Manage all your showrooms and warehouses from one view.</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[var(--accent)] text-white px-6 py-2 rounded-xl font-bold"
          >
            Add First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map(w => (
            <motion.div 
              key={w.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neu-flat rounded-2xl p-6 relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl neu-pressed ${
                  w.type === "Showroom" ? "text-purple-500" : "text-blue-500"
                }`}>
                  {w.type === "Showroom" ? <Store className="w-6 h-6" /> : <Warehouse className="w-6 h-6" />}
                </div>
                <div className="flex items-center gap-1">
                   <button onClick={() => handleDelete(w.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-1">{w.name}</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] mb-4">
                <MapPin className="w-3.5 h-3.5" />
                {w.location}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="p-3 neu-pressed rounded-xl">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Staff</p>
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                       <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                       12 Members
                    </div>
                 </div>
                 <div className="p-3 neu-pressed rounded-xl">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Stock</p>
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                       <Package className="w-3.5 h-3.5 text-green-500" />
                       850 Units
                    </div>
                 </div>
              </div>

              <button className="w-full py-2.5 neu-pressed rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-all">
                Manage Inventory
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-md bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--shadow-dark)] overflow-hidden"
           >
              <div className="p-4 border-b border-[var(--shadow-dark)] flex items-center justify-between">
                <h3 className="font-bold text-lg">Connect New Location</h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddWarehouse} className="p-4 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Location Name</label>
                    <input 
                      type="text" 
                      value={newWarehouse.name}
                      onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                      placeholder="e.g., Downtown Showroom"
                      className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                      required
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Address / City</label>
                    <input 
                      type="text" 
                      value={newWarehouse.location}
                      onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})}
                      placeholder="e.g., MG Road, Block 4"
                      className="w-full p-3 neu-pressed rounded-xl border-none outline-none font-medium text-sm"
                      required
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Type</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         type="button"
                         onClick={() => setNewWarehouse({...newWarehouse, type: "Warehouse"})}
                         className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                           newWarehouse.type === "Warehouse" ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-transparent neu-pressed"
                         }`}
                       >
                         <Warehouse className={`w-6 h-6 ${newWarehouse.type === "Warehouse" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                         <span className="text-xs font-bold">Warehouse</span>
                       </button>
                       <button 
                         type="button"
                         onClick={() => setNewWarehouse({...newWarehouse, type: "Showroom"})}
                         className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                           newWarehouse.type === "Showroom" ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-transparent neu-pressed"
                         }`}
                       >
                         <Store className={`w-6 h-6 ${newWarehouse.type === "Showroom" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                         <span className="text-xs font-bold">Showroom</span>
                       </button>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-3 neu-flat rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      Save Location
                    </button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
}
